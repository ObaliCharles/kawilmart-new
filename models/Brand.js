import mongoose from "mongoose";

// Top brands shown in the "Top Brands" strip. `name` should match the brand
// label products carry (getBrandLabel), so the logo links to that brand's
// filtered products via /all-products?brand=<name>.
const brandSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ sortOrder: 1 });

const Brand = mongoose.models.brand || mongoose.model("brand", brandSchema);

export default Brand;
