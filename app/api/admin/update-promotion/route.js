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

        const { productId, isFlashDeal, flashDealStartDate, flashDealEndDate, promotionType } = await request.json();

        if (!productId) {
            return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
        }

        const startDate = flashDealStartDate ? new Date(flashDealStartDate) : null;
        const endDate = flashDealEndDate ? new Date(flashDealEndDate) : null;

        if (isFlashDeal) {
            if (!endDate || Number.isNaN(endDate.getTime())) {
                return NextResponse.json({ success: false, message: "A valid flash deal end date is required" }, { status: 400 });
            }
            if (endDate.getTime() <= Date.now()) {
                return NextResponse.json({ success: false, message: "Flash deal end date must be in the future" }, { status: 400 });
            }
            if (startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() >= endDate.getTime()) {
                return NextResponse.json({ success: false, message: "Flash deal start date must be before the end date" }, { status: 400 });
            }
        }

        await connectDB();

        const updateData = {
            isFlashDeal: Boolean(isFlashDeal),
            flashDealStartDate: isFlashDeal && startDate && !Number.isNaN(startDate.getTime()) ? startDate : null,
            flashDealEndDate: isFlashDeal ? endDate : null,
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
