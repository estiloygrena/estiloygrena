import "./load-env";
import { spawnSync } from "node:child_process";
import { requiredServerEnv, safeErrorCode } from "../lib/env";

try {
  const args = process.argv.slice(2);
  if (!(["generate", "migrate status", "migrate deploy"].includes(args.join(" ")))) throw new Error("InvalidCommand");
  if (args[0] !== "generate") requiredServerEnv("DATABASE_URL");
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...args], { encoding: "utf8", env: process.env });
  let output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  for (const [name, value] of Object.entries(process.env)) {
    if (value && /DATABASE_URL|PASSWORD|SECRET|TOKEN|ACCESS_KEY|ACCOUNT_ID|BUCKET_NAME/.test(name)) output = output.split(value).join("[redacted]");
  }
  output = output.replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "[redacted database URL]");
  console.log(output);
  process.exitCode = result.status ?? 1;
} catch (error) { console.error(`Prisma: ${safeErrorCode(error)}`); process.exitCode = 1; }
