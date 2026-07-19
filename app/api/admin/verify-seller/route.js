import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { notifyUsers } from "@/lib/notifyUsers";

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sellerId, decision, notes } = await request.json();
        const normalizedDecision = typeof decision === "string" ? decision.trim().toUpperCase() : "";

        if (!sellerId || !["VERIFIED", "REJECTED"].includes(normalizedDecision)) {
            return NextResponse.json({ success: false, message: "sellerId and a VERIFIED/REJECTED decision are required" }, { status: 400 });
        }

        await connectDB();
        const seller = await User.findById(sellerId).select("isVerified verificationStatus verificationNotes name businessName");
        if (!seller) {
            return NextResponse.json({ success: false, message: "Seller not found" }, { status: 404 });
        }

        seller.verificationStatus = normalizedDecision;
        seller.isVerified = normalizedDecision === "VERIFIED";
        seller.verificationNotes = typeof notes === "string" ? notes.trim().slice(0, 500) : "";
        await seller.save();

        const approved = normalizedDecision === "VERIFIED";
        await notifyUsers([{
            userId: String(sellerId),
            notification: {
                type: "system",
                title: approved ? "Your store is now verified" : "Verification not approved",
                message: approved
                    ? "Your seller verification was approved. The verified badge now shows on your store and products."
                    : `Your verification request was not approved.${seller.verificationNotes ? ` Reason: ${seller.verificationNotes}` : ""} You can re-submit clearer documents.`,
                read: false,
                date: new Date(),
            },
            emailTitle: approved ? "KawilMart: store verified" : "KawilMart: verification update",
            emailMessage: approved
                ? "Congratulations — your KawilMart store is now verified."
                : "Your verification request was reviewed and not approved. Open your seller dashboard to re-submit.",
            ctaLabel: "Open seller dashboard",
            ctaPath: "/seller/verification",
        }]);

        return NextResponse.json({ success: true, message: approved ? "Seller verified" : "Verification rejected" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
