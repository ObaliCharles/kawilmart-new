import { NextResponse } from "next/server";
import { sanitizeApiErrorMessage } from "@/lib/apiErrors";
import { getStorefrontProductById } from "@/lib/getStorefrontProducts";
import { getRequestAuth } from "@/lib/requestAuth";

export async function GET(request) {
    try {
        let userId = null;
        try {
            const authState = await getRequestAuth(request);
            userId = authState.userId;
        } catch {
            userId = null;
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
        }

        const product = await getStorefrontProductById(productId, { userId });
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        const response = NextResponse.json({ success: true, product });
        response.headers.set(
            "Cache-Control",
            userId ? "private, no-store" : "public, s-maxage=300, stale-while-revalidate=600"
        );
        return response;
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Product item API failed:", error?.message || error);
        }

        return NextResponse.json({
            success: false,
            message: sanitizeApiErrorMessage(error?.message, "Unable to load product"),
        }, { status: 500 });
    }
}
