import mongoose from "mongoose";

const vendorApplicationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    businessName: { type: String, required: true },
    businessLocation: { type: String, required: true },
    whatYouSell: { type: String, required: true },
    notes: { type: String, default: "" },
    submittedByUserId: { type: String, default: "" },
    source: { type: String, default: "seller-landing" },
    status: { type: String, enum: ["pending", "reviewing", "approved", "rejected"], default: "pending" },
    date: { type: Date, default: Date.now },
}, { minimize: false });

const VendorApplication = mongoose.models.vendorApplication || mongoose.model("vendorApplication", vendorApplicationSchema);

export default VendorApplication;
