import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { notifyUsers } from "@/lib/notifyUsers";
import { getRequestUserId } from "@/lib/requestAuth";
import VendorApplication from "@/models/VendorApplication";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const getAdminIds = async () => {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 100 });

    return clerkUsers.data
        .filter((user) => (user.publicMetadata?.role || user.metadata?.role) === "admin")
        .map((user) => user.id)
        .filter(Boolean);
};

export async function POST(request) {
    try {
        const currentUserId = await getRequestUserId(request);
        const body = await request.json();

        const fullName = normalizeString(body.fullName);
        const email = normalizeString(body.email).toLowerCase();
        const phoneNumber = normalizeString(body.phoneNumber);
        const businessName = normalizeString(body.businessName);
        const businessLocation = normalizeString(body.businessLocation);
        const whatYouSell = normalizeString(body.whatYouSell);
        const notes = normalizeString(body.notes);

        if (!fullName || !email || !businessName || !businessLocation || !whatYouSell) {
            return NextResponse.json({ success: false, message: "Please complete all required application fields" }, { status: 400 });
        }

        if (!emailPattern.test(email)) {
            return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 });
        }

        await connectDB();

        const application = await VendorApplication.create({
            fullName,
            email,
            phoneNumber,
            businessName,
            businessLocation,
            whatYouSell,
            notes,
            submittedByUserId: currentUserId || "",
            source: "seller-landing",
            status: "pending",
        });

        const adminIds = await getAdminIds().catch(() => []);

        if (adminIds.length > 0) {
            await notifyUsers(adminIds.map((adminId) => ({
                userId: adminId,
                notification: {
                    type: "support",
                    title: "New vendor application",
                    message: `${businessName} - ${fullName}`,
                    read: false,
                    date: new Date(),
                },
                emailTitle: `New vendor application from ${fullName}`,
                emailMessage: [
                    `Name: ${fullName}`,
                    `Email: ${email}`,
                    `Phone: ${phoneNumber || "Not provided"}`,
                    `Business: ${businessName}`,
                    `Location: ${businessLocation}`,
                    `Products: ${whatYouSell}`,
                    notes ? `Notes: ${notes}` : "",
                ].filter(Boolean).join("\n"),
                ctaLabel: "Review applications",
                ctaPath: "/admin/management?tab=seller",
            })));
        }

        return NextResponse.json({
            success: true,
            message: "Your vendor application has been submitted. Our team will review it and contact you soon.",
            applicationId: String(application._id),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
