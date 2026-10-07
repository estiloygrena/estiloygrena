import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (r2PublicUrl) {
  try {
    const url = new URL(r2PublicUrl);
    remotePatterns.push({ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, pathname: `${url.pathname.replace(/\/$/, "")}/**` });
  } catch {}
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { remotePatterns },
};

export default nextConfig;
