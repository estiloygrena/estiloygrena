import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { requiredServerEnv } from "@/lib/env";

const COOKIE_NAME = "eg_admin";
const attempts = new Map<string, { count: number; resetAt: number }>();

function secret() {
  const value = requiredServerEnv("ADMIN_SESSION_SECRET");
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres.");
  return new TextEncoder().encode(value);
}

function safeEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export async function checkLoginRateLimit() {
  const h = await headers();
  const key = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) { attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 }); return true; }
  current.count += 1;
  return current.count <= 8;
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUser = requiredServerEnv("ADMIN_USERNAME");
  const expectedPassword = requiredServerEnv("ADMIN_PASSWORD");
  return Boolean(expectedUser && expectedPassword && safeEqual(username, expectedUser) && safeEqual(password, expectedPassword));
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearAdminSession() { (await cookies()).delete(COOKIE_NAME); }

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  try { const verified = await jwtVerify(token, secret()); return verified.payload.role === "admin"; } catch { return false; }
}

export async function requireAdmin() { if (!(await isAdmin())) redirect("/admin/login"); }

export async function assertAdmin() { if (!(await isAdmin())) throw new Error("UNAUTHORIZED"); }
