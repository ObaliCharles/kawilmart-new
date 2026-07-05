import { clerkClient } from "@clerk/nextjs/server";
import { getRequestUserId } from "@/lib/requestAuth";
import { invalidateUserRoleCache } from "@/lib/userRoleCache";
import { NextResponse } from "next/server";

const SELF_ADMIN_BOOTSTRAP_ENABLED =
    process.env.NODE_ENV !== "production"
    && process.env.ENABLE_SELF_ADMIN_BOOTSTRAP === "true";

export async function POST(request) {
    try {
        if (!SELF_ADMIN_BOOTSTRAP_ENABLED) {
            return NextResponse.json({
                success: false,
                message: "Self-admin bootstrap is disabled. Assign admin roles from Clerk or an existing admin account.",
            }, { status: 403 });
        }

        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" });
        }

        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'admin'
            }
        });
        invalidateUserRoleCache(userId);

        return NextResponse.json({
            success: true,
            message: "Admin role set successfully! Please refresh the page."
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
