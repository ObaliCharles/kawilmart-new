import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    color: {
        type: String,
        enum: ["orange", "green", "blue", "red", "purple", "gray"],
        default: "orange",
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Tag = mongoose.models.tag || mongoose.model("tag", tagSchema);

export default Tag;
