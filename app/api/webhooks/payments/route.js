import { NextResponse } from "next/server";
import { getActiveGateway } from "@/lib/payments";
import { settleTransaction } from "@/lib/paymentSettlement";

// Shared by both verbs. Gateways differ in how they notify — Flutterwave POSTs
// a signed JSON body, Pesapal GETs an unsigned query string — but the handling
// is identical because neither payload is trusted: we take only the transaction
// id from it and ask the gateway what really happened.
const handleNotification = async (request, { body = null } = {}) => {
    const gateway = getActiveGateway();

    if (!gateway) {
        return NextResponse.json({ success: false, message: "No payment gateway configured" }, { status: 503 });
    }

    if (!gateway.verifyWebhook(request.headers)) {
        return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const event = gateway.parseWebhook({ body, searchParams });

    // Some gateways require a specific acknowledgement shape or they keep
    // retrying; fall back to a plain success body when they do not.
    const ack = (message) => NextResponse.json(
        gateway.acknowledge ? gateway.acknowledge(event) : { success: true, message }
    );

    if (!event?.transactionId) {
        return ack("Ignored");
    }

    const result = await settleTransaction({
        gateway,
        transactionId: event.transactionId,
        fallbackReference: event.reference,
    });

    return ack(result.outcome);
};

// Flutterwave and most gateways POST a JSON body.
export async function POST(request) {
    try {
        const body = await request.json().catch(() => null);
        return await handleNotification(request, { body });
    } catch (error) {
        console.error("Payment webhook error:", error);
        // 500 asks the gateway to retry — better than silently losing a payment.
        return NextResponse.json({ success: false, message: "Webhook processing failed" }, { status: 500 });
    }
}

// Pesapal's IPN is a GET carrying OrderTrackingId in the query string.
export async function GET(request) {
    try {
        return await handleNotification(request);
    } catch (error) {
        console.error("Payment webhook error:", error);
        return NextResponse.json({ success: false, message: "Webhook processing failed" }, { status: 500 });
    }
}
