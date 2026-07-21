import mongoose from "mongoose";

export const ADDRESS_LABELS = ["Home", "Work", "Other"];

const addressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    // Shown as the card title in the address book, with a matching icon.
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    pincode: { type: String, default: "" },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    region: { type: String, default: "" },
    district: { type: String, default: "" },
    county: { type: String, default: "" },
    subCounty: { type: String, default: "" },
    parish: { type: String, default: "" },
    village: { type: String, default: "" },
    housePlot: { type: String, default: "" },
    roadStreet: { type: String, default: "" },
    landmark: { type: String, default: "" },
    deliveryNotes: { type: String, default: "" },
    // GPS pin captured via browser geolocation — helps riders find the door.
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
    alternatePhone: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    deliveryPreferences: { type: [String], default: [] },
})

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

export default Address;
