import { getRequestUserId } from "@/lib/requestAuth";
import Address from "@/models/Address";
import connectDB from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request)
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" })
        }

        await connectDB()
        const addresses = await Address.find({ userId })

        return NextResponse.json({ success: true, addresses });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Error fetching addresses", error: error.message })
    }
}
