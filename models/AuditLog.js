import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    summary: { type: String, default: "" },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
}, { minimize: false });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
