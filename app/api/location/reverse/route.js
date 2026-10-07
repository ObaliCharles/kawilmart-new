import { NextResponse } from "next/server";
import { areValidCoordinates } from "@/lib/productLocation";

export const runtime = "nodejs";

// Small per-instance cache and limiter for deliberate, button-triggered
// lookups. The provider can be replaced without changing the client.
const cache = globalThis.__wilwaReverseGeocodeCache || new Map();
globalThis.__wilwaReverseGeocodeCache = cache;
let lastRequestAt = 0;

const pick = (address, keys) => keys.map((key) => address?.[key]).find(Boolean) || "";

const labelFromAddress = (address = {}) => {
    const locality = pick(address, ["suburb", "neighbourhood", "quarter", "village", "town", "city", "municipality"]);
    const district = pick(address, ["city_district", "county", "state_district", "district"]);
    const region = pick(address, ["state", "region"]);
    return [...new Set([locality, district, region].filter(Boolean))].join(", ");
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (!areValidCoordinates(lat, lng)) return NextResponse.json({ success: false, message: "Invalid coordinates." }, { status: 400 });

    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return NextResponse.json({ success: true, ...cached.value, cached: true });

    // This default is suitable only for modest, user-triggered usage. Deployments
    // may set GEOCODING_REVERSE_URL to an approved provider endpoint.
    const endpoint = process.env.GEOCODING_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse";
    const waitMs = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));

    try {
        lastRequestAt = Date.now();
        const url = new URL(endpoint);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lng));
        url.searchParams.set("addressdetails", "1");
        const response = await fetch(url, {
            headers: { "User-Agent": process.env.GEOCODING_USER_AGENT || "Wilwa-Uganda-Marketplace/1.0 (support@wilwa.ug)" },
            next: { revalidate: 86400 },
        });
        if (!response.ok) throw new Error("Reverse-geocoding request failed");
        const result = await response.json();
        const value = { label: labelFromAddress(result.address) || "Your current location", provider: "OpenStreetMap" };
        cache.set(cacheKey, { value, expiresAt: Date.now() + 86400000 });
        return NextResponse.json({ success: true, ...value });
    } catch {
        // GPS coordinates remain valid for nearby-product matching even when a
        // name lookup is unavailable. Never replace them with a wrong city name.
        return NextResponse.json({ success: true, label: "Your current location", provider: null, fallback: true });
    }
}
