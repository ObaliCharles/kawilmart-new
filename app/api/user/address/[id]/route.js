import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import Address from "@/models/Address";

// Every handler scopes its query by userId as well as _id, so knowing another
// user's address id is not enough to read, change or delete it.
const findOwnedAddress = async (userId, addressId) => (
    Address.findOne({ _id: addressId, userId })
);

const clearOtherDefaults = async (userId, keepAddressId) => {
    await Address.updateMany(
        { userId, _id: { $ne: keepAddressId }, isDefault: true },
        { $set: { isDefault: false } }
    );
};

export async function PATCH(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const address = await findOwnedAddress(userId, id);
        if (!address) {
            return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
        }

        const body = await request.json();

        // Whitelisted so a client cannot reassign userId or inject fields.
        const editableFields = [
            "label", "fullName", "phoneNumber", "alternatePhone", "region", "district",
            "county", "subCounty", "parish", "village", "housePlot", "roadStreet",
            "landmark", "deliveryNotes", "postalCode", "area", "city", "state",
            "latitude", "longitude", "deliveryPreferences",
        ];

        for (const field of editableFields) {
            if (body[field] !== undefined) {
                address[field] = body[field];
            }
        }

        if (body.isDefault !== undefined) {
            address.isDefault = Boolean(body.isDefault);
        }

        await address.save();

        if (address.isDefault) {
            await clearOtherDefaults(userId, address._id);
        }

        return NextResponse.json({ success: true, message: "Address updated", address });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const address = await findOwnedAddress(userId, id);
        if (!address) {
            return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
        }

        const wasDefault = address.isDefault;
        await Address.deleteOne({ _id: id, userId });

        // Never leave the account without a default — promote the next one so
        // checkout always has an address preselected.
        if (wasDefault) {
            const replacement = await Address.findOne({ userId });
            if (replacement) {
                replacement.isDefault = true;
                await replacement.save();
            }
        }

        return NextResponse.json({ success: true, message: "Address removed" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
