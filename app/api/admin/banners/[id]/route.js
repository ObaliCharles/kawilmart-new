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

const stringFields = [
    "title", "subtitle", "imageUrl", "ctaText", "secondaryCtaText", "linkType",
    "category", "storeId", "productId", "href", "secondaryHref", "brand",
    "placementCategory", "bannerSubtype", "status",
];

const readField = (formData, key) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : undefined;
};

const readDateField = (formData, key) => {
    if (!formData.has(key)) return undefined;
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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
        const banner = await Banner.findById(id);
        if (!banner) {
            return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
        }

        stringFields.forEach((field) => {
            const value = readField(formData, field);
            if (value !== undefined) {
                banner[field] = value;
            }
        });

        const startDate = readDateField(formData, "startDate");
        if (startDate !== undefined) banner.startDate = startDate;
        const endDate = readDateField(formData, "endDate");
        if (endDate !== undefined) banner.endDate = endDate;

        if (formData.has("sortOrder")) {
            banner.sortOrder = Number(formData.get("sortOrder")) || 0;
        }

        const file = formData.get("image");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, {
                transformation: transformationByType[banner.type] || transformationByType.promo,
            });
            banner.imageUrl = uploadResult.secure_url;
            banner.imagePublicId = uploadResult.public_id;
        }

        await banner.save();

        return NextResponse.json({ success: true, banner });
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
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) {
            return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
