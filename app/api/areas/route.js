import connectDB from "@/config/db";
import Area from "@/models/Area";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const areas = await Area.find({}).select("_id parentId name type lat lng").sort({ type: 1, name: 1 }).lean();
        const response = NextResponse.json({ success: true, areas });
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: "Location is temporarily unavailable. Choose your area later." }, { status: 500 });
    }
}
