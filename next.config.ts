import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (r2PublicUrl) {
  try {
    const url = new URL(r2PublicUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("invalid");
    remotePatterns.push({ protocol: "https", hostname: url.hostname, port: url.port, pathname: `${url.pathname.replace(/\/+$/, "")}/**`, search: "" });
  } catch { throw new Error("R2_PUBLIC_URL debe ser una URL HTTPS pública sin credenciales ni parámetros."); }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  images: { remotePatterns },
};

export default nextConfig;
