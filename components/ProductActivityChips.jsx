'use client'

import React from "react";
import { getLiveActivityItems } from "@/lib/liveCommerce";

const toneClasses = {
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
  warm: "border-orange-100 bg-orange-50 text-orange-700",
  fresh: "border-emerald-100 bg-emerald-50 text-emerald-700",
  alert: "border-amber-100 bg-amber-50 text-amber-700",
};

const ProductActivityChips = ({ product, maxItems = 3, compact = false, className = "" }) => {
  const items = getLiveActivityItems(product).slice(0, maxItems);

  if (!items.length) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <span
          key={item.key}
          className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium ${compact ? "text-[10px]" : "text-[11px]"} ${toneClasses[item.tone] || toneClasses.neutral}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

export default ProductActivityChips;
