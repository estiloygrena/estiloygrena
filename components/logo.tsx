"use client";
import Image from "next/image";
import { useState } from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return <span className="relative inline-grid items-center" aria-label="Estilo y Greña">
    <span className={`display ${loaded ? "opacity-0" : "opacity-100"} ${compact ? "text-2xl" : "text-5xl sm:text-7xl"}`}>Estilo<br />y Greña</span>
    <Image className={`absolute inset-0 h-full w-auto object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} src="/logo.png" alt="" width={280} height={140} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
  </span>;
}
