import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    stock: { type: Number, default: null, min: 0 },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    sellerContact: { type: String, required: true },
    sellerLocation: { type: String, required: true },
    isFlashDeal: { type: Boolean, default: false },
    flashDealEndDate: { type: Date },
    promotionType: { type: String, enum: ['none', 'flash_deal', 'featured', 'discount'], default: 'none' },
    likedBy: { type: [String], default: [] },
    likesCount: { type: Number, default: 0 },
    reviews: [{
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        date: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 },
    date: { type: Number, required: true }
})

// Add indexes for better performance
productSchema.index({ category: 1 });
productSchema.index({ date: -1 });
productSchema.index({ offerPrice: 1 });
productSchema.index({ isFlashDeal: 1 });
productSchema.index({ promotionType: 1 });

const Product = mongoose.models.product || mongoose.model('product', productSchema)

export default Product
