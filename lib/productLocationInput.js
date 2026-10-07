import Area from "../models/Area.js";
import {
    areValidCoordinates,
    createBlurredPublicCoordinates,
} from "./productLocation.js";

const textValue = (value, maxLength = 240) => String(value || "").trim().slice(0, maxLength);

const parseCoordinate = (value) => {
    const trimmed = String(value || "").trim();
    return trimmed ? Number(trimmed) : null;
};

/** Validates seller-submitted location data and derives public coordinates. */
export const parseProductLocationInput = async (formData, { existingProduct = null } = {}) => {
    const submitted = formData.get("locationConfigured") === "true";
    if (!submitted) {
        return { configured: false, value: null };
    }

    const areaId = textValue(formData.get("areaId"), 80);
    const cityAreaId = textValue(formData.get("cityAreaId"), 80);
    const lat = parseCoordinate(formData.get("lat"));
    const lng = parseCoordinate(formData.get("lng"));
    const landmark = textValue(formData.get("landmark"));
    const meetupSpot = textValue(formData.get("meetupSpot"));

    if (!areaId) {
        throw new Error("Please choose a valid area.");
    }

    const area = await Area.findById(areaId).lean();
    if (!area) {
        throw new Error("Please choose a valid area.");
    }

    if (cityAreaId) {
        const city = await Area.findOne({ _id: cityAreaId, type: "CITY" }).lean();
        if (!city || (String(area._id) !== String(city._id) && String(area.parentId || "") !== String(city._id))) {
            throw new Error("Please choose a valid area.");
        }
    }

    const hasLatitude = lat !== null;
    const hasLongitude = lng !== null;
    if (hasLatitude !== hasLongitude || (hasLatitude && !areValidCoordinates(lat, lng))) {
        throw new Error("Please provide a valid location or choose your area manually.");
    }

    const hasCoordinates = hasLatitude && hasLongitude;
    const preserveExistingCoordinates = !hasCoordinates && existingProduct && areValidCoordinates(existingProduct.lat, existingProduct.lng);
    const privateLat = hasCoordinates ? lat : preserveExistingCoordinates ? existingProduct.lat : null;
    const privateLng = hasCoordinates ? lng : preserveExistingCoordinates ? existingProduct.lng : null;
    const publicCoordinates = hasCoordinates
        ? createBlurredPublicCoordinates(lat, lng)
        : preserveExistingCoordinates && areValidCoordinates(existingProduct.publicLat, existingProduct.publicLng)
            ? { lat: existingProduct.publicLat, lng: existingProduct.publicLng }
            : null;

    return {
        configured: true,
        value: {
            areaId: area._id,
            landmark: landmark || null,
            lat: privateLat,
            lng: privateLng,
            publicLat: publicCoordinates?.lat || null,
            publicLng: publicCoordinates?.lng || null,
            meetupSpot: meetupSpot || null,
        },
        area,
        preserved: preserveExistingCoordinates,
    };
};
