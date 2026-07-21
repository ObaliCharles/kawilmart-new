import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import Address from "@/models/Address";


export async function POST(request) {
    try {
        const userId = await getRequestUserId(request)
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" })
        }

        const { address } = await request.json()

        await connectDB()

        // First address is always the default; otherwise honour the request.
        const existingCount = await Address.countDocuments({ userId })
        const shouldBeDefault = existingCount === 0 ? true : Boolean(address?.isDefault)

        const newAddress = await Address.create({ ...address, isDefault: shouldBeDefault, userId })

        // Exactly one default per account, so checkout never has to guess.
        if (shouldBeDefault) {
            await Address.updateMany(
                { userId, _id: { $ne: newAddress._id }, isDefault: true },
                { $set: { isDefault: false } }
            )
        }

        return NextResponse.json({ success: true, message: "Address added succesfully", newAddress  })

    } catch (error) {
        return NextResponse.json({ success: false, message: "Error adding address", error: error.message })
    }
}
