import { clerkClient } from "@clerk/nextjs/server";

const ROLE_CACHE_TTL_MS = 60 * 1000;

let cacheStore = globalThis.__kawilmartRoleCache;

if (!cacheStore) {
    cacheStore = globalThis.__kawilmartRoleCache = new Map();
}

export async function getUserRole(userId) {
    if (!userId) {
        return null;
    }

    const cached = cacheStore.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.role;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role || user.metadata?.role || null;

    cacheStore.set(userId, {
        role,
        expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    });

    return role;
}

export function invalidateUserRoleCache(userId) {
    if (userId) {
        cacheStore.delete(userId);
    }
}
