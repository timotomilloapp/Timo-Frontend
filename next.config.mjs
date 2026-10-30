import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            // Cache-first for images/assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'static-assets',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
            },
        },
        {
            // Network-first for API calls to ensure fresh data when online
            urlPattern: /^https?:\/\/.*\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 1 day
                },
            },
        },
        {
            // Stale-While-Revalidate for other static content
            urlPattern: /^https?.*/,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'others',
                expiration: {
                    maxEntries: 50,
                },
            },
        },
    ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Fix for Next.js 16 + next-pwa conflict
    turbopack: {},
};

export default withPWA(nextConfig);
