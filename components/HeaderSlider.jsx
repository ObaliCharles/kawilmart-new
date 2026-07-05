'use client'

import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { defaultSiteContent } from "@/lib/defaultSiteContent";
import { useAppContext } from "@/context/AppContext";

const HeaderSlider = ({ slides = defaultSiteContent.heroSlides }) => {
  const { navigate, prefetchRoute } = useAppContext();
  const sliderData = Array.isArray(slides) ? slides : defaultSiteContent.heroSlides;

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (sliderData.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderData.length]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [sliderData.length]);

  const getPrimaryHref = (slide) => {
    if (slide.productId) {
      return `/product/${slide.productId}`;
    }

    return slide.primaryHref || "/all-products";
  };

  const getSecondaryHref = (slide) => slide.secondaryHref || "/all-products?filter=flash";

  if (!sliderData.length) {
    return null;
  }

  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem]">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => {
          const primaryHref = getPrimaryHref(slide);
          const secondaryHref = getSecondaryHref(slide);

          return (
            <div
              key={slide._id || slide.id || index}
              className="grid min-w-full gap-6 bg-[#E6E9F2] px-5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.92fr)] lg:items-center lg:px-12 xl:px-16"
            >
              <div className="order-2 min-w-0 lg:order-1">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm">
                  {slide.offer}
                </span>
                <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl lg:text-[2.9rem] lg:leading-[1.05]">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 sm:text-base">
                  Shop current marketplace offers from active sellers, with tracked pricing and direct checkout inside KawilMart.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    onClick={() => navigate(primaryHref)}
                    onMouseEnter={() => prefetchRoute(primaryHref)}
                    onFocus={() => prefetchRoute(primaryHref)}
                    className="inline-flex items-center justify-center rounded-full bg-orange-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:px-8"
                  >
                    {slide.primaryButtonText || "Shop Now"}
                  </button>
                  <button
                    onClick={() => navigate(secondaryHref)}
                    onMouseEnter={() => prefetchRoute(secondaryHref)}
                    onFocus={() => prefetchRoute(secondaryHref)}
                    className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-white"
                  >
                    {slide.secondaryButtonText || "Explore Deals"}
                    <Image className="transition group-hover:translate-x-1" src={assets.arrow_icon} alt="arrow icon" />
                  </button>
                </div>
              </div>

              <div className="order-1 flex min-h-[220px] items-center justify-center sm:min-h-[280px] lg:order-2 lg:min-h-[360px]">
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="absolute inset-x-[8%] bottom-[12%] top-[12%] rounded-full bg-white/55 blur-3xl" />
                  <Image
                    className="relative h-auto w-full max-w-[240px] object-contain sm:max-w-[320px] lg:max-w-[420px]"
                    src={slide.imageUrl}
                    alt={slide.title || `Slide ${index + 1}`}
                    width={560}
                    height={560}
                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 46vw, 34vw"
                    priority={index === 0}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 bg-white py-4">
        {sliderData.map((slide, index) => (
          <button
            key={slide._id || index}
            type="button"
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all ${
              currentSlide === index ? "w-8 bg-orange-600" : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeaderSlider;
