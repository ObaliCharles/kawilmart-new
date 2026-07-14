import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

const CATEGORY_IMAGE_TRANSFORM = [{ width: 400, height: 400, crop: "limit", quality: "auto", fetch_format: "auto" }];
const CATEGORY_HERO_TRANSFORM = [{ width: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }];

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
        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
        }

        const previousName = category.name;

        const nextName = formData.get("name");
        if (typeof nextName === "string" && nextName.trim()) {
            category.name = nextName.trim();
        }
        const nextIcon = formData.get("icon");
        if (typeof nextIcon === "string") {
            category.icon = nextIcon;
        }
        if (formData.has("isActive")) {
            category.isActive = formData.get("isActive") !== "false";
        }
        if (formData.has("sortOrder")) {
            category.sortOrder = Number(formData.get("sortOrder")) || 0;
        }
        if (formData.get("removeImage") === "true") {
            category.imageUrl = "";
            category.imagePublicId = "";
        }
        if (formData.get("removeHeroImage") === "true") {
            category.heroImage = "";
            category.heroImageId = "";
        }

        const file = formData.get("image");
        if (isUploadedFile(file)) {
            const uploadResult = await uploadFileToCloudinary(file, { transformation: CATEGORY_IMAGE_TRANSFORM });
            category.imageUrl = uploadResult.secure_url;
            category.imagePublicId = uploadResult.public_id;
        }

        const heroFile = formData.get("heroImage");
        if (isUploadedFile(heroFile)) {
            const uploadResult = await uploadFileToCloudinary(heroFile, { transformation: CATEGORY_HERO_TRANSFORM });
            category.heroImage = uploadResult.secure_url;
            category.heroImageId = uploadResult.public_id;
        }

        await category.save();

        // Keep existing products pointed at the renamed category/subcategory
        // instead of silently orphaning them.
        if (category.name !== previousName) {
            if (category.parentValue) {
                await Product.updateMany(
                    { category: category.parentValue, subcategory: previousName },
                    { $set: { subcategory: category.name } }
                );
            } else {
                await Product.updateMany(
                    { category: previousName },
                    { $set: { category: category.name } }
                );
            }
        }

        return NextResponse.json({ success: true, category });
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
        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
        }

        if (category.parentValue) {
            await Product.updateMany(
                { category: category.parentValue, subcategory: category.name },
                { $set: { subcategory: "" } }
            );
        } else {
            const childCount = await Category.countDocuments({ parentValue: category.name });
            if (childCount > 0) {
                return NextResponse.json({
                    success: false,
                    message: "Delete or reassign this category's subcategories first",
                }, { status: 409 });
            }
        }

        await Category.deleteOne({ _id: category._id });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
