import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "not authorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
        }

        await connectDB();

        const product = await Product.findOne({ _id: productId, userId });

        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
