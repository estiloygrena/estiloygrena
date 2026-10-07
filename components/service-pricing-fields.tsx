"use client";
import { useState } from "react";
import { DEFAULT_QUOTE_LABEL } from "@/lib/constants";

export function ServicePricingFields({
  initialType = "FIXED",
  priceCents,
  quoteLabel,
}: {
  initialType?: "FIXED" | "QUOTE";
  priceCents?: number | null;
  quoteLabel?: string | null;
}) {
  const [pricingType, setPricingType] = useState<"FIXED" | "QUOTE">(
    initialType,
  );
  return (
    <fieldset className="border-2 border-black p-4 sm:col-span-2">
      <legend className="px-2 text-xs font-black uppercase tracking-[.14em]">
        Tipo de precio
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["FIXED", "Precio fijo"],
            ["QUOTE", "Se cotiza"],
          ] as const
        ).map(([value, label]) => (
          <label
            className={`flex min-h-12 cursor-pointer items-center gap-3 border-2 border-black px-4 font-black uppercase ${pricingType === value ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"}`}
            key={value}
          >
            <input
              type="radio"
              name="pricingType"
              value={value}
              checked={pricingType === value}
              onChange={() => setPricingType(value)}
            />
            {label}
          </label>
        ))}
      </div>
      {pricingType === "FIXED" ? (
        <label className="mt-4 block">
          <span className="label">Precio</span>
          <span className="grid grid-cols-[42px_1fr_58px] items-center border border-black">
            <b className="text-center">$</b>
            <input
              className="min-h-12 border-x border-black px-3 outline-none"
              name="price"
              type="number"
              min="1"
              step="0.01"
              defaultValue={
                priceCents !== null && priceCents !== undefined
                  ? priceCents / 100
                  : ""
              }
              required
            />
            <b className="text-center text-xs">MXN</b>
          </span>
        </label>
      ) : (
        <label className="mt-4 block">
          <span className="label">Texto mostrado al cliente</span>
          <input
            className="field !border-black !text-black"
            name="quoteLabel"
            defaultValue={quoteLabel || DEFAULT_QUOTE_LABEL}
            maxLength={120}
            required
          />
        </label>
      )}
    </fieldset>
  );
}
