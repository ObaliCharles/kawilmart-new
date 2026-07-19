import connectDB from "@/config/db";
import { sanitizeApiErrorMessage } from "@/lib/apiErrors";
import { getStorefrontProducts } from "@/lib/getStorefrontProducts";
import { getRequestAuth } from "@/lib/requestAuth";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        let userId = null;
        try {
            const authState = await getRequestAuth(request);
            userId = authState.userId;
        } catch {
            userId = null;
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const rawLimit = parseInt(searchParams.get('limit') || '', 10)
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 1000
        const page = parseInt(searchParams.get('page')) || 1
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''

        const [products, total] = await Promise.all([
            getStorefrontProducts({ limit, page, userId, search, category }),
            Product.estimatedDocumentCount(),
        ])

        const response = NextResponse.json({
            success: true,
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

        // Add cache headers for better performance
        response.headers.set(
            'Cache-Control',
            userId ? 'private, no-store' : 'public, s-maxage=300, stale-while-revalidate=600'
        )

        return response

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Product list API failed:', error?.message || error)
        }

        return NextResponse.json({
            success: false,
            message: sanitizeApiErrorMessage(error?.message, "Unable to load products"),
        })
    }
}
