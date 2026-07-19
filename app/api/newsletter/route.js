import connectDB from "@/config/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
    try {
        // No auth on this endpoint, so limit by IP.
        const clientIp = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
        const rateCheck = checkRateLimit(`newsletter:${clientIp}`, { limit: 5, windowMs: 10 * 60 * 1000 });
        if (!rateCheck.allowed) {
            return NextResponse.json(rateLimitResponse(rateCheck.retryAfterSeconds), { status: 429 });
        }

        const { email } = await request.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
            return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 });
        }

        await connectDB();

        const existingSubscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });
        if (existingSubscriber) {
            if (!existingSubscriber.active) {
                existingSubscriber.active = true;
                existingSubscriber.subscribedAt = new Date();
                await existingSubscriber.save();
            }

            return NextResponse.json({ success: true, message: "You are already subscribed to the newsletter" });
        }

        await NewsletterSubscriber.create({
            email: normalizedEmail,
            source: "homepage",
        });

        return NextResponse.json({ success: true, message: "Thanks for subscribing to our newsletter" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
