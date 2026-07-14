import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { slugify } from "@/lib/slugify";
import Product from "@/models/Product";
import Tag from "@/models/Tag";
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
        const tag = await Tag.findById(id);
        if (!tag) {
            return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
        }

        if (typeof body?.name === "string" && body.name.trim()) {
            tag.name = body.name.trim();
        }
        if (typeof body?.description === "string") {
            tag.description = body.description;
        }
        if (typeof body?.color === "string") {
            tag.color = body.color;
        }
        if (typeof body?.isActive === "boolean") {
            tag.isActive = body.isActive;
        }
        if (body?.sortOrder !== undefined) {
            tag.sortOrder = Number(body.sortOrder) || 0;
        }
        if (typeof body?.slug === "string" && body.slug.trim()) {
            const nextSlug = slugify(body.slug);
            if (nextSlug && nextSlug !== tag.slug) {
                const clash = await Tag.findOne({ slug: nextSlug, _id: { $ne: tag._id } });
                if (clash) {
                    return NextResponse.json({ success: false, message: "A tag with that slug already exists" }, { status: 409 });
                }
                await Product.updateMany({ tags: tag.slug }, { $set: { "tags.$": nextSlug } });
                tag.slug = nextSlug;
            }
        }

        await tag.save();

        return NextResponse.json({ success: true, tag });
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
        const tag = await Tag.findById(id);
        if (!tag) {
            return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
        }

        await Product.updateMany({ tags: tag.slug }, { $pull: { tags: tag.slug } });
        await Tag.deleteOne({ _id: tag._id });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
