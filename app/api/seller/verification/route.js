import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import { validateUploadFile } from "@/lib/uploadValidation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const MAX_VERIFICATION_DOCUMENTS = 5;

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId || !(await authSeller(userId))) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(userId)
            .select("isVerified verificationStatus verificationDocuments verificationNotes")
            .lean();

        if (!user) {
            return NextResponse.json({ success: false, message: "Account not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            verification: {
                isVerified: Boolean(user.isVerified),
                status: user.verificationStatus || (user.isVerified ? "VERIFIED" : "UNVERIFIED"),
                documents: user.verificationDocuments || [],
                notes: user.verificationNotes || "",
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId || !(await authSeller(userId))) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const rateCheck = checkRateLimit(`seller-verification:${userId}`, { limit: 6, windowMs: 10 * 60 * 1000 });
        if (!rateCheck.allowed) {
            return NextResponse.json(rateLimitResponse(rateCheck.retryAfterSeconds), { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get("document");

        if (!isUploadedFile(file)) {
            return NextResponse.json({ success: false, message: "Attach a document image" }, { status: 400 });
        }

        const validation = validateUploadFile(file, { maxBytes: 6 * 1024 * 1024 });
        if (!validation.ok) {
            return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(userId).select("verificationStatus verificationDocuments isVerified");
        if (!user) {
            return NextResponse.json({ success: false, message: "Account not found" }, { status: 404 });
        }

        if ((user.verificationDocuments || []).length >= MAX_VERIFICATION_DOCUMENTS) {
            return NextResponse.json({ success: false, message: `A maximum of ${MAX_VERIFICATION_DOCUMENTS} documents can be uploaded` }, { status: 400 });
        }

        const uploadResult = await uploadFileToCloudinary(file, {
            folder: "kawilmart/verification",
            transformation: [{ width: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
        });

        user.verificationDocuments = [...(user.verificationDocuments || []), uploadResult.secure_url];
        if (!user.isVerified) {
            user.verificationStatus = "PENDING";
        }
        await user.save();

        return NextResponse.json({ success: true, message: "Document submitted for review" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
