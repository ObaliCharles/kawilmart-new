'use client'

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { defaultSiteContent } from "@/lib/defaultSiteContent";
import { useAppContext } from "@/context/AppContext";

const Banner = ({ banner = defaultSiteContent.promoBanner }) => {
  const { navigate, prefetchRoute } = useAppContext();
  const ctaHref = banner.productId ? `/product/${banner.productId}` : (banner.href || "/all-products");

  return (
    <section className="my-16 overflow-hidden rounded-[2rem] bg-[#E6E9F2]">
      <div className="grid items-center gap-6 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 xl:px-12">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
            Marketplace highlight
          </span>
          <h2 className="max-w-[540px] text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            {banner.title}
          </h2>
          <p className="max-w-[520px] text-sm leading-7 text-gray-700 sm:text-base">
            {banner.description}
          </p>
          <button
            onClick={() => navigate(ctaHref)}
            onMouseEnter={() => prefetchRoute(ctaHref)}
            onFocus={() => prefetchRoute(ctaHref)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:px-8"
          >
            {banner.buttonText || "Buy now"}
            <Image className="transition group-hover:translate-x-1" src={assets.arrow_icon_white} alt="arrow icon" />
          </button>
        </div>

        <div className="relative flex min-h-[240px] items-center justify-center sm:min-h-[280px] lg:min-h-[340px]">
          <div className="absolute inset-x-[10%] bottom-[12%] top-[12%] rounded-full bg-white/60 blur-3xl" />
          <Image
            className="relative h-auto w-full max-w-[260px] object-contain sm:max-w-[320px] lg:max-w-[400px]"
            src={banner.imageUrl || assets.jbl_soundbox_image}
            alt={banner.title || "Promotional banner"}
            width={480}
            height={480}
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 32vw"
          />
        </div>
      </div>
    </section>
  );
};

export default Banner;
