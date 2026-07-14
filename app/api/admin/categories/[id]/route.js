import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await connectDB();
        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
        }

        const previousName = category.name;

        if (typeof body?.name === "string" && body.name.trim()) {
            category.name = body.name.trim();
        }
        if (typeof body?.icon === "string") {
            category.icon = body.icon;
        }
        if (typeof body?.isActive === "boolean") {
            category.isActive = body.isActive;
        }
        if (body?.sortOrder !== undefined) {
            category.sortOrder = Number(body.sortOrder) || 0;
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
