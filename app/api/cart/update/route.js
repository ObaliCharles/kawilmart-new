import { getOrSyncDatabaseUser } from "@/lib/clerkUserSync"
import { areCartItemsEqual, normalizeCartItems } from "@/lib/cart"
import { getRequestUserId } from "@/lib/requestAuth"
import { sanitizeStoredCartItems } from "@/lib/serverCart"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request)
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" })
        }

        const { cartData } = await request.json()
        const normalizedRequestedCart = normalizeCartItems(cartData)

        const user = await getOrSyncDatabaseUser(userId)

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
        }

        const sanitizedCartItems = await sanitizeStoredCartItems(normalizedRequestedCart)

        user.cartItems = sanitizedCartItems
        await user.save()

        return NextResponse.json({
            success: true,
            message: areCartItemsEqual(normalizedRequestedCart, sanitizedCartItems)
                ? "Cart updated successfully"
                : "Unavailable cart items were removed from your cart",
            cartItems: sanitizedCartItems,
        })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}
