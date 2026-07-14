import connectDB from "@/config/db";
import Tag from "@/models/Tag";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const tags = await Tag.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

        const response = NextResponse.json({ success: true, tags });
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
