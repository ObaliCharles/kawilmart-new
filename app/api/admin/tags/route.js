import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { slugify } from "@/lib/slugify";
import Tag from "@/models/Tag";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const tags = await Tag.find({}).sort({ sortOrder: 1, name: 1 }).lean();

        return NextResponse.json({ success: true, tags });
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

        const body = await request.json();
        const name = String(body?.name || "").trim();
        if (!name) {
            return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
        }

        const slug = slugify(body?.slug || name);
        if (!slug) {
            return NextResponse.json({ success: false, message: "Could not derive a valid slug from that name" }, { status: 400 });
        }

        await connectDB();

        const existing = await Tag.findOne({ slug });
        if (existing) {
            return NextResponse.json({ success: false, message: "A tag with that slug already exists" }, { status: 409 });
        }

        const tag = await Tag.create({
            name,
            slug,
            description: String(body?.description || ""),
            color: body?.color || "orange",
            isActive: body?.isActive !== false,
            sortOrder: Number(body?.sortOrder) || 0,
        });

        return NextResponse.json({ success: true, tag });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
