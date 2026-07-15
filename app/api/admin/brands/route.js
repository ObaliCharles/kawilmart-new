import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import { slugify } from "@/lib/slugify";
import Brand from "@/models/Brand";
import { NextResponse } from "next/server";

const BRAND_LOGO_TRANSFORM = [{ width: 300, height: 200, crop: "limit", quality: "auto", fetch_format: "auto" }];

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const brands = await Brand.find({}).sort({ sortOrder: 1, name: 1 }).lean();

        return NextResponse.json({ success: true, brands });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const name = String(formData.get("name") || "").trim();
        if (!name) {
            return NextResponse.json({ success: false, message: "Brand name is required" }, { status: 400 });
        }

        const slug = slugify(formData.get("slug") || name);
        if (!slug) {
            return NextResponse.json({ success: false, message: "Could not derive a valid slug from that name" }, { status: 400 });
        }

        await connectDB();

        const existing = await Brand.findOne({ slug });
        if (existing) {
            return NextResponse.json({ success: false, message: "A brand with that name already exists" }, { status: 409 });
        }

        let logoUrl = "";
        let logoPublicId = "";
        const file = formData.get("logo");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, { transformation: BRAND_LOGO_TRANSFORM });
            logoUrl = uploadResult.secure_url;
            logoPublicId = uploadResult.public_id;
        }

        const brand = await Brand.create({
            name,
            slug,
            logoUrl,
            logoPublicId,
            sortOrder: Number(formData.get("sortOrder")) || 0,
            isActive: formData.get("isActive") !== "false",
        });

        return NextResponse.json({ success: true, brand });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
