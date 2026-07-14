import mongoose from "mongoose";

// Covers both tiers of the marketplace taxonomy in one collection:
// - parentValue === null: a top-level category. The default list still lives
//   in lib/marketplaceCategories.js (Product.category values already in use
//   in the database) — documents here let an admin add NEW top-level
//   categories (e.g. "Groceries & Supermarket") without touching that file.
// - parentValue set: a subcategory of that top-level category's value
//   (matches Product.subcategory). This replaces four separate hardcoded,
//   keyword-guessed tile/department lists that used to live in
//   lib/categoryExperiences.js, app/all-products/page.jsx, and
//   components/CategoryBrowserPage.jsx.
const categorySchema = new mongoose.Schema({
    parentValue: { type: String, default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    icon: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ parentValue: 1, slug: 1 }, { unique: true });
categorySchema.index({ parentValue: 1, sortOrder: 1 });

const Category = mongoose.models.category || mongoose.model("category", categorySchema);

export default Category;
