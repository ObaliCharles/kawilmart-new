'use client'

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { getMarketplacePulseItems, sortProductsForLiveShowcase } from "@/lib/liveCommerce";

const MarketplacePulse = () => {
  const { products, loadingProducts, navigate, prefetchRoute } = useAppContext();
  const pulseItems = getMarketplacePulseItems(sortProductsForLiveShowcase(products));
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = pulseItems[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [pulseItems.length]);

  useEffect(() => {
    if (pulseItems.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % pulseItems.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [pulseItems.length]);

  if (loadingProducts || !activeItem) {
    return null;
  }

  return (
    <section className="mt-4">
      <div className="rounded-[1.4rem] border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(activeItem.href)}
            onMouseEnter={() => prefetchRoute(activeItem.href)}
            onFocus={() => prefetchRoute(activeItem.href)}
            className="min-w-0 text-left"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f7f7f6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                Marketplace pulse
              </span>
              <p className="truncate text-sm text-gray-700">
                {activeItem.message}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/all-products")}
            onMouseEnter={() => prefetchRoute("/all-products")}
            onFocus={() => prefetchRoute("/all-products")}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            See hot products
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default MarketplacePulse;
