import { loadEnvConfig } from "@next/env";

// Match Next.js precedence without logging file contents.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info() {}, error() { console.error("No se pudo cargar un archivo de entorno."); } });
