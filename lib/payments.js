import { PAYMENT_METHODS } from "@/lib/orderLifecycle";

// Payment provider architecture.
//
// COD settles in person (seller marks Paid). Every other method routes through
// the gateway named by PAYMENT_GATEWAY. Adding a second gateway means writing
// one object in GATEWAYS below and flipping that env var — checkout, the order
// API and the webhook route all talk to this interface, never to a gateway SDK.
//
// Provider contract:
//   name                          stable id, stored on the order as paymentGateway
//   isConfigured()                -> boolean; false makes checkout fall back to COD
//   initiate({ ... })             -> { ok, redirectUrl?, reference, transactionId?, raw? }
//   verify(transactionId)         -> { ok, status, amount, currency, reference, raw? }
//   verifyWebhook(headers)        -> boolean; signature check only, no side effects
//   parseWebhook({ body, searchParams })
//                                 -> { reference, transactionId, status } | null
//   acknowledge(event)?           -> optional body a gateway requires back
//
// verify() is the authority on whether money arrived. Callbacks are only ever
// used to learn *which* transaction to re-check — never for amounts or outcome.
// That is what lets Pesapal, which signs nothing, be handled safely.

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

// ---------------------------------------------------------------- Flutterwave

const FLW_API = "https://api.flutterwave.com/v3";

const flutterwaveRequest = async (path, { method = "GET", body = null } = {}) => {
    const response = await fetch(`${FLW_API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            `Flutterwave ${method} ${path} failed: ${response.status} ${payload?.message || "unknown error"}`
        );
    }

    return payload;
};

const flutterwaveProvider = {
    name: "flutterwave",

    isConfigured: () => Boolean(process.env.FLW_SECRET_KEY && process.env.FLW_WEBHOOK_HASH),

    // Creates a hosted checkout session covering the whole cart. `reference`
    // is the checkout's idempotency key, which is also the prefix of every
    // seller-order's idempotencyKey — that is how the webhook finds them again.
    initiate: async ({ reference, amount, customer, redirectUrl }) => {
        const payload = await flutterwaveRequest("/payments", {
            method: "POST",
            body: {
                tx_ref: reference,
                amount: String(amount),
                currency: CURRENCY,
                redirect_url: redirectUrl,
                // Restricting to Uganda mobile money keeps the hosted page from
                // offering cards we do not reconcile for. The one option covers
                // both MTN and Airtel; the shopper picks their network there.
                payment_options: "mobilemoneyuganda",
                customer: {
                    email: customer?.email || "",
                    phonenumber: customer?.phone || "",
                    name: customer?.name || "Customer",
                },
                customizations: {
                    title: "KawilMart",
                    description: "Payment for your KawilMart order",
                },
            },
        });

        const redirect = payload?.data?.link;

        if (!redirect) {
            throw new Error("Flutterwave did not return a checkout link");
        }

        return { ok: true, requiresRedirect: true, redirectUrl: redirect, reference, raw: payload };
    },

    // Server-to-server confirmation. Called after every webhook and on return
    // from the hosted page, so a spoofed webhook cannot mark an order paid.
    verify: async (transactionId) => {
        const payload = await flutterwaveRequest(`/transactions/${encodeURIComponent(transactionId)}/verify`);
        const data = payload?.data || {};
        const succeeded = String(data.status || "").toLowerCase() === "successful";

        return {
            ok: true,
            status: succeeded ? PAYMENT_RESULT_STATUSES.PAID : PAYMENT_RESULT_STATUSES.FAILED,
            amount: Number(data.amount) || 0,
            currency: data.currency || "",
            reference: data.tx_ref || "",
            transactionId: data.id ? String(data.id) : String(transactionId),
            raw: payload,
        };
    },

    verifyWebhook: (headers) => {
        const expected = process.env.FLW_WEBHOOK_HASH || "";
        const received = headers.get("verif-hash") || "";
        return Boolean(expected) && received === expected;
    },

    parseWebhook: ({ body }) => {
        const data = body?.data || {};

        if (!data.id) {
            return null;
        }

        return {
            reference: data.tx_ref || "",
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
//   2. The IPN carries NO signature — it is just a GET with query params. All
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
        firstName: parts[0] || "KawilMart",
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
                description: `KawilMart order ${reference}`.slice(0, 100),
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
                // INVALID means Pesapal has not resolved it yet — treat as
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
