const DATE_FIELD_KEYS = new Set([
    "sellerSubscriptionLastPaidAt",
    "sellerSubscriptionNextBillingDate",
    "sellerAccessUntil",
    "sellerSubscriptionStartedAt",
    "riderSubscriptionLastPaidAt",
    "riderSubscriptionNextBillingDate",
    "riderAccessUntil",
    "riderSubscriptionStartedAt",
    "sellerBadgeGrantedAt",
]);

const SELLER_SUBSCRIPTION_FIELDS = new Set([
    "sellerSubscriptionPlan",
    "sellerSubscriptionStatus",
    "sellerSubscriptionFee",
    "sellerSubscriptionLastPaidAt",
    "sellerSubscriptionNextBillingDate",
    "sellerAccessUntil",
    "sellerBillingNotes",
]);

const RIDER_SUBSCRIPTION_FIELDS = new Set([
    "riderSubscriptionPlan",
    "riderSubscriptionStatus",
    "riderSubscriptionFee",
    "riderSubscriptionLastPaidAt",
    "riderSubscriptionNextBillingDate",
    "riderAccessUntil",
    "riderBillingNotes",
]);

const PROFILE_FIELDS = new Set([
    "businessName",
    "businessLocation",
    "phoneNumber",
    "businessLicense",
    "taxId",
    "governmentIdNumber",
    "sellerDescription",
    "sellerSupportEmail",
    "sellerWhatsappNumber",
    "sellerLocationCity",
    "sellerLocationRegion",
    "sellerLocationCountry",
    "riderBaseLocation",
    "vehicleType",
    "licensePlate",
    "driversLicense",
]);

const BADGE_AND_SUPPORT_FIELDS = new Set([
    "sellerBadgeLabel",
    "sellerBadgeTone",
    "sellerSupportPriority",
]);

const LEGAL_AND_ACCOUNT_FIELDS = new Set([
    "accountStatus",
    "legalStatus",
    "legalNotes",
    "verificationNotes",
]);

const intersects = (keys, values) => values.some((value) => keys.has(value));

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeDate = (value) => {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};

const compareValues = (left, right, field) => {
    if (DATE_FIELD_KEYS.has(field)) {
        const leftDate = normalizeDate(left);
        const rightDate = normalizeDate(right);

        if (!leftDate && !rightDate) {
            return true;
        }

        return leftDate?.getTime() === rightDate?.getTime();
    }

    if (typeof right === "number") {
        return Number(left || 0) === Number(right || 0);
    }

    if (typeof right === "boolean") {
        return Boolean(left) === right;
    }

    return normalizeString(left) === normalizeString(right);
};

const formatDateLabel = (value) => {
    const date = normalizeDate(value);
    if (!date) {
        return "";
    }

    return date.toLocaleDateString("en-UG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export const formatRoleLabel = (role = "") => {
    const normalized = normalizeString(role).toLowerCase();
    if (!normalized) {
        return "buyer";
    }

    return normalized;
};

export const getDashboardPathForRole = (role = "") => {
    const normalized = formatRoleLabel(role);

    if (normalized === "seller") {
        return "/seller";
    }

    if (normalized === "rider") {
        return "/dashboard/rider";
    }

    if (normalized === "admin") {
        return "/admin";
    }

    return "/inbox";
};

export const getChangedAccountFields = ({
    currentRole = "",
    existingUser = {},
    updates = {},
} = {}) => (
    Object.entries(updates).filter(([field, value]) => {
        const previousValue = field === "role" ? currentRole : existingUser?.[field];
        return !compareValues(previousValue, value, field);
    })
);

export const buildAccountUpdateNotification = ({
    currentRole = "buyer",
    existingUser = {},
    updatedUser = {},
    changes = [],
} = {}) => {
    if (!changes.length) {
        return null;
    }

    const changedKeys = new Set(changes.map(([field]) => field));
    const roleAfter = updatedUser?.role || changes.find(([field]) => field === "role")?.[1] || currentRole || "buyer";
    const lines = [];

    if (changedKeys.has("role")) {
        lines.push(`Your role is now ${formatRoleLabel(roleAfter)}.`);
    }

    if (changedKeys.has("accountStatus")) {
        lines.push(`Your account status is now ${updatedUser?.accountStatus || "active"}.`);
    }

    if (changedKeys.has("legalStatus")) {
        lines.push(`Your legal review status is ${updatedUser?.legalStatus || "pending"}.`);
    }

    if (changedKeys.has("isVerified")) {
        lines.push(updatedUser?.isVerified
            ? "Your verification has been approved."
            : "Your verification status was updated.");
    }

    if (intersects(changedKeys, [...BADGE_AND_SUPPORT_FIELDS])) {
        if (updatedUser?.sellerBadgeLabel) {
            lines.push(`Your public seller badge is now "${updatedUser.sellerBadgeLabel}".`);
        } else if (changedKeys.has("sellerBadgeLabel")) {
            lines.push("Your public seller badge was updated.");
        }

        if (changedKeys.has("sellerSupportPriority")) {
            lines.push(`Your support priority is ${updatedUser?.sellerSupportPriority || "standard"}.`);
        }
    }

    if (intersects(changedKeys, [...SELLER_SUBSCRIPTION_FIELDS])) {
        const subscriptionLine = `Your seller subscription is ${updatedUser?.sellerSubscriptionStatus || "active"} on the ${updatedUser?.sellerSubscriptionPlan || "standard"} plan.`;
        lines.push(subscriptionLine);

        if (updatedUser?.sellerAccessUntil) {
            lines.push(`Selling access is set through ${formatDateLabel(updatedUser.sellerAccessUntil)}.`);
        }
    }

    if (intersects(changedKeys, [...RIDER_SUBSCRIPTION_FIELDS])) {
        const subscriptionLine = `Your rider subscription is ${updatedUser?.riderSubscriptionStatus || "active"} on the ${updatedUser?.riderSubscriptionPlan || "standard"} plan.`;
        lines.push(subscriptionLine);

        if (updatedUser?.riderAccessUntil) {
            lines.push(`Delivery access is set through ${formatDateLabel(updatedUser.riderAccessUntil)}.`);
        }
    }

    if (changedKeys.has("riderAvailability")) {
        lines.push(`Your rider availability is now ${updatedUser?.riderAvailability || "available"}.`);
    }

    if (intersects(changedKeys, [...LEGAL_AND_ACCOUNT_FIELDS])) {
        if (changedKeys.has("verificationNotes") || changedKeys.has("legalNotes")) {
            lines.push("Your compliance notes were updated by KawilMart.");
        }
    }

    if (intersects(changedKeys, [...PROFILE_FIELDS])) {
        lines.push("Your profile details were updated by KawilMart.");
    }

    const uniqueLines = [...new Set(lines)].filter(Boolean);
    const title = changedKeys.has("role")
        ? "Role updated"
        : changedKeys.has("isVerified")
            ? "Verification updated"
            : intersects(changedKeys, [...SELLER_SUBSCRIPTION_FIELDS, ...RIDER_SUBSCRIPTION_FIELDS])
                ? "Subscription updated"
                : "Account updated";
    const fullMessage = uniqueLines.join(" ");
    const previewMessage = fullMessage.length > 180 ? `${fullMessage.slice(0, 177)}...` : fullMessage;

    return {
        title,
        message: previewMessage || "Your KawilMart account was updated by an admin.",
        emailTitle: `KawilMart ${title.toLowerCase()}`,
        emailMessage: fullMessage || "Your KawilMart account was updated by an admin.",
        ctaLabel: "Review account",
        ctaPath: getDashboardPathForRole(roleAfter),
    };
};
