import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
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
    isDefault: { type: Boolean, default: false },
    alternatePhone: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    deliveryPreferences: { type: [String], default: [] },
})

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

export default Address;
