import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import Banner from "@/models/Banner";
import { NextResponse } from "next/server";

const transformationByType = {
    hero: [{ width: 1920, crop: "limit", quality: "auto", fetch_format: "auto" }],
    featured: [{ width: 900, crop: "limit", quality: "auto", fetch_format: "auto" }],
    promo: [{ width: 900, crop: "limit", quality: "auto", fetch_format: "auto" }],
    sidebarPromo: [{ width: 600, crop: "limit", quality: "auto", fetch_format: "auto" }],
    category: [{ width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
    brandShowcase: [{ width: 600, crop: "limit", quality: "auto", fetch_format: "auto" }],
};

const readField = (formData, key, fallback = "") => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : fallback;
};

const readDateField = (formData, key) => {
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        await connectDB();
        const query = type ? { type } : {};
        const banners = await Banner.find(query).sort({ type: 1, sortOrder: 1, createdAt: -1 }).lean();

        return NextResponse.json({ success: true, banners });
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
        const type = readField(formData, "type");
        if (!type) {
            return NextResponse.json({ success: false, message: "Banner type is required" }, { status: 400 });
        }

        let imageUrl = readField(formData, "imageUrl");
        let imagePublicId = "";
        const file = formData.get("image");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, {
                transformation: transformationByType[type] || transformationByType.promo,
            });
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
        }

        await connectDB();

        const banner = await Banner.create({
            type,
            title: readField(formData, "title"),
            subtitle: readField(formData, "subtitle"),
            imageUrl,
            imagePublicId,
            ctaText: readField(formData, "ctaText"),
            secondaryCtaText: readField(formData, "secondaryCtaText"),
            linkType: readField(formData, "linkType", "custom"),
            category: readField(formData, "category"),
            storeId: readField(formData, "storeId"),
            productId: readField(formData, "productId"),
            href: readField(formData, "href"),
            secondaryHref: readField(formData, "secondaryHref"),
            brand: readField(formData, "brand"),
            placementCategory: readField(formData, "placementCategory"),
            bannerSubtype: readField(formData, "bannerSubtype", "promo"),
            showOverlay: formData.get("showOverlay") === "true",
            startDate: readDateField(formData, "startDate"),
            endDate: readDateField(formData, "endDate"),
            status: readField(formData, "status", "draft"),
            sortOrder: Number(formData.get("sortOrder")) || 0,
            createdBy: userId,
        });

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
