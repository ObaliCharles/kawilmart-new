import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { areValidCoordinates } from "@/lib/productLocation";
import { getRequestUserId } from "@/lib/requestAuth";
import Area from "@/models/Area";
import User from "@/models/User";

const cleanText = (value, maxLength = 200) => String(value || "").trim().slice(0, maxLength);
const serializeShopLocation = (seller, area = null) => ({
    areaId: seller?.sellerShopAreaId ? String(seller.sellerShopAreaId) : "",
    lat: Number.isFinite(seller?.sellerShopLat) ? seller.sellerShopLat : null,
    lng: Number.isFinite(seller?.sellerShopLng) ? seller.sellerShopLng : null,
    landmark: seller?.sellerShopLandmark || "",
    meetupSpot: seller?.sellerShopMeetupSpot || "",
    areaName: area?.name || "",
    parentId: area?.parentId ? String(area.parentId) : "",
    hasPrecisePin: areValidCoordinates(seller?.sellerShopLat, seller?.sellerShopLng) && seller?.sellerShopPinSource !== "area",
    pinSource: seller?.sellerShopPinSource === "exact" ? "exact" : "area",
});

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!await authSeller(userId)) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        await connectDB();
        const seller = await User.findById(userId).lean();
        const area = seller?.sellerShopAreaId ? await Area.findById(seller.sellerShopAreaId).lean() : null;
        return NextResponse.json({ success: true, shopLocation: serializeShopLocation(seller, area) });
    } catch {
        return NextResponse.json({ success: false, message: "Unable to load shop location." }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!await authSeller(userId)) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        const body = await request.json();
        const areaId = cleanText(body.areaId, 80);
        const lat = body.lat === null || body.lat === undefined || body.lat === "" ? null : Number(body.lat);
        const lng = body.lng === null || body.lng === undefined || body.lng === "" ? null : Number(body.lng);
        const pinSource = body.pinSource === "exact" ? "exact" : "area";
        if (!areaId) return NextResponse.json({ success: false, message: "Choose the shop area first." }, { status: 400 });
        if ((lat === null) !== (lng === null) || (lat !== null && !areValidCoordinates(lat, lng))) return NextResponse.json({ success: false, message: "The shop pin is invalid. Capture it again or save the area only." }, { status: 400 });
        await connectDB();
        const area = await Area.findById(areaId).lean();
        if (!area) return NextResponse.json({ success: false, message: "Choose a valid shop area." }, { status: 400 });
        const seller = await User.findByIdAndUpdate(userId, {
            sellerShopAreaId: area._id, sellerShopLat: lat, sellerShopLng: lng, sellerShopPinSource: pinSource,
            sellerShopLandmark: cleanText(body.landmark), sellerShopMeetupSpot: cleanText(body.meetupSpot),
        }, { new: true }).lean();
        return NextResponse.json({ success: true, shopLocation: serializeShopLocation(seller, area) });
    } catch {
        return NextResponse.json({ success: false, message: "Unable to save shop location." }, { status: 500 });
    }
}
