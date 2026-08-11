import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { notifyUsers } from "@/lib/notifyUsers";
import { getRequestUserId } from "@/lib/requestAuth";
import VendorApplication from "@/models/VendorApplication";

const VALID_STATUSES = ["pending", "reviewing", "approved", "rejected"];

const serializeApplication = (application) => ({
    _id: String(application._id),
    fullName: application.fullName || "",
    email: application.email || "",
    phoneNumber: application.phoneNumber || "",
    businessName: application.businessName || "",
    businessLocation: application.businessLocation || "",
    whatYouSell: application.whatYouSell || "",
    notes: application.notes || "",
    submittedByUserId: application.submittedByUserId || "",
    source: application.source || "seller-landing",
    status: application.status || "pending",
    date: application.date || null,
});

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const applications = await VendorApplication.find({})
            .sort({ date: -1 })
            .limit(200)
            .lean();

        return NextResponse.json({
            success: true,
            applications: applications.map(serializeApplication),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { applicationId, status } = await request.json();
        if (!applicationId || !VALID_STATUSES.includes(status)) {
            return NextResponse.json({ success: false, message: "Invalid application update" }, { status: 400 });
        }

        await connectDB();
        const application = await VendorApplication.findByIdAndUpdate(
            applicationId,
            { status },
            { new: true }
        );

        if (!application) {
            return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
        }

        if (application.submittedByUserId) {
            await notifyUsers([{
                userId: application.submittedByUserId,
                notification: {
                    type: "system",
                    title: "Vendor application updated",
                    message: `Your application for ${application.businessName} is now ${status}.`,
                    read: false,
                    date: new Date(),
                },
                emailTitle: "Wilwa vendor application updated",
                emailMessage: `Your vendor application for ${application.businessName} is now ${status}.`,
                ctaLabel: "Open Wilwa",
                ctaPath: "/",
            }]).catch(() => null);
        }

        return NextResponse.json({
            success: true,
            message: "Application updated",
            application: serializeApplication(application),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
