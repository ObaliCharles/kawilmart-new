import mongoose from "mongoose";
import {
    COMMISSION_STATUSES,
    DEFAULT_COMMISSION_RATE,
    DELIVERY_MODES,
    ORDER_STATUS_SEQUENCE,
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    buildOrderFinancials,
    normalizeDeliveryMode,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";
import { getOrderRiskFlags } from "@/lib/orderRisk";

const trackingEventSchema = new mongoose.Schema({
    type: { type: String, enum: ['status', 'assignment', 'system'], default: 'status' },
    status: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const sellerReviewSchema = new mongoose.Schema({
    reviewerId: { type: String, default: "" },
    reviewerName: { type: String, default: "" },
    reliability: { type: Number, min: 1, max: 5 },
    speed: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },
    submittedAt: { type: Date },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    sellerId: { type: String, required: true, ref: 'User' },
    items: [{
        product: { type: String, required: true, ref: 'Product' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true },
    address: { type: String, ref: 'address', required: true },
    status: {
        type: String,
        required: true,
        default: ORDER_STATUSES.PLACED,
        enum: ORDER_STATUS_SEQUENCE,
    },
    paymentStatus: { type: String, default: PAYMENT_STATUSES.PENDING, enum: Object.values(PAYMENT_STATUSES) },
    deliveryMode: {
        type: String,
        default: DELIVERY_MODES.DELIVERY,
        enum: Object.values(DELIVERY_MODES),
    },
    deliveryRequired: { type: Boolean, default: true },
    riderId: { type: String, ref: 'User' },
    riderAssignmentStatus: {
        type: String,
        default: RIDER_ASSIGNMENT_STATUSES.UNASSIGNED,
        enum: Object.values(RIDER_ASSIGNMENT_STATUSES),
    },
    deliveryFee: { type: Number, default: 0 },
    commissionRate: { type: Number, default: DEFAULT_COMMISSION_RATE },
    commissionAmount: { type: Number, default: 0 },
    commissionStatus: {
        type: String,
        default: COMMISSION_STATUSES.PENDING,
        enum: Object.values(COMMISSION_STATUSES),
    },
    orderSource: { type: String, default: "APP", enum: ["APP"] },
    sellerNotes: { type: String },
    customerPhone: { type: String },
    contactUnlockedAt: { type: Date },
    acceptedAt: { type: Date },
    readyAt: { type: Date },
    deliveredAt: { type: Date },
    deliveredByRole: { type: String, enum: ["seller", "rider", "admin", "system"] },
    customerConfirmedAt: { type: Date },
    riderAcceptedAt: { type: Date },
    riderDeclinedAt: { type: Date },
    sellerReview: { type: sellerReviewSchema, default: () => ({}) },
    riskFlags: { type: [String], default: [] },
    trackingEvents: { type: [trackingEventSchema], default: [] },
    date: { type: Number, required: true }
});

orderSchema.pre("validate", function normalizeOrderDocument(next) {
    this.status = normalizeOrderStatus(this.status);
    this.deliveryMode = normalizeDeliveryMode(this.deliveryMode, this.deliveryRequired);
    this.deliveryRequired = this.deliveryMode === DELIVERY_MODES.DELIVERY;
    this.riderAssignmentStatus = normalizeRiderAssignmentStatus(this.riderAssignmentStatus, this.riderId);

    const computedSubtotal = Array.isArray(this.items)
        ? this.items.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)), 0)
        : 0;
    const subtotal = Number.isFinite(Number(this.subtotal)) && Number(this.subtotal) > 0
        ? Number(this.subtotal)
        : computedSubtotal;
    const financials = buildOrderFinancials({
        subtotal,
        deliveryFee: this.deliveryFee,
        commissionRate: this.commissionRate,
    });

    this.subtotal = financials.subtotal;
    this.deliveryFee = financials.deliveryFee;
    this.amount = financials.amount;
    this.commissionRate = financials.commissionRate;
    this.commissionAmount = financials.commissionAmount;

    if (this.status === ORDER_STATUSES.ACCEPTED && !this.acceptedAt) {
        this.acceptedAt = new Date();
    }

    if (this.status === ORDER_STATUSES.READY && !this.readyAt) {
        this.readyAt = new Date();
    }

    if ([ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED].includes(this.status) && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }

    if (this.status === ORDER_STATUSES.COMPLETED && !this.customerConfirmedAt) {
        this.customerConfirmedAt = new Date();
    }

    if (this.status === ORDER_STATUSES.COMPLETED) {
        this.commissionStatus = COMMISSION_STATUSES.EARNED;
    } else if (this.commissionStatus === COMMISSION_STATUSES.EARNED) {
        this.commissionStatus = COMMISSION_STATUSES.PENDING;
    }

    if (this.acceptedAt && !this.contactUnlockedAt) {
        this.contactUnlockedAt = this.acceptedAt;
    }

    this.riskFlags = getOrderRiskFlags(this);

    next();
});

// Make variable name consistent with export
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
