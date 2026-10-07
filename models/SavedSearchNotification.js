import mongoose from "mongoose";

const savedSearchNotificationSchema = new mongoose.Schema({
    savedSearchId: { type: mongoose.Schema.Types.ObjectId, ref: "SavedSearch", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    userId: { type: String, required: true },
}, { timestamps: true });

savedSearchNotificationSchema.index({ savedSearchId: 1, productId: 1 }, { unique: true });
savedSearchNotificationSchema.index({ userId: 1, createdAt: -1 });

const SavedSearchNotification = mongoose.models.SavedSearchNotification || mongoose.model("SavedSearchNotification", savedSearchNotificationSchema);
export default SavedSearchNotification;
