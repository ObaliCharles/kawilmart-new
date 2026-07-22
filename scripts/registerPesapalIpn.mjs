// One-time Pesapal setup: registers your IPN (webhook) URL and prints the
// PESAPAL_IPN_ID you must put in .env. Pesapal refuses to submit any order
// without a registered notification_id, so this has to run before the gateway
// will take a single payment.
//
// Usage:
//   node scripts/registerPesapalIpn.mjs                       (uses APP_BASE_URL)
//   node scripts/registerPesapalIpn.mjs https://your-tunnel.dev
//
// Re-running creates another registration rather than replacing the old one —
// harmless, but keep the id you actually paste into .env.
//
// Requires PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET and PESAPAL_ENV.

import "dotenv/config";

const LIVE = "https://pay.pesapal.com/v3";
const SANDBOX = "https://cybqa.pesapal.com/pesapalv3";

const env = String(process.env.PESAPAL_ENV || "sandbox").toLowerCase();
const base = env === "live" ? LIVE : SANDBOX;

const baseUrl = (process.argv[2] || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
    console.error("Missing PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET in .env");
    process.exit(1);
}

if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    console.error("No base URL. Pass one as an argument or set APP_BASE_URL in .env.");
    console.error("Example: node scripts/registerPesapalIpn.mjs https://abc123.trycloudflare.com");
    process.exit(1);
}

if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    console.error("Pesapal must be able to reach this URL from the internet — localhost will not work.");
    console.error("Start a tunnel first:  npx cloudflared tunnel --url http://localhost:3000");
    process.exit(1);
}

const ipnUrl = `${baseUrl}/api/webhooks/payments`;

console.log(`Environment : ${env}`);
console.log(`API         : ${base}`);
console.log(`IPN URL     : ${ipnUrl}\n`);

const authResponse = await fetch(`${base}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
});

const auth = await authResponse.json().catch(() => ({}));

if (!auth?.token) {
    console.error("Could not authenticate with Pesapal.");
    console.error(auth?.error || auth);
    process.exit(1);
}

console.log("Authenticated.\n");

const registerResponse = await fetch(`${base}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    // GET, because app/api/webhooks/payments exports a GET handler for Pesapal.
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
});

const registration = await registerResponse.json().catch(() => ({}));

if (!registration?.ipn_id) {
    console.error("IPN registration failed.");
    console.error(registration?.error || registration);
    process.exit(1);
}

console.log("IPN registered.\n");
console.log("Add this to your .env:\n");
console.log(`PESAPAL_IPN_ID=${registration.ipn_id}\n`);
console.log("Then set PAYMENT_GATEWAY=pesapal and restart the dev server.");
