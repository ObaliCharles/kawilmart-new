import { getOrSyncDatabaseUser } from "@/lib/clerkUserSync";
import { getRequestUserId } from "@/lib/requestAuth";
import { persistSanitizedUserCart } from "@/lib/serverCart";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" });
        }

        const user = await getOrSyncDatabaseUser(userId)

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" })
        }

        const cartItems = await persistSanitizedUserCart(user)

        return NextResponse.json({ success: true, cartItems })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}
