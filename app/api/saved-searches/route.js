import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import { ALLOWED_RADIUS_KM } from "@/lib/productLocation";
import SavedSearch from "@/models/SavedSearch";
import { NextResponse } from "next/server";

const clean = (value, max = 80) => String(value || "").trim().slice(0, max);

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        await connectDB();
        const searches = await SavedSearch.find({ userId }).sort({ updatedAt: -1 }).lean();
        return NextResponse.json({ success: true, searches });
    } catch { return NextResponse.json({ success: false, message: "Unable to load saved searches" }, { status: 401 }); }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const body = await request.json();
        const radiusKm = body.radiusKm === null || body.radiusKm === undefined ? null : Number(body.radiusKm);
        if (radiusKm !== null && !ALLOWED_RADIUS_KM.includes(radiusKm)) return NextResponse.json({ success: false, message: "Please choose a valid radius." }, { status: 400 });
        const minPrice = body.minPrice === null || body.minPrice === undefined || body.minPrice === "" ? null : Number(body.minPrice);
        const maxPrice = body.maxPrice === null || body.maxPrice === undefined || body.maxPrice === "" ? null : Number(body.maxPrice);
        if ((minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) return NextResponse.json({ success: false, message: "Please provide a valid price range." }, { status: 400 });
        await connectDB();
        const savedSearch = await SavedSearch.create({ userId, name: clean(body.name) || clean(body.search) || "Saved search", search: clean(body.search), category: clean(body.category, 100), areaId: body.areaId || null, radiusKm, minPrice, maxPrice, enabled: body.enabled !== false });
        return NextResponse.json({ success: true, savedSearch });
    } catch { return NextResponse.json({ success: false, message: "Unable to save this search." }, { status: 400 }); }
}

export async function PATCH(request) {
    try {
        const userId = await getRequestUserId(request); const body = await request.json();
        await connectDB();
        const update = {};
        if (typeof body.name === "string") update.name = clean(body.name) || "Saved search";
        if (typeof body.enabled === "boolean") update.enabled = body.enabled;
        const savedSearch = await SavedSearch.findOneAndUpdate({ _id: body.id, userId }, { $set: update }, { new: true });
        return NextResponse.json({ success: Boolean(savedSearch), savedSearch, message: savedSearch ? "Saved search updated." : "Saved search not found." });
    } catch { return NextResponse.json({ success: false, message: "Unable to update saved search." }, { status: 400 }); }
}

export async function DELETE(request) {
    try { const userId = await getRequestUserId(request); const { searchParams } = new URL(request.url); await connectDB(); await SavedSearch.deleteOne({ _id: searchParams.get("id"), userId }); return NextResponse.json({ success: true }); }
    catch { return NextResponse.json({ success: false, message: "Unable to delete saved search." }, { status: 400 }); }
}
