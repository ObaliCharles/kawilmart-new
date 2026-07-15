import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import Brand from "@/models/Brand";
import { NextResponse } from "next/server";

const BRAND_LOGO_TRANSFORM = [{ width: 300, height: 200, crop: "limit", quality: "auto", fetch_format: "auto" }];

export async function PATCH(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const formData = await request.formData();

        await connectDB();
        const brand = await Brand.findById(id);
        if (!brand) {
            return NextResponse.json({ success: false, message: "Brand not found" }, { status: 404 });
        }

        const nextName = formData.get("name");
        if (typeof nextName === "string" && nextName.trim()) {
            brand.name = nextName.trim();
        }
        if (formData.has("isActive")) {
            brand.isActive = formData.get("isActive") !== "false";
        }
        if (formData.has("sortOrder")) {
            brand.sortOrder = Number(formData.get("sortOrder")) || 0;
        }

        const file = formData.get("logo");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, { transformation: BRAND_LOGO_TRANSFORM });
            brand.logoUrl = uploadResult.secure_url;
            brand.logoPublicId = uploadResult.public_id;
        }

        await brand.save();

        return NextResponse.json({ success: true, brand });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();
        const brand = await Brand.findByIdAndDelete(id);
        if (!brand) {
            return NextResponse.json({ success: false, message: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
