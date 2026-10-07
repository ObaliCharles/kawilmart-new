import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    search: { type: String, default: "", trim: true, maxlength: 80 },
    category: { type: String, default: "", trim: true, maxlength: 100 },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", default: null },
    radiusKm: { type: Number, default: null, enum: [1, 5, 10, 25, null] },
    minPrice: { type: Number, default: null, min: 0 },
    maxPrice: { type: Number, default: null, min: 0 },
    enabled: { type: Boolean, default: true },
    notifiedProductIds: { type: [String], default: [] },
}, { timestamps: true });

savedSearchSchema.index({ userId: 1, enabled: 1, updatedAt: -1 });

const SavedSearch = mongoose.models.SavedSearch || mongoose.model("SavedSearch", savedSearchSchema);
export default SavedSearch;
