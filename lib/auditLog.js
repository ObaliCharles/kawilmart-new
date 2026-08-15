import AuditLog from "@/models/AuditLog";

export const writeAuditLog = async ({
    actorId = "",
    action = "",
    targetType = "",
    targetId = "",
    summary = "",
    metadata = {},
} = {}) => {
    if (!actorId || !action || !targetType || !targetId) {
        return null;
    }

    try {
        return await AuditLog.create({
            actorId,
            action,
            targetType,
            targetId,
            summary,
            metadata,
        });
    } catch (error) {
        console.error("Audit log write failed:", error?.message || error);
        return null;
    }
};
