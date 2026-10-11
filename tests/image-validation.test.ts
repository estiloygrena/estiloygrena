import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, validateImageFile, validateImageKey } from "@/lib/image-validation";
import { readImage } from "@/lib/r2";

vi.mock("server-only", () => ({}));

describe("image upload validation", () => {
  it("accepts only supported MIME types", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) expect(validateImageFile({ type, size: 1 })).toBeTruthy();
    for (const type of ["image/svg+xml", "text/html", "image/gif", "toString"]) expect(() => validateImageFile({ type, size: 1 })).toThrow();
  });
  it("rejects empty and oversized files", () => {
    for (const size of [0, MAX_IMAGE_BYTES + 1]) expect(() => validateImageFile({ type: "image/jpeg", size })).toThrow();
    expect(validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toBe("jpg");
  });
  it("restricts keys to owned image folders and rejects traversal", () => {
    expect(validateImageKey("gallery/cortes/corte-001.jpeg")).toBe("gallery/cortes/corte-001.jpeg");
    for (const key of ["gallery/../secret.jpg", "/gallery/a.jpg", "healthchecks/a.jpg", "gallery/a.html", "gallery/%2e%2e/a.jpg", "gallery/a.jpg?x=1"]) expect(() => validateImageKey(key)).toThrow();
  });
  it("rejects content spoofed as an allowed image type", async () => {
    await expect(readImage(new File(["<html>"], "image.jpg", { type: "image/jpeg" }))).rejects.toThrow();
    const png = await sharp({ create: { width: 10, height: 20, channels: 3, background: "white" } }).png().toBuffer();
    await expect(readImage(new File([new Uint8Array(png)], "image.jpg", { type: "image/jpeg" }))).rejects.toThrow();
  });
  it("records real dimensions without changing source bytes", async () => {
    const png = await sharp({ create: { width: 10, height: 20, channels: 3, background: "white" } }).png().toBuffer();
    const image = await readImage(new File([new Uint8Array(png)], "image.png", { type: "image/png" }));
    expect(image).toMatchObject({ width: 10, height: 20, extension: "png" });
    expect(image.body).toEqual(png);
  });
});
