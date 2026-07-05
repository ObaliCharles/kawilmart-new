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
        const newAddress = await Address.create({...address,userId})

        return NextResponse.json({ success: true, message: "Address added succesfully", newAddress  })

    } catch (error) {
        return NextResponse.json({ success: false, message: "Error adding address", error: error.message })
    }
}
