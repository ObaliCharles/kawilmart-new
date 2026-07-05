import mongoose from "mongoose";

const sellerReviewSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, default: "" },
    reliability: { type: Number, required: true, min: 1, max: 5 },
    speed: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    overall: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
}, { _id: false });

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['message', 'order', 'system', 'support'], default: 'system' },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    messageId: { type: String, default: "" },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    subject: { type: String, default: "" },
    content: { type: String, default: "" },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    channel: { type: String, enum: ['direct', 'support'], default: 'direct' },
    conversationKey: { type: String, default: "" },
    senderLabel: { type: String, default: "" },
    senderRole: { type: String, default: "" },
});

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    cartItems: {type: Object, default: {} },
    accountStatus: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
    governmentIdNumber: { type: String, default: "" },
    legalStatus: { type: String, enum: ['pending', 'approved', 'flagged'], default: 'pending' },
    legalNotes: { type: String, default: "" },
    // Seller fields
    businessName: { type: String },
    businessLocation: { type: String },
    phoneNumber: { type: String },
    businessLicense: { type: String },
    taxId: { type: String },
    sellerDescription: { type: String, default: "" },
    sellerSupportEmail: { type: String, default: "" },
    sellerWhatsappNumber: { type: String, default: "" },
    sellerLocationCity: { type: String, default: "" },
    sellerLocationRegion: { type: String, default: "" },
    sellerLocationCountry: { type: String, default: "Uganda" },
    sellerBadgeLabel: { type: String, default: "" },
    sellerBadgeTone: { type: String, enum: ['emerald', 'sky', 'amber', 'violet', 'slate'], default: 'emerald' },
    sellerBadgeGrantedAt: { type: Date, default: null },
    sellerBadgeGrantedBy: { type: String, default: "" },
    sellerSupportPriority: { type: String, enum: ['standard', 'priority', 'vip'], default: 'standard' },
    sellerSubscriptionPlan: { type: String, default: "standard" },
    sellerSubscriptionStatus: { type: String, enum: ['active', 'paused', 'overdue', 'trial', 'cancelled'], default: 'active' },
    sellerSubscriptionFee: { type: Number, default: 0 },
    sellerSubscriptionStartedAt: { type: Date, default: null },
    sellerSubscriptionLastPaidAt: { type: Date, default: null },
    sellerSubscriptionNextBillingDate: { type: Date, default: null },
    sellerAccessUntil: { type: Date, default: null },
    sellerBillingNotes: { type: String, default: "" },
    sellerReviews: { type: [sellerReviewSchema], default: [] },
    sellerRatingSummary: {
        totalReviews: { type: Number, default: 0 },
        reliability: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        overall: { type: Number, default: 0 },
    },
    // Rider fields
    riderBaseLocation: { type: String, default: "" },
    vehicleType: { type: String, enum: ['motorcycle', 'bicycle', 'car'] },
    licensePlate: { type: String },
    driversLicense: { type: String },
    riderAvailability: { type: String, enum: ['available', 'busy'], default: 'available' },
    riderSubscriptionPlan: { type: String, default: "standard" },
    riderSubscriptionStatus: { type: String, enum: ['active', 'paused', 'overdue', 'trial', 'cancelled'], default: 'active' },
    riderSubscriptionFee: { type: Number, default: 0 },
    riderSubscriptionStartedAt: { type: Date, default: null },
    riderSubscriptionLastPaidAt: { type: Date, default: null },
    riderSubscriptionNextBillingDate: { type: Date, default: null },
    riderAccessUntil: { type: Date, default: null },
    riderBillingNotes: { type: String, default: "" },
    // Common fields
    isVerified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],
    followedStores: { type: [String], default: [] },
    storeFollowerIds: { type: [String], default: [] },
    storeFollowersCount: { type: Number, default: 0 },
    verificationNotes: { type: String, default: "" },
    notifications: { type: [notificationSchema], default: [] },
    messages: { type: [messageSchema], default: [] }
}, { minimize: false })

const User = mongoose.models.user || mongoose.model('user', userSchema)

export default User
