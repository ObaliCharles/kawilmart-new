import { NextResponse } from "next/server";

// Payment gateway webhook endpoint (Flutterwave-ready). Inactive until a
// gateway is integrated: verify the signature header, look the order up by
// tx_ref (we send the order's idempotencyKey as tx_ref when initiating),
// then set paymentStatus to Paid/Failed accordingly.
export async function POST(request) {
    const signature = request.headers.get("verif-hash") || "";
    const expected = process.env.FLW_WEBHOOK_HASH || "";

    if (!expected || !signature || signature !== expected) {
        return NextResponse.json({ success: false, message: "Webhook not configured" }, { status: 401 });
    }

    // Gateway not activated yet — acknowledge so the provider stops retrying.
    return NextResponse.json({ success: true, message: "Received" });
}
