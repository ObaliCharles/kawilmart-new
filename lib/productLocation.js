import "server-only";

import { randomBytes } from "crypto";

export const PRODUCT_LOCATION_PRIVACY_MIN_METERS = 250;
export const PRODUCT_LOCATION_PRIVACY_MAX_METERS = 350;
export const ALLOWED_RADIUS_KM = [1, 5, 10, 25];

const EARTH_RADIUS_METERS = 6_371_008.8;
const toRadians = (value) => (Number(value) * Math.PI) / 180;
const toDegrees = (value) => (Number(value) * 180) / Math.PI;

export const isValidLatitude = (value) => Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90;
export const isValidLongitude = (value) => Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180;

export const areValidCoordinates = (lat, lng) => isValidLatitude(lat) && isValidLongitude(lng);

const secureUnitRandom = () => randomBytes(6).readUIntBE(0, 6) / 0x1000000000000;

/**
 * Produces a non-deterministic public point around a private product point.
 * The original point is intentionally never returned from this module's
 * public serializer.
 */
export const createBlurredPublicCoordinates = (lat, lng, random = secureUnitRandom) => {
    if (!areValidCoordinates(lat, lng)) {
        return null;
    }

    const distance = PRODUCT_LOCATION_PRIVACY_MIN_METERS
        + (random() * (PRODUCT_LOCATION_PRIVACY_MAX_METERS - PRODUCT_LOCATION_PRIVACY_MIN_METERS));
    const bearing = random() * Math.PI * 2;
    const angularDistance = distance / EARTH_RADIUS_METERS;
    const latitude = toRadians(lat);
    const longitude = toRadians(lng);

    const publicLatitude = Math.asin(
        Math.sin(latitude) * Math.cos(angularDistance)
        + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const publicLongitude = longitude + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(publicLatitude)
    );

    return {
        lat: Number(toDegrees(publicLatitude).toFixed(6)),
        lng: Number((((toDegrees(publicLongitude) + 540) % 360) - 180).toFixed(6)),
    };
};

export const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
    if (!areValidCoordinates(fromLat, fromLng) || !areValidCoordinates(toLat, toLng)) {
        return null;
    }

    const deltaLat = toRadians(Number(toLat) - Number(fromLat));
    const deltaLng = toRadians(Number(toLng) - Number(fromLng));
    const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLng / 2) ** 2;

    return (EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
};

export const formatDistanceLabel = (distanceKm) => {
    if (!Number.isFinite(distanceKm) || distanceKm < 0) return "";
    if (distanceKm < 1) return `~${Math.max(10, Math.round(distanceKm * 1000 / 10) * 10)} m away`;
    return `~${distanceKm.toFixed(1)} km away`;
};

const getAreaAncestors = (area, areasById) => {
    const ancestors = [];
    const seen = new Set();
    let current = area;

    while (current && !seen.has(String(current._id))) {
        ancestors.unshift(current);
        seen.add(String(current._id));
        current = current.parentId ? areasById.get(String(current.parentId)) : null;
    }

    return ancestors;
};

/**
 * The one public gate for product-location data. Do not return product.lat or
 * product.lng from a storefront API or component; use this representation.
 */
export const getPublicProductLocation = (product, { areasById = new Map(), buyerCoordinates = null, includePublicCoordinates = false } = {}) => {
    const area = product?.areaId ? areasById.get(String(product.areaId)) : null;
    const hierarchy = area ? getAreaAncestors(area, areasById) : [];
    const areaNames = hierarchy.map((entry) => entry.name).filter(Boolean);
    const areaName = area?.name || "";
    const city = hierarchy.find((entry) => entry.type === "CITY")?.name || "";
    const distanceKm = buyerCoordinates && areValidCoordinates(product?.lat, product?.lng)
        ? calculateDistanceKm(buyerCoordinates.lat, buyerCoordinates.lng, product.lat, product.lng)
        : null;

    if (!areaName && !product?.meetupSpot && !Number.isFinite(distanceKm)) {
        return null;
    }

    const result = {
        areaName: areaName || null,
        area: areaName || null,
        city: city || null,
        displayName: areaNames.join(", ") || null,
        distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(3)) : null,
        distanceLabel: Number.isFinite(distanceKm) ? formatDistanceLabel(distanceKm) : null,
        meetupSpot: product?.meetupSpot || null,
    };

    if (includePublicCoordinates && areValidCoordinates(product?.publicLat, product?.publicLng)) {
        result.publicCoordinates = { lat: product.publicLat, lng: product.publicLng };
    }

    return result;
};
