// Sends one real notification email through the configured provider, using the
// exact same template the app uses for order/status/account notifications. Use
// it to prove Resend credentials + DNS are working before wiring anything to a
// live order.
//
// Usage: node scripts/testNotificationEmail.mjs you@example.com
//
// Reads the same env vars as lib/email.js (EMAIL_ENABLED, RESEND_API_KEY,
// EMAIL_FROM, EMAIL_REPLY_TO, APP_BASE_URL). It temporarily forces
// EMAIL_ENABLED=true so you can test while the app itself is still switched
// off — everything else must be configured for real.

import "dotenv/config";

const recipient = process.argv[2];

if (!recipient || !recipient.includes("@")) {
    console.error("Usage: node scripts/testNotificationEmail.mjs you@example.com");
    process.exit(1);
}

// Force-enable for this one-off run; the app's own EMAIL_ENABLED stays as-is.
process.env.EMAIL_ENABLED = "true";
process.env.EMAIL_DEBUG = "true";

const { createNotificationEmail, sendEmail } = await import("../lib/email.js");

const missing = [
    ["RESEND_API_KEY", process.env.RESEND_API_KEY],
    ["EMAIL_FROM", process.env.EMAIL_FROM],
    ["APP_BASE_URL", process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL],
].filter(([, value]) => !value || String(value).includes("your"));

if (missing.length) {
    console.error("These env vars are missing or still placeholders:");
    missing.forEach(([name, value]) => console.error(`  - ${name}${value ? ` (= ${value})` : ""}`));
    process.exit(1);
}

const payload = createNotificationEmail({
    recipientName: "KawilMart Tester",
    title: "Email delivery is working",
    message: "If you are reading this in your inbox, KawilMart notification emails are correctly configured and ready to switch on.",
    ctaLabel: "Open KawilMart",
    ctaPath: "/",
    details: [
        { label: "provider", value: process.env.EMAIL_PROVIDER || "resend" },
        { label: "from", value: process.env.EMAIL_FROM },
    ],
});

const result = await sendEmail({
    to: recipient,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
});

if (result.success) {
    console.log(`\n✅ Sent to ${recipient}. Check the inbox (and spam folder on the first send).`);
    console.log("   Confirm the KawilMart logo renders in the header — a broken image means APP_BASE_URL is not publicly reachable.");
    process.exit(0);
}

console.error(`\n❌ Not sent. reason=${result.reason}${result.message ? ` message=${result.message}` : ""}`);
process.exit(1);
