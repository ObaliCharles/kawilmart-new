import connectDB from "@/config/db";
import Brand from "@/models/Brand";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const brands = await Brand.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

        const response = NextResponse.json({ success: true, brands });
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
