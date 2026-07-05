'use client'
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { getLocationLabel, getProductActivitySnapshot } from "@/lib/liveCommerce";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import AddressMeta from "@/components/AddressMeta";

const getTimeParts = (milliseconds) => {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (value) => String(value).padStart(2, "0");

const FlashDeals = () => {
  const { products, formatCurrency, navigate, prefetchRoute, setIsRouteLoading } = useAppContext();

  const flashDeals = useMemo(() => (
    products
      .filter((product) => getProductActivitySnapshot(product).flashDealActive)
      .sort((leftProduct, rightProduct) => {
        const leftActivity = getProductActivitySnapshot(leftProduct);
        const rightActivity = getProductActivitySnapshot(rightProduct);

        if (leftActivity.hasFlashDealDeadline && rightActivity.hasFlashDealDeadline) {
          return leftActivity.flashDealEndsAt - rightActivity.flashDealEndsAt;
        }

        if (leftActivity.hasFlashDealDeadline) {
          return -1;
        }

        if (rightActivity.hasFlashDealDeadline) {
          return 1;
        }

        return rightActivity.priceDropPercent - leftActivity.priceDropPercent;
      })
      .slice(0, 6)
  ), [products]);

  const earliestDeadline = useMemo(() => {
    const deadlines = flashDeals
      .map((product) => getProductActivitySnapshot(product).flashDealEndsAt)
      .filter((value) => Number.isFinite(value) && value > Date.now());

    return deadlines.length ? Math.min(...deadlines) : 0;
  }, [flashDeals]);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!earliestDeadline) {
      return undefined;
    }

    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [earliestDeadline]);

  if (!flashDeals.length) {
    return null;
  }

  const hasCountdown = earliestDeadline > now;
  const timeLeft = getTimeParts(earliestDeadline - now);

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">Flash Deals</p>
              <p className="text-sm text-gray-500">Current limited-time prices already active in your marketplace.</p>
            </div>
          </div>

          {hasCountdown ? (
            <div className="inline-flex w-fit items-center gap-1 rounded-2xl bg-orange-600 px-3 py-2 text-sm font-bold text-white">
              <span className="pr-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-100">Ends in</span>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-orange-600">{pad(timeLeft.hours)}</span>
              <span>:</span>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-orange-600">{pad(timeLeft.minutes)}</span>
              <span>:</span>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-orange-600">{pad(timeLeft.seconds)}</span>
            </div>
          ) : (
            <div className="inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
              Limited-time offers live now
            </div>
          )}
        </div>

        <Link
          href="/all-products?filter=flash"
          onClick={() => setIsRouteLoading(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
        >
          See all deals <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {flashDeals.map((product) => {
          const activity = getProductActivitySnapshot(product);
          const location = getLocationLabel(product.sellerProfile?.location || product.sellerLocation || product.location);
          const sellerName = product.sellerProfile?.name || "Marketplace seller";

          return (
            <div
              key={product._id}
              onClick={() => {
                navigate(`/product/${product._id}`);
                scrollTo(0, 0);
              }}
              onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
              onFocus={() => prefetchRoute(`/product/${product._id}`)}
              className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-50 p-4">
                {activity.hasDiscount ? (
                  <span className="absolute left-3 top-3 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-bold text-white">
                    -{activity.priceDropPercent}%
                  </span>
                ) : (
                  <span className="absolute left-3 top-3 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-white">
                    Limited time
                  </span>
                )}

                <Image
                  src={product.image[0]}
                  alt={product.name}
                  width={240}
                  height={240}
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 15vw"
                />
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">{product.name}</p>
                  <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                    <span className="truncate font-medium text-gray-600">{sellerName}</span>
                    <SellerTrustBadge sellerProfile={product.sellerProfile} variant="icon" />
                  </div>
                  <AddressMeta
                    className="mt-1 text-[11px] text-gray-400"
                    textClassName="truncate"
                  >
                    {location}
                  </AddressMeta>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(product.offerPrice)}</p>
                    {activity.hasDiscount ? (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-gray-500">
                  <p>
                    {activity.flashDealCountdownLabel
                      ? `Ends in ${activity.flashDealCountdownLabel}`
                      : "Deal stays active until the seller updates it"}
                  </p>
                  <p>
                    {activity.hasRating
                      ? `${activity.displayRating}/5 rating`
                      : activity.likesCount > 0
                        ? `${activity.likesCount} shopper like${activity.likesCount === 1 ? "" : "s"}`
                        : "Fresh marketplace pick"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FlashDeals;
