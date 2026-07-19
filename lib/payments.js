import { PAYMENT_METHODS } from "@/lib/orderLifecycle";

// Payment provider architecture. COD is fully handled today (settled in
// person, seller marks Paid). Mobile-money methods are recorded on the order
// now and route through this interface, so activating a real gateway
// (Flutterwave etc.) means implementing initiate/verify here plus the
// webhook in app/api/webhooks/payments — no checkout or order changes needed.
const codProvider = {
    name: "cash-on-delivery",
    // Nothing to initiate: payment happens at handover.
    initiate: async () => ({ ok: true, requiresRedirect: false }),
    verify: async () => ({ ok: true, status: "pending-collection" }),
};

const notYetIntegrated = (methodLabel) => ({
    name: "not-integrated",
    initiate: async () => ({
        ok: true,
        requiresRedirect: false,
        note: `${methodLabel} is collected on delivery until the payment gateway is activated.`,
    }),
    verify: async () => ({ ok: true, status: "pending-collection" }),
});

export const getPaymentProvider = (method) => {
    switch (method) {
        case PAYMENT_METHODS.MTN_MOMO:
            return notYetIntegrated("MTN Mobile Money");
        case PAYMENT_METHODS.AIRTEL_MONEY:
            return notYetIntegrated("Airtel Money");
        case PAYMENT_METHODS.COD:
        default:
            return codProvider;
    }
};
