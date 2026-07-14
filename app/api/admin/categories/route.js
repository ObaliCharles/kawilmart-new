import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import { slugify } from "@/lib/slugify";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

const CATEGORY_IMAGE_TRANSFORM = [{ width: 400, height: 400, crop: "limit", quality: "auto", fetch_format: "auto" }];
const CATEGORY_HERO_TRANSFORM = [{ width: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }];

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const categories = await Category.find({}).sort({ parentValue: 1, sortOrder: 1, name: 1 }).lean();

        return NextResponse.json({ success: true, categories });
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
            return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
        }

        const parentRaw = formData.get("parentValue");
        const parentValue = parentRaw ? String(parentRaw).trim() : null;
        const slug = parentValue ? slugify(formData.get("slug") || name) : name;
        if (!slug) {
            return NextResponse.json({ success: false, message: "Could not derive a valid identifier from that name" }, { status: 400 });
        }

        await connectDB();

        const existing = await Category.findOne({ parentValue, slug });
        if (existing) {
            return NextResponse.json({ success: false, message: "A category with that name already exists here" }, { status: 409 });
        }

        let imageUrl = String(formData.get("imageUrl") || "");
        let imagePublicId = "";
        const file = formData.get("image");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, { transformation: CATEGORY_IMAGE_TRANSFORM });
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
        }

        let heroImage = "";
        let heroImageId = "";
        const heroFile = formData.get("heroImage");
        if (isUploadedFile(heroFile)) {
            const uploadResult = await uploadFileToCloudinary(heroFile, { transformation: CATEGORY_HERO_TRANSFORM });
            heroImage = uploadResult.secure_url;
            heroImageId = uploadResult.public_id;
        }

        const category = await Category.create({
            name,
            slug,
            parentValue,
            icon: String(formData.get("icon") || ""),
            imageUrl,
            imagePublicId,
            heroImage,
            heroImageId,
            sortOrder: Number(formData.get("sortOrder")) || 0,
            isActive: formData.get("isActive") !== "false",
        });

        return NextResponse.json({ success: true, category });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
