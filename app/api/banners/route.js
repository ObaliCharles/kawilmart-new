import connectDB from "@/config/db";
import { isBannerCurrentlyActive } from "@/lib/bannerStatus";
import Banner from "@/models/Banner";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        await connectDB();
        const query = type ? { type, status: { $ne: "draft" } } : { status: { $ne: "draft" } };
        const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();

        const now = new Date();
        const activeBanners = banners.filter((banner) => isBannerCurrentlyActive(banner, now));

        const response = NextResponse.json({ success: true, banners: activeBanners });
        response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
