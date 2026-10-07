import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export const getSettings = cache(async () => {
  if (!process.env.DATABASE_URL) return DEFAULT_SETTINGS;
  try {
    const rows = await db.siteSetting.findMany();
    return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
