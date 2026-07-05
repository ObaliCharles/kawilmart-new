import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    source: { type: String, default: "homepage" },
    active: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

const NewsletterSubscriber = mongoose.models.newsletter_subscriber || mongoose.model("newsletter_subscriber", newsletterSubscriberSchema);

export default NewsletterSubscriber;
