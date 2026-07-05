import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authAdmin from '@/lib/authAdmin';
import authRider from '@/lib/authRider';
import authSeller from '@/lib/authSeller';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isRiderRoute = createRouteMatcher(['/dashboard/rider(.*)']);
const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const adminRoute = isAdminRoute(req);
    const riderRoute = isRiderRoute(req);
    const sellerRoute = isSellerRoute(req);

    if (!adminRoute && !riderRoute && !sellerRoute) {
        return;
    }

    const authResult = await auth();
    const { userId, sessionClaims } = authResult;
    const role = userId ? ((sessionClaims?.publicMetadata as any)?.role || (sessionClaims?.metadata as any)?.role) : undefined;

    if (!userId) {
        return;
    }

    const hasAdminAccess = adminRoute
        ? role === 'admin' || await authAdmin(userId)
        : false;
    const hasRiderAccess = riderRoute
        ? role === 'rider' || role === 'admin' || await authRider(userId)
        : false;
    const hasSellerAccess = sellerRoute
        ? role === 'seller' || role === 'admin' || await authSeller(userId)
        : false;

    if (adminRoute && !hasAdminAccess) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    if (riderRoute && !hasRiderAccess) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    if (sellerRoute && !hasSellerAccess) {
        return NextResponse.redirect(new URL('/', req.url));
    }
});

export const config = {
    matcher: [
        '/admin(.*)',
        '/seller(.*)',
        '/dashboard/rider(.*)',
        '/api/admin(.*)',
        '/api/auth(.*)',
        '/api/cart(.*)',
        '/api/order(.*)',
        '/api/product/add(.*)',
        '/api/product/delete(.*)',
        '/api/product/seller-list(.*)',
        '/api/product/seller-item(.*)',
        '/api/product/update(.*)',
        '/api/rider(.*)',
        '/api/user(.*)',
    ],
};
