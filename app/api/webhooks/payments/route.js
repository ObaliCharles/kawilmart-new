import { NextResponse } from "next/server";
import { getActiveGateway } from "@/lib/payments";
import { settleTransaction } from "@/lib/paymentSettlement";

// Shared by both verbs. Gateways differ in how they notify. Flutterwave POSTs
// a signed JSON body, Pesapal GETs an unsigned query string, but the handling
// is identical because neither payload is trusted: we take only the transaction
// id from it and ask the gateway what really happened.
const handleNotification = async (request, { body = null, rawBody = "" } = {}) => {
    const gateway = getActiveGateway();

    if (!gateway) {
        return NextResponse.json({ success: false, message: "No payment gateway configured" }, { status: 503 });
    }

    // A server that cannot check signatures at all is a configuration problem,
    // not a bad caller. Saying so separately turns an unexplainable 401 into an
    // actionable message, and 503 keeps the gateway retrying, so the payment
    // still settles once the secret is filled in.
    if (typeof gateway.canVerifyWebhook === "function" && !gateway.canVerifyWebhook()) {
        console.error(
            "Webhook rejected: no webhook secret configured on this server. Set FLW_WEBHOOK_HASH to the same secret hash as the Flutterwave dashboard webhook."
        );
        return NextResponse.json({
            success: false,
            message: "Webhook secret is not configured on the server",
        }, { status: 503 });
    }

    // Signatures are computed over the exact bytes received, so the raw text is
    // passed through rather than a re-serialised copy of the parsed body.
    if (!gateway.verifyWebhook(request.headers, rawBody)) {
        // Enough to tell a wrong secret from an unexpected signing scheme
        // without ever logging the secret itself: which header arrived, how
        // long its value is, and how big the signed payload was.
        const seen = ["flutterwave-signature", "verif-hash"]
            .map((name) => {
                const value = request.headers.get(name);
                return value ? `${name}(len=${value.length})` : null;
            })
            .filter(Boolean);

        console.error(
            "Webhook signature rejected."
            + ` Signature headers present: ${seen.length ? seen.join(", ") : "NONE"}.`
            + ` Raw body length: ${rawBody.length}.`
            + " If a header is present and the secret matches the Flutterwave dashboard, the signing scheme differs from what is implemented — capture these headers and compare."
        );

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
        // Read as text first: the signature covers these exact bytes, and
        // request.json() would consume the stream and lose them.
        const rawBody = await request.text().catch(() => "");
        let body = null;
        try {
            body = rawBody ? JSON.parse(rawBody) : null;
        } catch {
            body = null;
        }
        return await handleNotification(request, { body, rawBody });
    } catch (error) {
        console.error("Payment webhook error:", error);
        // 500 asks the gateway to retry. Better than silently losing a payment.
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
