"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "onError" | "onLoad" | "src"> & { src: string; fallbackSrc?: string };

export function HaircutImage({ fallbackSrc, src, alt, className, style, ...props }: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = src;
  const currentSource = failedSources.includes(source) && fallbackSrc ? fallbackSrc : src;
  const broken = failedSources.includes(currentSource);
  if (broken) return <span role={alt ? "img" : undefined} aria-label={alt || undefined} className={`image-fallback ${props.fill ? "absolute inset-0" : "block w-full"}`} style={{ aspectRatio: props.fill ? undefined : `${props.width ?? 800} / ${props.height ?? 1100}` }}><span aria-hidden="true">ESTILO / GREÑA</span></span>;
  return <Image {...props} src={currentSource} alt={alt} className={className} style={style} onError={() => setFailedSources((failed) => [...failed, currentSource])} />;
}
