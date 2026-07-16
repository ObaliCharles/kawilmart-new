const isProduction = process.env.NODE_ENV === 'production';

const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data: https:",
    "form-action 'self' https:",
    "frame-ancestors 'self'",
    "img-src 'self' data: blob: https:",
    `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"} https: blob:`,
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "worker-src 'self' blob:",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: contentSecurityPolicy,
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Lets CI/checks build into an isolated dir so a running `next dev`
    // (which owns .next) is never corrupted by a parallel build.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
                pathname: '**',
            },
        ],
        formats: ['image/webp', 'image/avif'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        optimizePackageImports: ['react-hot-toast'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
