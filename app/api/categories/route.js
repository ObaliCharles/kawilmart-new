import connectDB from "@/config/db";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const categories = await Category.find({ isActive: true }).sort({ parentValue: 1, sortOrder: 1, name: 1 }).lean();

        const response = NextResponse.json({ success: true, categories });
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
