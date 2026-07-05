import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import { getUserRole, invalidateUserRoleCache } from "@/lib/userRoleCache";
import User from "@/models/User";
import {
    RIDER_SUBSCRIPTION_PLANS,
    RIDER_SUBSCRIPTION_STATUSES,
    SELLER_SUBSCRIPTION_PLANS,
    SELLER_SUBSCRIPTION_STATUSES,
} from "@/lib/sellerBilling";
import { syncUserFromClerk } from "@/lib/clerkUserSync";
import { notifyUsers } from "@/lib/notifyUsers";
import {
    buildAccountUpdateNotification,
    getChangedAccountFields,
} from "@/lib/accountNotifications";

const ACTIVE_SELLER_STATUSES = new Set(["active", "trial"]);
const ACTIVE_RIDER_STATUSES = new Set(["active", "trial"]);
const ROLE_VALUES = new Set(["buyer", "seller", "admin", "rider"]);
const ACCOUNT_STATUSES = new Set(["active", "pending", "suspended"]);
const LEGAL_STATUSES = new Set(["pending", "approved", "flagged"]);
const BADGE_TONES = new Set(["emerald", "sky", "amber", "violet", "slate"]);
const SUPPORT_PRIORITIES = new Set(["standard", "priority", "vip"]);
const RIDER_AVAILABILITY_VALUES = new Set(["available", "busy"]);
const VEHICLE_TYPES = new Set(["motorcycle", "bicycle", "car"]);

const normalizeString = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
};

const normalizeDate = (value) => {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};

const addMonths = (date, months = 1) => {
    if (!date) {
        return null;
    }

    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

const sanitizeUpdates = (updates = {}, existingUser = {}, adminUserId = "") => {
    const sanitized = {};
    const requestedRole = normalizeString(updates.role);

    if (requestedRole) {
        if (!ROLE_VALUES.has(requestedRole)) {
            throw new Error("Invalid role");
        }

        sanitized.role = requestedRole;
    }

    const requestedAccountStatus = normalizeString(updates.accountStatus);
    if (requestedAccountStatus) {
        if (!ACCOUNT_STATUSES.has(requestedAccountStatus)) {
            throw new Error("Invalid account status");
        }

        sanitized.accountStatus = requestedAccountStatus;
    }

    const requestedLegalStatus = normalizeString(updates.legalStatus);
    if (requestedLegalStatus) {
        if (!LEGAL_STATUSES.has(requestedLegalStatus)) {
            throw new Error("Invalid legal status");
        }

        sanitized.legalStatus = requestedLegalStatus;
    }

    if (typeof updates.isVerified === "boolean") {
        sanitized.isVerified = updates.isVerified;
    }

    const stringFields = [
        "businessName",
        "businessLocation",
        "phoneNumber",
        "businessLicense",
        "taxId",
        "governmentIdNumber",
        "legalNotes",
        "verificationNotes",
        "sellerDescription",
        "sellerSupportEmail",
        "sellerWhatsappNumber",
        "sellerLocationCity",
        "sellerLocationRegion",
        "sellerLocationCountry",
        "sellerBadgeLabel",
        "sellerBillingNotes",
        "riderBaseLocation",
        "licensePlate",
        "driversLicense",
        "riderBillingNotes",
    ];

    stringFields.forEach((field) => {
        if (field in updates) {
            sanitized[field] = normalizeString(updates[field]);
        }
    });

    const requestedBadgeTone = normalizeString(updates.sellerBadgeTone);
    if (requestedBadgeTone) {
        if (!BADGE_TONES.has(requestedBadgeTone)) {
            throw new Error("Invalid seller badge tone");
        }

        sanitized.sellerBadgeTone = requestedBadgeTone;
    }

    const requestedSupportPriority = normalizeString(updates.sellerSupportPriority);
    if (requestedSupportPriority) {
        if (!SUPPORT_PRIORITIES.has(requestedSupportPriority)) {
            throw new Error("Invalid support priority");
        }

        sanitized.sellerSupportPriority = requestedSupportPriority;
    }

    const requestedPlan = normalizeString(updates.sellerSubscriptionPlan);
    if (requestedPlan) {
        if (!SELLER_SUBSCRIPTION_PLANS.includes(requestedPlan)) {
            throw new Error("Invalid seller subscription plan");
        }

        sanitized.sellerSubscriptionPlan = requestedPlan;
    }

    const requestedSubscriptionStatus = normalizeString(updates.sellerSubscriptionStatus);
    if (requestedSubscriptionStatus) {
        if (!SELLER_SUBSCRIPTION_STATUSES.includes(requestedSubscriptionStatus)) {
            throw new Error("Invalid seller subscription status");
        }

        sanitized.sellerSubscriptionStatus = requestedSubscriptionStatus;
    }

    if ("sellerSubscriptionFee" in updates) {
        const fee = Number(updates.sellerSubscriptionFee);
        sanitized.sellerSubscriptionFee = Number.isFinite(fee) && fee >= 0 ? fee : 0;
    }

    const requestedVehicleType = normalizeString(updates.vehicleType);
    if (requestedVehicleType) {
        if (!VEHICLE_TYPES.has(requestedVehicleType)) {
            throw new Error("Invalid vehicle type");
        }

        sanitized.vehicleType = requestedVehicleType;
    }

    const requestedRiderAvailability = normalizeString(updates.riderAvailability);
    if (requestedRiderAvailability) {
        if (!RIDER_AVAILABILITY_VALUES.has(requestedRiderAvailability)) {
            throw new Error("Invalid rider availability");
        }

        sanitized.riderAvailability = requestedRiderAvailability;
    }

    const requestedRiderPlan = normalizeString(updates.riderSubscriptionPlan);
    if (requestedRiderPlan) {
        if (!RIDER_SUBSCRIPTION_PLANS.includes(requestedRiderPlan)) {
            throw new Error("Invalid rider subscription plan");
        }

        sanitized.riderSubscriptionPlan = requestedRiderPlan;
    }

    const requestedRiderSubscriptionStatus = normalizeString(updates.riderSubscriptionStatus);
    if (requestedRiderSubscriptionStatus) {
        if (!RIDER_SUBSCRIPTION_STATUSES.includes(requestedRiderSubscriptionStatus)) {
            throw new Error("Invalid rider subscription status");
        }

        sanitized.riderSubscriptionStatus = requestedRiderSubscriptionStatus;
    }

    if ("riderSubscriptionFee" in updates) {
        const fee = Number(updates.riderSubscriptionFee);
        sanitized.riderSubscriptionFee = Number.isFinite(fee) && fee >= 0 ? fee : 0;
    }

    const lastPaidAt = "sellerSubscriptionLastPaidAt" in updates
        ? normalizeDate(updates.sellerSubscriptionLastPaidAt)
        : undefined;
    const nextBillingDate = "sellerSubscriptionNextBillingDate" in updates
        ? normalizeDate(updates.sellerSubscriptionNextBillingDate)
        : undefined;
    const accessUntil = "sellerAccessUntil" in updates
        ? normalizeDate(updates.sellerAccessUntil)
        : undefined;

    if (lastPaidAt !== undefined) {
        sanitized.sellerSubscriptionLastPaidAt = lastPaidAt;
    }

    if (nextBillingDate !== undefined) {
        sanitized.sellerSubscriptionNextBillingDate = nextBillingDate;
    }

    if (accessUntil !== undefined) {
        sanitized.sellerAccessUntil = accessUntil;
    }

    const finalSubscriptionStatus = sanitized.sellerSubscriptionStatus || existingUser?.sellerSubscriptionStatus || "active";
    const finalLastPaidAt = lastPaidAt !== undefined ? lastPaidAt : normalizeDate(existingUser?.sellerSubscriptionLastPaidAt);
    const shouldSetAccessWindow = ACTIVE_SELLER_STATUSES.has(finalSubscriptionStatus);

    if (shouldSetAccessWindow && finalLastPaidAt) {
        if (!("sellerSubscriptionStartedAt" in sanitized) && !existingUser?.sellerSubscriptionStartedAt) {
            sanitized.sellerSubscriptionStartedAt = finalLastPaidAt;
        }

        if (nextBillingDate === undefined) {
            sanitized.sellerSubscriptionNextBillingDate = addMonths(finalLastPaidAt, 1);
        }

        if (accessUntil === undefined) {
            sanitized.sellerAccessUntil = addMonths(finalLastPaidAt, 1);
        }
    }

    const riderLastPaidAt = "riderSubscriptionLastPaidAt" in updates
        ? normalizeDate(updates.riderSubscriptionLastPaidAt)
        : undefined;
    const riderNextBillingDate = "riderSubscriptionNextBillingDate" in updates
        ? normalizeDate(updates.riderSubscriptionNextBillingDate)
        : undefined;
    const riderAccessUntil = "riderAccessUntil" in updates
        ? normalizeDate(updates.riderAccessUntil)
        : undefined;

    if (riderLastPaidAt !== undefined) {
        sanitized.riderSubscriptionLastPaidAt = riderLastPaidAt;
    }

    if (riderNextBillingDate !== undefined) {
        sanitized.riderSubscriptionNextBillingDate = riderNextBillingDate;
    }

    if (riderAccessUntil !== undefined) {
        sanitized.riderAccessUntil = riderAccessUntil;
    }

    const finalRiderSubscriptionStatus = sanitized.riderSubscriptionStatus || existingUser?.riderSubscriptionStatus || "active";
    const finalRiderLastPaidAt = riderLastPaidAt !== undefined ? riderLastPaidAt : normalizeDate(existingUser?.riderSubscriptionLastPaidAt);
    const shouldSetRiderAccessWindow = ACTIVE_RIDER_STATUSES.has(finalRiderSubscriptionStatus);

    if (shouldSetRiderAccessWindow && finalRiderLastPaidAt) {
        if (!("riderSubscriptionStartedAt" in sanitized) && !existingUser?.riderSubscriptionStartedAt) {
            sanitized.riderSubscriptionStartedAt = finalRiderLastPaidAt;
        }

        if (riderNextBillingDate === undefined) {
            sanitized.riderSubscriptionNextBillingDate = addMonths(finalRiderLastPaidAt, 1);
        }

        if (riderAccessUntil === undefined) {
            sanitized.riderAccessUntil = addMonths(finalRiderLastPaidAt, 1);
        }
    }

    const nextBadgeLabel = "sellerBadgeLabel" in sanitized
        ? sanitized.sellerBadgeLabel
        : normalizeString(existingUser?.sellerBadgeLabel);

    if (sanitized.isVerified === true && !nextBadgeLabel) {
        sanitized.sellerBadgeLabel = "Verified Seller";
        sanitized.sellerBadgeTone = sanitized.sellerBadgeTone || existingUser?.sellerBadgeTone || "emerald";
        sanitized.sellerBadgeGrantedAt = new Date();
        sanitized.sellerBadgeGrantedBy = adminUserId;
    }

    if (sanitized.isVerified === false && nextBadgeLabel === "Verified Seller" && !("sellerBadgeLabel" in sanitized)) {
        sanitized.sellerBadgeLabel = "";
    }

    if ("sellerBadgeLabel" in sanitized) {
        const hasBadge = Boolean(sanitized.sellerBadgeLabel);
        const badgeUnchanged = sanitized.sellerBadgeLabel === normalizeString(existingUser?.sellerBadgeLabel);
        sanitized.sellerBadgeGrantedAt = hasBadge
            ? (badgeUnchanged ? existingUser?.sellerBadgeGrantedAt || new Date() : new Date())
            : null;
        sanitized.sellerBadgeGrantedBy = hasBadge
            ? (badgeUnchanged ? existingUser?.sellerBadgeGrantedBy || adminUserId : adminUserId)
            : "";
    }

    return sanitized;
};

export async function POST(request) {
    try {
        const adminUserId = await getRequestUserId(request);
        const isAdmin = await authAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { targetUserId, userId, updates = {} } = await request.json();
        const resolvedTargetUserId = normalizeString(targetUserId || userId);

        if (!resolvedTargetUserId) {
            return NextResponse.json({ success: false, message: "A target user is required" }, { status: 400 });
        }

        await connectDB();
        await syncUserFromClerk(resolvedTargetUserId);

        const existingUser = await User.findById(resolvedTargetUserId);
        if (!existingUser) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const currentRole = await getUserRole(resolvedTargetUserId);
        const sanitizedUpdates = sanitizeUpdates(updates, existingUser, adminUserId);
        const changedFields = getChangedAccountFields({
            currentRole,
            existingUser,
            updates: sanitizedUpdates,
        });

        const updatedUser = await User.findByIdAndUpdate(
            resolvedTargetUserId,
            { $set: sanitizedUpdates },
            { new: true }
        );

        if (sanitizedUpdates.role && sanitizedUpdates.role !== currentRole) {
            const client = await clerkClient();
            await client.users.updateUserMetadata(resolvedTargetUserId, {
                publicMetadata: { role: sanitizedUpdates.role }
            });
            invalidateUserRoleCache(resolvedTargetUserId);
        }

        const accountNotification = buildAccountUpdateNotification({
            currentRole,
            existingUser,
            updatedUser: {
                ...(updatedUser?.toObject?.() || updatedUser || {}),
                role: sanitizedUpdates.role || currentRole || "buyer",
            },
            changes: changedFields,
        });

        if (accountNotification) {
            await notifyUsers([{
                userId: resolvedTargetUserId,
                notification: {
                    type: "system",
                    title: accountNotification.title,
                    message: accountNotification.message,
                    read: false,
                    date: new Date(),
                },
                emailTitle: accountNotification.emailTitle,
                emailMessage: accountNotification.emailMessage,
                ctaLabel: accountNotification.ctaLabel,
                ctaPath: accountNotification.ctaPath,
            }]);
        }

        return NextResponse.json({
            success: true,
            message: "User updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
