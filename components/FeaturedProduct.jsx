'use client'

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { defaultSiteContent } from "@/lib/defaultSiteContent";
import { useAppContext } from "@/context/AppContext";

const FeaturedProduct = ({ cards = defaultSiteContent.featuredCards }) => {
  const { navigate, prefetchRoute } = useAppContext();
  const featuredCards = Array.isArray(cards) ? cards : defaultSiteContent.featuredCards;

  if (!featuredCards.length) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="flex flex-col items-center">
        <p className="text-3xl font-medium text-gray-900">Featured picks</p>
        <div className="mt-2 h-0.5 w-28 bg-orange-600" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {featuredCards.map((card, index) => {
          const ctaHref = card.productId ? `/product/${card.productId}` : (card.href || "/all-products");

          return (
            <div key={card._id || index} className="group relative isolate min-h-[360px] overflow-hidden rounded-[2rem]">
              <Image
                src={card.imageUrl}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                width={720}
                height={900}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              <div className="relative flex h-full flex-col justify-end p-6 text-white sm:p-7">
                <p className="text-2xl font-semibold leading-tight lg:text-[1.9rem]">{card.title}</p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/85 sm:text-base">
                  {card.description}
                </p>
                <button
                  onClick={() => navigate(ctaHref)}
                  onMouseEnter={() => prefetchRoute(ctaHref)}
                  onFocus={() => prefetchRoute(ctaHref)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold transition hover:bg-orange-700 sm:w-fit"
                >
                  {card.buttonText || "Buy now"}
                  <Image className="h-3 w-3" src={assets.redirect_icon} alt="Redirect icon" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedProduct;
