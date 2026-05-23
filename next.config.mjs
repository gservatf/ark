/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const connectSources = [
  "'self'",
  "http://127.0.0.1:*",
  "ws://127.0.0.1:*",
  "https://challenges.cloudflare.com",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  supabaseUrl
].filter(Boolean);

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  `connect-src ${connectSources.join(" ")}`,
  "form-action 'self'"
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "same-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  },
  ...(isProduction
    ? [{
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      }]
    : [])
];

const nextConfig = {
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)"
      }
    ];
  }
};

export default nextConfig;
