'use client'

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";

const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (image && typeof image === "object" && typeof image.src === "string") return image.src;
  return assets.upload_area;
};

export const CartProductImage = ({ product }) => {
  const [src, setSrc] = useState(() => getProductImage(product));
  useEffect(() => { setSrc(getProductImage(product)); }, [product]);

  return (
    <Image
      src={src || assets.upload_area}
      alt={product?.name || "Product"}
      className="h-full w-full object-contain"
      width={72}
      height={72}
      onError={() => setSrc(assets.upload_area)}
    />
  );
};

// One cart line. Extracted from the page so its narrow-viewport behaviour can
// be measured directly instead of only through a populated, signed-in cart.
//
// Layout is deliberately two-row on phones: thumbnail beside the title block,
// then the stepper and line total on their own row. A single row spent ~188px
// on fixed controls, leaving under 90px for the product name at 360px.
const CartItemRow = ({
  product,
  quantity,
  isMutating = false,
  formatCurrency,
  onOpen,
  onIncrease,
  onDecrease,
  onRemove,
}) => (
  <article className={`flex min-w-0 gap-2.5 rounded-lg bg-white p-2.5 ring-1 ring-gray-100 transition-opacity ${isMutating ? "opacity-60" : ""}`}>
    <button
      type="button"
      onClick={onOpen}
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50"
      aria-label={`View ${product.name}`}
    >
      <CartProductImage product={product} />
    </button>

    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <h2 className="line-clamp-2 min-w-0 break-words text-[12.5px] font-semibold leading-[16px] text-gray-950">
          {product.name}
        </h2>
        <button
          type="button"
          disabled={isMutating}
          onClick={onRemove}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Remove ${product.name}`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <p className="mt-0.5 truncate text-[10.5px] text-gray-500">{formatCurrency(product.offerPrice)} each</p>

      {/* min-w-0 on both children plus wrapping lets a long UGX total drop to
          its own line rather than pushing the stepper off-screen. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex shrink-0 items-center rounded-full bg-gray-100 p-0.5">
          <button
            type="button"
            disabled={isMutating}
            onClick={onDecrease}
            className="flex h-7 w-7 items-center justify-center rounded-full text-orange-600 transition active:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <Image src={assets.decrease_arrow} alt="" className="h-2.5 w-2.5" />
          </button>
          <span className="min-w-[1.5rem] text-center text-[12px] font-bold tabular-nums text-gray-950">{quantity}</span>
          <button
            type="button"
            disabled={isMutating}
            onClick={onIncrease}
            className="flex h-7 w-7 items-center justify-center rounded-full text-orange-600 transition active:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Image src={assets.increase_arrow} alt="" className="h-2.5 w-2.5" />
          </button>
        </div>
        <p className="min-w-0 break-words text-right text-[13px] font-bold text-gray-950">
          {formatCurrency(product.offerPrice * quantity)}
        </p>
      </div>
    </div>
  </article>
);

export default CartItemRow;
