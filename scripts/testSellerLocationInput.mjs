import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Area from "../models/Area.js";
import { parseProductLocationInput } from "../lib/productLocationInput.js";

await connectDB();

const gulu = await Area.findOne({ name: "Gulu", parentId: null }).lean();
const pece = await Area.findOne({ name: "Pece", parentId: gulu?._id }).lean();
const kampala = await Area.findOne({ name: "Kampala", parentId: null }).lean();
assert.ok(gulu && pece && kampala, "Phase 1 seeded areas are required");

const validForm = new FormData();
validForm.set("locationConfigured", "true");
validForm.set("cityAreaId", String(gulu._id));
validForm.set("areaId", String(pece._id));
validForm.set("lat", "2.781667");
validForm.set("lng", "32.299167");
validForm.set("landmark", "Near Pece Stadium");
validForm.set("meetupSpot", "Total Pece");
const parsed = await parseProductLocationInput(validForm);
assert.equal(String(parsed.value.areaId), String(pece._id));
assert.notDeepEqual(
    { lat: parsed.value.publicLat, lng: parsed.value.publicLng },
    { lat: parsed.value.lat, lng: parsed.value.lng },
    "Public coordinates must differ from private coordinates"
);

const invalidForm = new FormData();
invalidForm.set("locationConfigured", "true");
invalidForm.set("cityAreaId", String(kampala._id));
invalidForm.set("areaId", String(pece._id));
await assert.rejects(() => parseProductLocationInput(invalidForm), /valid area/i);

const untouched = await parseProductLocationInput(new FormData());
assert.equal(untouched.configured, false);

await mongoose.disconnect();
console.log("Seller location input tests passed.");
