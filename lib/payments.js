import { createHmac, timingSafeEqual } from "crypto";
import { PAYMENT_METHODS } from "@/lib/orderLifecycle";

// Payment provider architecture.
//
// COD settles in person (seller marks Paid). Every other method routes through
// the gateway named by PAYMENT_GATEWAY. Adding a second gateway means writing
// one object in GATEWAYS below and flipping that env var. Checkout, the order
// API and the webhook route all talk to this interface, never to a gateway SDK.
//
// Provider contract:
//   name                          stable id, stored on the order as paymentGateway
//   isConfigured()                -> boolean; false makes checkout fall back to COD
//   initiate({ ... })             -> { ok, redirectUrl?, reference, transactionId?, raw? }
//   verify(transactionId)         -> { ok, status, amount, currency, reference, raw? }
//   verifyByReference(reference)? -> same shape; for gateways that mint no
//                                    transaction id until the shopper pays
//   verifyWebhook(headers)        -> boolean; signature check only, no side effects
//   parseWebhook({ body, searchParams })
//                                 -> { reference, transactionId, status } | null
//   acknowledge(event)?           -> optional body a gateway requires back
//
// verify() is the authority on whether money arrived. Callbacks are only ever
// used to learn *which* transaction to re-check, never for amounts or outcome.
// That is what lets Pesapal, which signs nothing, be handled safely.
//
// Flutterwave is the active gateway (PAYMENT_GATEWAY=flutterwave); Pesapal is
// kept behind the same interface so it can be switched back via that env var.

export const PAYMENT_RESULT_STATUSES = {
    PAID: "paid",
    FAILED: "failed",
    PENDING: "pending",
    PENDING_COLLECTION: "pending-collection",
};

const CURRENCY = "UGX";

const codProvider = {
    name: "cash-on-delivery",
    isConfigured: () => true,
    // Nothing to initiate: payment happens at handover.
    initiate: async () => ({ ok: true, requiresRedirect: false, reference: "" }),
    verify: async () => ({ ok: true, status: PAYMENT_RESULT_STATUSES.PENDING_COLLECTION }),
    verifyWebhook: () => false,
    parseWebhook: () => null,
};

// ------------------------------------------------------------- Flutterwave v4

// Flutterwave API v4. Differs from v3 in three ways that shape this code:
//   1. Auth is OAuth2 client-credentials against a separate identity host, and
//      tokens live ~10 minutes, so they are fetched on demand and cached.
//   2. Sandbox and live are DIFFERENT hosts with different credentials (there
//      is no TEST-key prefix to sniff), so FLW_ENV picks the base URL.
//   3. A charge needs a customer and a payment method to exist first, so one
//      checkout is four calls: token -> customer -> payment method -> charge.
//
// Verified against the sandbox: redirect_url MUST be https (http://localhost is
// rejected with REDIRECT_URL_INVALID), Uganda networks are "MTN" and "AIRTEL",
// and customer names must be 2-50 letter-ish characters.
const FLW_TOKEN_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";
const FLW_SANDBOX_API = "https://developersandbox-api.flutterwave.com";
const FLW_LIVE_API = "https://api.flutterwave.com";

const flutterwaveEnv = () => (
    String(process.env.FLW_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox"
);

const flutterwaveBaseUrl = () => (
    process.env.FLW_API_BASE_URL || (flutterwaveEnv() === "live" ? FLW_LIVE_API : FLW_SANDBOX_API)
);

let flutterwaveToken = { value: "", expiresAt: 0 };

const flutterwaveAccessToken = async () => {
    if (flutterwaveToken.value && Date.now() < flutterwaveToken.expiresAt) {
        return flutterwaveToken.value;
    }

    const response = await fetch(FLW_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: String(process.env.FLW_CLIENT_ID || "").trim(),
            client_secret: String(process.env.FLW_CLIENT_SECRET || "").trim(),
            grant_type: "client_credentials",
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.access_token) {
        throw new Error(
            `Flutterwave auth failed: ${response.status} ${payload?.error_description || payload?.error || "no access token returned"}`
        );
    }

    // Expire a minute early so a request can never carry a token that dies
    // mid-flight.
    const ttl = (Number(payload.expires_in) || 600) * 1000;
    flutterwaveToken = { value: payload.access_token, expiresAt: Date.now() + Math.max(ttl - 60_000, 30_000) };
    return flutterwaveToken.value;
};

const randomId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const flutterwaveRequest = async (path, { method = "GET", body = null } = {}) => {
    const token = await flutterwaveAccessToken();

    const response = await fetch(`${flutterwaveBaseUrl()}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Trace-Id": randomId(),
            "X-Idempotency-Key": randomId(),
            // Sandbox mobile money otherwise answers with an on-phone
            // authorisation prompt, which has no URL to send the shopper to.
            ...(flutterwaveEnv() === "sandbox" ? { "X-Scenario-Key": "scenario:auth_redirect" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail = payload?.error?.validation_errors?.map((e) => `${e.field_name}: ${e.message}`).join("; ")
            || payload?.error?.message
            || payload?.message
            || "unknown error";
        throw new Error(`Flutterwave ${method} ${path} failed: ${response.status} ${detail}`);
    }

    return payload;
};

// Flutterwave rejects names outside this shape, and a shipping name is free
// text, so it is scrubbed to something the API will accept rather than failing
// the whole checkout over a stray digit.
const toFlutterwaveName = (value, fallback) => {
    const cleaned = String(value || "").replace(/[^A-Za-z ,.'-]/g, "").trim().slice(0, 50);
    return cleaned.length >= 2 ? cleaned : fallback;
};

const splitCustomerName = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    return {
        first: toFlutterwaveName(parts[0], "Wilwa"),
        last: toFlutterwaveName(parts.slice(1).join(" "), "Customer"),
    };
};

// Flutterwave wants the national number with the country code supplied
// separately, so 0770… / +256770… / 256770… all reduce to 770….
const toUgandaMsisdn = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("256")) return digits.slice(3);
    if (digits.startsWith("0")) return digits.slice(1);
    return digits;
};

// Ugandan mobile numbers are 9 national digits beginning with 7.
const isUgandaMsisdn = (value = "") => /^7\d{8}$/.test(value);

// Flutterwave 400s on anything it does not consider an email, which would fail
// the whole checkout over a stale profile field.
const isEmailish = (value = "") => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(value).trim());

// Flutterwave refuses to create a customer whose email already exists (409
// RESOURCE_CONFLICT), and its customer list cannot be filtered by email, so an
// existing id cannot be looked up reliably. Every checkout therefore gets a
// unique plus-addressed variant of the shopper's real address: unique enough
// that a repeat purchase never collides, while still delivering to their real
// mailbox. Without this, a shopper's SECOND order could never be paid for.
const toFlutterwaveEmail = (value, reference) => {
    const tag = String(reference || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "wlw";
    const trimmed = String(value || "").trim();

    if (!isEmailish(trimmed)) {
        return `shopper+${tag}@wilwa.app`;
    }

    const at = trimmed.lastIndexOf("@");
    const local = trimmed.slice(0, at).slice(0, 40);
    const domain = trimmed.slice(at + 1);
    return `${local}+wlw${tag}@${domain}`;
};

// Marks failures the shopper can actually fix, so checkout can say what to do
// instead of the generic "we could not reach the payment provider".
export class PaymentDataError extends Error {
    constructor(message) {
        super(message);
        this.name = "PaymentDataError";
        this.userMessage = message;
    }
}

const flutterwaveNetwork = (method) => (
    method === PAYMENT_METHODS.AIRTEL_MONEY ? "AIRTEL" : "MTN"
);

// Shared by verify() and verifyByReference(). "succeeded" is the only status
// that releases goods; anything still in flight stays pending so a live payment
// is never voided (and its stock released) while the shopper is mid-flow.
const toFlutterwaveResult = (charge, fallbackTransactionId = "") => {
    const status = String(charge?.status || "").toLowerCase();
    const paid = status === "succeeded" || status === "successful";
    const pending = status === "pending" || status === "processing" || status === "";

    return {
        ok: true,
        status: paid
            ? PAYMENT_RESULT_STATUSES.PAID
            : pending
                ? PAYMENT_RESULT_STATUSES.PENDING
                : PAYMENT_RESULT_STATUSES.FAILED,
        amount: Number(charge?.amount) || 0,
        currency: charge?.currency || "",
        reference: charge?.reference || "",
        transactionId: charge?.id ? String(charge.id) : String(fallbackTransactionId || ""),
        method: charge?.payment_method_details?.type || "",
        raw: charge,
    };
};

const flutterwaveProvider = {
    name: "flutterwave",

    // Only the OAuth credentials are required to take payments.
    // FLW_WEBHOOK_HASH is needed to *trust* incoming webhooks, not to start a
    // checkout — gating on it meant you could not test payments without first
    // exposing a public webhook URL. Without it, verifyWebhook() below rejects
    // every callback (fail-closed) and orders settle via the return page, which
    // re-verifies server-to-server anyway.
    isConfigured: () => {
        if (!process.env.FLW_CLIENT_ID || !process.env.FLW_CLIENT_SECRET) {
            return false;
        }

        if (!process.env.FLW_WEBHOOK_HASH) {
            console.warn(
                "Flutterwave: FLW_WEBHOOK_HASH is not set. Payments will work, but incoming webhooks are rejected as unsigned; orders settle when the shopper returns from the payment page. Set it before going live."
            );
        }

        return true;
    },

    // Opens a hosted mobile-money checkout for the whole cart. `reference` is
    // the checkout's idempotency key, which the webhook and return page both
    // use to find the orders again.
    initiate: async ({ reference, amount, customer, redirectUrl, method }) => {
        if (!/^https:/i.test(String(redirectUrl || ""))) {
            throw new Error(
                `Flutterwave rejects non-https redirect URLs (got "${redirectUrl}"). Set APP_BASE_URL to an https address — for local testing use a tunnel such as ngrok.`
            );
        }

        const { first, last } = splitCustomerName(customer?.name);
        const phone = toUgandaMsisdn(customer?.phone);

        // Checked before any API call: mobile money is charged to this number,
        // so without a usable one the gateway 400s on /payment-methods with a
        // message no shopper could act on.
        if (!isUgandaMsisdn(phone)) {
            throw new PaymentDataError(
                "Add a valid Ugandan mobile money number (e.g. 0770123456) to your delivery address before paying by mobile money."
            );
        }

        const createCustomer = (email) => flutterwaveRequest("/customers", {
            method: "POST",
            body: {
                email,
                name: { first, last },
                phone: { country_code: "256", number: phone },
            },
        });

        let customerPayload;
        try {
            customerPayload = await createCustomer(toFlutterwaveEmail(customer?.email, reference));
        } catch (error) {
            // Belt and braces: if the address still collided, fall back to a
            // fully synthetic one rather than dead-ending the checkout.
            if (!/409|already exists/i.test(error.message)) {
                throw error;
            }
            customerPayload = await createCustomer(`shopper+${randomId()}@wilwa.app`);
        }

        const customerId = customerPayload?.data?.id;
        if (!customerId) {
            throw new Error("Flutterwave did not return a customer id");
        }

        const paymentMethodPayload = await flutterwaveRequest("/payment-methods", {
            method: "POST",
            body: {
                type: "mobile_money",
                mobile_money: {
                    country_code: "256",
                    network: flutterwaveNetwork(method),
                    phone_number: phone,
                },
            },
        });

        const paymentMethodId = paymentMethodPayload?.data?.id;
        if (!paymentMethodId) {
            throw new Error("Flutterwave did not return a payment method id");
        }

        const chargePayload = await flutterwaveRequest("/charges", {
            method: "POST",
            body: {
                reference,
                currency: CURRENCY,
                amount: Number(amount),
                customer_id: customerId,
                payment_method_id: paymentMethodId,
                redirect_url: redirectUrl,
            },
        });

        const charge = chargePayload?.data || {};
        const nextAction = charge.next_action;
        const hostedUrl = nextAction?.redirect_url?.url;

        if (!hostedUrl) {
            throw new Error(
                `Flutterwave returned no redirect URL (next_action was "${nextAction?.type || "none"}")`
            );
        }

        return {
            ok: true,
            requiresRedirect: true,
            redirectUrl: hostedUrl,
            // v4 mints the charge id up front, so the return page can settle the
            // order even if the webhook never arrives.
            transactionId: charge.id ? String(charge.id) : "",
            reference: charge.reference || reference,
            raw: chargePayload,
        };
    },

    // Server-to-server confirmation. Called after every webhook and on return
    // from the hosted page, so a spoofed webhook cannot mark an order paid.
    verify: async (chargeId) => {
        const payload = await flutterwaveRequest(`/charges/${encodeURIComponent(chargeId)}`);
        return toFlutterwaveResult(payload?.data, chargeId);
    },

    // Fallback for when the return URL carries no charge id.
    verifyByReference: async (reference) => {
        const payload = await flutterwaveRequest(`/charges?reference=${encodeURIComponent(reference)}`);
        const charge = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;

        if (!charge) {
            return { ok: true, status: PAYMENT_RESULT_STATUSES.PENDING, amount: 0, currency: "", reference, transactionId: "" };
        }

        return toFlutterwaveResult(charge, "");
    },

    // Whether a signature CAN be checked at all. Distinguishes "no secret
    // configured on this server" from "this request was not genuine", which
    // otherwise look identical from outside and are fixed very differently.
    canVerifyWebhook: () => Boolean(String(process.env.FLW_WEBHOOK_HASH || "").trim()),

    // v4 signs the RAW request body: flutterwave-signature is
    // base64(HMAC-SHA256(rawBody, secretHash)) — not the secret itself, which
    // is how v3 worked. The raw text matters: re-serialising a parsed object
    // can change byte-for-byte and would never match.
    verifyWebhook: (headers, rawBody = "") => {
        const secret = String(process.env.FLW_WEBHOOK_HASH || "").trim();
        const received = headers.get("flutterwave-signature") || headers.get("verif-hash") || "";

        if (!secret || !received) {
            return false;
        }

        const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
        const a = Buffer.from(expected);
        const b = Buffer.from(received);

        // Constant-time compare; timingSafeEqual throws on length mismatch.
        return a.length === b.length && timingSafeEqual(a, b);
    },

    parseWebhook: ({ body }) => {
        const data = body?.data || {};

        if (!data.id) {
            return null;
        }

        return {
            reference: data.reference || data.tx_ref || "",
            transactionId: String(data.id),
            status: String(data.status || "").toLowerCase(),
        };
    },
};

// --------------------------------------------------------------------- Pesapal

// Pesapal API v3. Two things differ from a typical gateway and shape the code
// below:
//   1. Every call needs a bearer token from RequestToken that expires after
//      ~5 minutes, so tokens are fetched on demand and cached with a margin.
//   2. The IPN carries NO signature. It is just a GET with query params. All
//      trust therefore comes from re-querying GetTransactionStatus, which this
//      architecture already does for every gateway. Nothing in the callback
//      payload is ever believed on its own.
const PESAPAL_LIVE_API = "https://pay.pesapal.com/v3";
const PESAPAL_SANDBOX_API = "https://cybqa.pesapal.com/pesapalv3";

const pesapalBaseUrl = () => (
    String(process.env.PESAPAL_ENV || "sandbox").toLowerCase() === "live"
        ? PESAPAL_LIVE_API
        : PESAPAL_SANDBOX_API
);

// Pesapal status_code values from GetTransactionStatus.
const PESAPAL_STATUS = { INVALID: 0, COMPLETED: 1, FAILED: 2, REVERSED: 3 };

let cachedToken = { value: "", expiresAt: 0 };

const pesapalToken = async () => {
    if (cachedToken.value && Date.now() < cachedToken.expiresAt) {
        return cachedToken.value;
    }

    const response = await fetch(`${pesapalBaseUrl()}/api/Auth/RequestToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.token) {
        throw new Error(
            `Pesapal auth failed: ${response.status} ${payload?.error?.message || payload?.message || "no token returned"}`
        );
    }

    // Tokens last 5 minutes; expire ours a minute early so a request can never
    // be sent with a token that dies mid-flight.
    cachedToken = { value: payload.token, expiresAt: Date.now() + 4 * 60 * 1000 };
    return cachedToken.value;
};

const pesapalRequest = async (path, { method = "GET", body = null } = {}) => {
    const token = await pesapalToken();

    const response = await fetch(`${pesapalBaseUrl()}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    // Pesapal returns HTTP 200 with an `error` object on failure, so the status
    // code alone is not enough to tell whether the call worked.
    if (!response.ok || payload?.error?.code || payload?.error?.message) {
        throw new Error(
            `Pesapal ${method} ${path} failed: ${response.status} ${payload?.error?.message || payload?.message || "unknown error"}`
        );
    }

    return payload;
};

const splitName = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || "Wilwa",
        lastName: parts.slice(1).join(" ") || "Customer",
    };
};

// Pesapal wants a bare MSISDN. Local 07XXXXXXXX numbers are normalised to the
// 2567XXXXXXXX form it expects.
const normalizePesapalPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("256")) return digits;
    if (digits.startsWith("0")) return `256${digits.slice(1)}`;
    return digits.length === 9 ? `256${digits}` : digits;
};

export const registerPesapalIpn = async (url) => {
    const payload = await pesapalRequest("/api/URLSetup/RegisterIPN", {
        method: "POST",
        body: { url, ipn_notification_type: "GET" },
    });

    return { ipnId: payload?.ipn_id || "", url: payload?.url || url, raw: payload };
};

const pesapalProvider = {
    name: "pesapal",

    isConfigured: () => Boolean(
        process.env.PESAPAL_CONSUMER_KEY
        && process.env.PESAPAL_CONSUMER_SECRET
        && process.env.PESAPAL_IPN_ID
    ),

    initiate: async ({ reference, amount, customer, redirectUrl }) => {
        const { firstName, lastName } = splitName(customer?.name);
        const phone = normalizePesapalPhone(customer?.phone);

        const payload = await pesapalRequest("/api/Transactions/SubmitOrderRequest", {
            method: "POST",
            body: {
                id: reference,
                currency: CURRENCY,
                amount: Number(amount),
                description: `Wilwa order ${reference}`.slice(0, 100),
                callback_url: redirectUrl,
                notification_id: process.env.PESAPAL_IPN_ID,
                billing_address: {
                    email_address: customer?.email || "",
                    phone_number: phone,
                    country_code: "UG",
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (!payload?.redirect_url) {
            throw new Error("Pesapal did not return a redirect URL");
        }

        return {
            ok: true,
            requiresRedirect: true,
            redirectUrl: payload.redirect_url,
            // order_tracking_id is Pesapal's handle for the transaction and the
            // only thing GetTransactionStatus accepts later.
            transactionId: payload.order_tracking_id || "",
            reference: payload.merchant_reference || reference,
            raw: payload,
        };
    },

    // The single source of truth. Called for every IPN and on return from the
    // hosted page, because the IPN itself proves nothing.
    verify: async (orderTrackingId) => {
        const payload = await pesapalRequest(
            `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`
        );

        const statusCode = Number(payload?.status_code);
        const status = statusCode === PESAPAL_STATUS.COMPLETED
            ? PAYMENT_RESULT_STATUSES.PAID
            : statusCode === PESAPAL_STATUS.INVALID
                // INVALID means Pesapal has not resolved it yet. Treat as
                // pending so a still-processing payment is not voided and its
                // stock released while the shopper is mid-flow.
                ? PAYMENT_RESULT_STATUSES.PENDING
                : PAYMENT_RESULT_STATUSES.FAILED;

        return {
            ok: true,
            status,
            amount: Number(payload?.amount) || 0,
            currency: payload?.currency || "",
            reference: payload?.merchant_reference || "",
            transactionId: String(orderTrackingId),
            method: payload?.payment_method || "",
            raw: payload,
        };
    },

    // Pesapal signs nothing, so there is no signature to check. Returning true
    // is safe only because verify() re-queries Pesapal for the real outcome.
    verifyWebhook: () => true,

    parseWebhook: ({ searchParams }) => {
        const trackingId = searchParams?.get("OrderTrackingId") || "";
        if (!trackingId) return null;

        return {
            reference: searchParams.get("OrderMerchantReference") || "",
            transactionId: trackingId,
            status: "",
            notificationType: searchParams.get("OrderNotificationType") || "IPNCHANGE",
        };
    },

    // Pesapal retries until it receives this exact acknowledgement shape.
    acknowledge: (event) => ({
        orderNotificationType: event?.notificationType || "IPNCHANGE",
        orderTrackingId: event?.transactionId || "",
        orderMerchantReference: event?.reference || "",
        status: 200,
    }),
};

const GATEWAYS = {
    flutterwave: flutterwaveProvider,
    pesapal: pesapalProvider,
};

// The gateway that online payments route to. Unset/unknown/unconfigured means
// no gateway is live and mobile-money orders stay collect-on-delivery, which is
// exactly the behaviour before any gateway was wired up.
export const getActiveGateway = () => {
    const configured = String(process.env.PAYMENT_GATEWAY || "").toLowerCase();
    const gateway = GATEWAYS[configured];

    if (!gateway || !gateway.isConfigured()) {
        return null;
    }

    return gateway;
};

export const isOnlinePaymentMethod = (method) => (
    method === PAYMENT_METHODS.MTN_MOMO || method === PAYMENT_METHODS.AIRTEL_MONEY
);

// True when this checkout should be paid before the order is confirmed.
export const requiresUpfrontPayment = (method) => (
    isOnlinePaymentMethod(method) && Boolean(getActiveGateway())
);

const notYetIntegrated = (methodLabel) => ({
    name: "not-integrated",
    isConfigured: () => true,
    initiate: async () => ({
        ok: true,
        requiresRedirect: false,
        reference: "",
        note: `${methodLabel} is collected on delivery until the payment gateway is activated.`,
    }),
    verify: async () => ({ ok: true, status: PAYMENT_RESULT_STATUSES.PENDING_COLLECTION }),
    verifyWebhook: () => false,
    parseWebhook: () => null,
});

export const getPaymentProvider = (method) => {
    if (isOnlinePaymentMethod(method)) {
        return getActiveGateway() || notYetIntegrated(
            method === PAYMENT_METHODS.MTN_MOMO ? "MTN Mobile Money" : "Airtel Money"
        );
    }

    return codProvider;
};
