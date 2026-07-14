import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { getRequestUserId } from "@/lib/requestAuth";
import { slugify } from "@/lib/slugify";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

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

        const body = await request.json();
        const name = String(body?.name || "").trim();
        if (!name) {
            return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
        }

        const parentValue = body?.parentValue ? String(body.parentValue).trim() : null;
        const slug = parentValue ? slugify(body?.slug || name) : name;
        if (!slug) {
            return NextResponse.json({ success: false, message: "Could not derive a valid identifier from that name" }, { status: 400 });
        }

        await connectDB();

        const existing = await Category.findOne({ parentValue, slug });
        if (existing) {
            return NextResponse.json({ success: false, message: "A category with that name already exists here" }, { status: 409 });
        }

        const category = await Category.create({
            name,
            slug,
            parentValue,
            icon: String(body?.icon || ""),
            sortOrder: Number(body?.sortOrder) || 0,
            isActive: body?.isActive !== false,
        });

        return NextResponse.json({ success: true, category });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
