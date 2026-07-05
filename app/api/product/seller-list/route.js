import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        await connectDB()

        const products = await Product.find({ userId })
        return NextResponse.json({ success: true, products })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}
