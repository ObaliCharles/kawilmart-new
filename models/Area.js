import mongoose from "mongoose";

export const AREA_TYPES = ["CITY", "DIVISION", "PARISH", "TRADING_CENTRE"];

const coordinateField = (label, min, max) => ({
    type: Number,
    default: null,
    validate: {
        validator(value) {
            return value === null || value === undefined || (Number.isFinite(value) && value >= min && value <= max);
        },
        message: `${label} must be between ${min} and ${max}.`,
    },
});

const areaSchema = new mongoose.Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, required: true, enum: AREA_TYPES },
    lat: coordinateField("Latitude", -90, 90),
    lng: coordinateField("Longitude", -180, 180),
}, { timestamps: true });

// The parent/name pair makes seed reruns safe while allowing the same local
// area name to exist in different cities.
areaSchema.index({ parentId: 1, name: 1 }, { unique: true });
areaSchema.index({ type: 1, parentId: 1 });

const Area = mongoose.models.Area || mongoose.model("Area", areaSchema);

export default Area;
