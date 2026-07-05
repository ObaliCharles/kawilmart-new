import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ success: false, message: "Unauthorized" });

        const { productId, isFlashDeal, flashDealEndDate, promotionType } = await request.json();

        await connectDB();

        const updateData = {
            isFlashDeal: isFlashDeal || false,
            flashDealEndDate: flashDealEndDate || null,
            promotionType: promotionType || 'none'
        };

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        return NextResponse.json({
            success: true,
            message: "Promotion updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}