import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { registerPesapalIpn } from "@/lib/payments";

// One-time (per environment) Pesapal setup helper.
//
// Pesapal's SubmitOrderRequest requires a notification_id that only exists once
// you have registered your IPN (webhook) URL with them. That registration is
// what this route does: it POSTs the URL to Pesapal and returns the ipn_id,
// which you then paste into .env as PESAPAL_IPN_ID and restart the app.
//
// Admin-only, because it authenticates against Pesapal with our secret and
// mutates the merchant account's registered notification URLs.
//
// The IPN URL registered is always <base>/api/webhooks/payments — the same
// endpoint that actually receives Pesapal's GET notifications. `base` comes
// from the request body if provided, otherwise APP_BASE_URL / NEXT_PUBLIC_APP_URL.
// It MUST be a public https URL Pesapal can reach; localhost will not work.
export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
            return NextResponse.json(
                { success: false, message: "PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET are not set." },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const rawBase = String(
            body?.baseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ""
        ).replace(/\/$/, "");

        if (!rawBase) {
            return NextResponse.json(
                { success: false, message: "No base URL. Set APP_BASE_URL or pass { baseUrl } in the request body." },
                { status: 400 }
            );
        }

        const ipnUrl = `${rawBase}/api/webhooks/payments`;

        // Guard against the single most common sandbox mistake: registering a
        // localhost URL Pesapal can never call back.
        if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(ipnUrl)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The IPN URL points at localhost, which Pesapal cannot reach. Expose your app with a public https tunnel (e.g. ngrok) and pass that as { baseUrl }.",
                    attemptedUrl: ipnUrl,
                },
                { status: 400 }
            );
        }

        const { ipnId, url, raw } = await registerPesapalIpn(ipnUrl);

        if (!ipnId) {
            return NextResponse.json(
                { success: false, message: "Pesapal did not return an ipn_id.", raw },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            ipnId,
            registeredUrl: url,
            environment: String(process.env.PESAPAL_ENV || "sandbox").toLowerCase(),
            next: `Add this to your .env, then restart:  PESAPAL_IPN_ID=${ipnId}`,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
