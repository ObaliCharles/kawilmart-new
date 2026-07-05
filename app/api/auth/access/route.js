import { NextResponse } from "next/server";
import { syncUserFromClerk } from "@/lib/clerkUserSync";
import { getRequestAuth } from "@/lib/requestAuth";
import { getUserRole } from "@/lib/userRoleCache";

const buildAccessPayload = ({ userId = null, role = null } = {}) => ({
    authenticated: Boolean(userId),
    userId,
    role,
    isAdmin: role === "admin",
    isSeller: role === "seller" || role === "admin",
    isRider: role === "rider" || role === "admin",
});

export async function GET(request) {
    try {
        const { userId, sessionClaims } = await getRequestAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: true,
                access: buildAccessPayload(),
            });
        }

        const sessionRole =
            sessionClaims?.publicMetadata?.role ||
            sessionClaims?.metadata?.role ||
            null;
        const [syncResult, roleResult] = await Promise.allSettled([
            syncUserFromClerk(userId),
            getUserRole(userId),
        ]);
        const role = roleResult.status === "fulfilled"
            ? roleResult.value || sessionRole || null
            : sessionRole;

        return NextResponse.json({
            success: true,
            access: buildAccessPayload({ userId, role }),
            degraded: syncResult.status === "rejected" || roleResult.status === "rejected",
        });
    } catch (error) {
        return NextResponse.json({
            success: true,
            access: buildAccessPayload(),
            degraded: true,
            message: "Unable to refresh account access right now.",
        });
    }
}
