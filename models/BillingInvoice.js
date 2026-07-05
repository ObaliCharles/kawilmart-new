import mongoose from "mongoose";

const sellerSnapshotSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    businessName: { type: String, default: "" },
    email: { type: String, default: "" },
    businessLocation: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    supportPriority: { type: String, default: "standard" },
}, { _id: false });

const billingInvoiceSchema = new mongoose.Schema({
    sellerId: { type: String, required: true, index: true, ref: "User" },
    sellerSnapshot: { type: sellerSnapshotSchema, default: () => ({}) },
    invoiceNumber: { type: String, required: true, unique: true },
    periodKey: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    subscriptionPlan: { type: String, default: "standard" },
    subscriptionStatus: { type: String, default: "active" },
    subscriptionFee: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    commissionTotal: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    completedSubtotal: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
    orderIds: { type: [String], default: [] },
    status: {
        type: String,
        enum: ["issued", "paid", "overdue", "void"],
        default: "issued",
        index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    lastReminderAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paymentReference: { type: String, default: "" },
    paymentNotes: { type: String, default: "" },
    notes: { type: String, default: "" },
    generatedBy: { type: String, default: "system" },
    lastCalculatedAt: { type: Date, default: Date.now },
}, { timestamps: true, minimize: false });

billingInvoiceSchema.index({ sellerId: 1, periodKey: 1 }, { unique: true });

const BillingInvoice = mongoose.models.BillingInvoice || mongoose.model("BillingInvoice", billingInvoiceSchema);

export default BillingInvoice;
