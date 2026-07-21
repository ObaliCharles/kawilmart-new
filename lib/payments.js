import { PAYMENT_METHODS } from "@/lib/orderLifecycle";

// Payment provider architecture.
//
// COD settles in person (seller marks Paid). Every other method routes through
// the gateway named by PAYMENT_GATEWAY. Adding a second gateway means writing
// one object in GATEWAYS below and flipping that env var — checkout, the order
// API and the webhook route all talk to this interface, never to a gateway SDK.
//
// Provider contract:
//   name                     stable id, stored on the order as paymentGateway
//   isConfigured()           -> boolean; false makes checkout fall back to COD
//   initiate({ ... })        -> { ok, redirectUrl?, reference, raw? }
//   verify(reference)        -> { ok, status, amount, currency, reference, raw? }
//   verifyWebhook(headers)   -> boolean; signature check only, no side effects
//   parseWebhook(body)       -> { reference, transactionId, status }
//
// verify() is the authority on whether money arrived. Webhook bodies are only
// ever used to learn *which* transaction to re-check — never for amounts.

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

    parseWebhook: (body) => {
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

// Placeholder so the second gateway is a fill-in-the-blanks job rather than a
// refactor. Implement against the same contract and set PAYMENT_GATEWAY=pesapal.
const pesapalProvider = {
    name: "pesapal",
    isConfigured: () => false,
    initiate: async () => {
        throw new Error("Pesapal provider is not implemented yet");
    },
    verify: async () => {
        throw new Error("Pesapal provider is not implemented yet");
    },
    verifyWebhook: () => false,
    parseWebhook: () => null,
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
