import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Em dev o Next.js e o Clerk precisam de unsafe-eval
              isDev
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://clerk.raiopublicador.com.br https://js.stripe.com"
                : "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://clerk.raiopublicador.com.br https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://clerk.raiopublicador.com.br wss://*.clerk.accounts.dev wss://clerk.raiopublicador.com.br",
              "frame-src 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://clerk.raiopublicador.com.br https://js.stripe.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
