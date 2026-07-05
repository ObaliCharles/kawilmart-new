import { auth, clerkClient } from "@clerk/nextjs/server";
import { sanitizeApiErrorMessage } from "@/lib/apiErrors";

const toAuthResult = (authObject, overrides = {}) => ({
    userId: authObject?.userId || null,
    sessionClaims: authObject?.sessionClaims || null,
    isAuthenticated: !!authObject?.userId,
    reason: overrides.reason || null,
    message: overrides.message || null,
});

export async function getRequestAuth(request) {
    try {
        const authObject = await auth({ acceptsToken: "session_token" });

        if (authObject?.userId) {
            return toAuthResult(authObject);
        }
    } catch (error) {
        if (!request) {
            return {
                userId: null,
                sessionClaims: null,
                isAuthenticated: false,
                reason: "auth_unavailable",
                message: sanitizeApiErrorMessage(error?.message, "Unable to resolve Clerk auth state"),
            };
        }
    }

    if (request) {
        try {
            const client = await clerkClient();
            const requestState = await client.authenticateRequest(request, {
                acceptsToken: "session_token",
            });
            const authObject = requestState.toAuth?.() || null;

            if (authObject?.userId) {
                return toAuthResult(authObject, {
                    reason: requestState.reason || null,
                    message: requestState.message || null,
                });
            }
        } catch (error) {
            return {
                userId: null,
                sessionClaims: null,
                isAuthenticated: false,
                reason: "request_auth_failed",
                message: sanitizeApiErrorMessage(error?.message, "Unable to authenticate request"),
            };
        }
    }

    return {
        userId: null,
        sessionClaims: null,
        isAuthenticated: false,
        reason: "not_authenticated",
        message: "No active Clerk session found",
    };
}

export async function getRequestUserId(request) {
    const { userId } = await getRequestAuth(request);
    return userId;
}
