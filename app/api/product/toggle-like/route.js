import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import { serializeProductForClient } from "@/lib/productRating";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Please sign in to like products." },
                { status: 401 }
            );
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { success: false, message: "Product ID is required." },
                { status: 400 }
            );
        }

        await connectDB();

        const product = await Product.findById(productId);

        if (!product) {
            return NextResponse.json(
                { success: false, message: "Product not found." },
                { status: 404 }
            );
        }

        const likedBy = Array.isArray(product.likedBy) ? product.likedBy : [];
        const alreadyLiked = likedBy.includes(userId);

        product.likedBy = alreadyLiked
            ? likedBy.filter((id) => id !== userId)
            : [...new Set([...likedBy, userId])];
        product.likesCount = product.likedBy.length;

        await product.save();

        return NextResponse.json({
            success: true,
            liked: !alreadyLiked,
            message: alreadyLiked ? "Removed from likes." : "Thanks for liking this product.",
            product: serializeProductForClient(product, userId),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
