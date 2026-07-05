'use client'

import React from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import { ProductsGridSkeleton } from "@/components/PageSkeletons";
import {
  buildCategoryHref,
  categoryMatchesSelection,
  getCategoryMeta,
  homeCategoryValues,
  homeOfferCollectionValues,
} from "@/lib/marketplaceCategories";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import AddressMeta from "@/components/AddressMeta";
import { sortProductsForLiveShowcase } from "@/lib/liveCommerce";

const PRODUCT_BATCH_SIZE = 10;
const HOME_PRODUCT_LIMIT = 30;

const CategoryEditorialPanel = ({ section, quickCategories, reverse, navigate, prefetchRoute, formatCurrency }) => {
  const panelHref = buildCategoryHref(section.value);

  return (
    <div className="pattern-category-sketch-soft col-span-full min-w-0 overflow-hidden rounded-[1.75rem] border border-gray-200 sm:rounded-[2rem]">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`flex flex-col justify-between border-b border-white/70 p-4 sm:p-6 lg:border-b-0 ${reverse ? "lg:order-2 lg:border-l lg:border-r-0 lg:border-white/70" : "lg:border-r lg:border-white/70"}`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-sm sm:gap-3 sm:py-2 sm:text-xs">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f3eee6] text-sm sm:text-base">
                {section.icon}
              </span>
              Category focus
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:mt-5 sm:text-3xl">
              {section.label}
            </h3>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-gray-600 sm:mt-3 sm:leading-7">
              {section.description}
            </p>
          </div>

          <div className="mt-6 space-y-4 sm:mt-8">
            <div className="grid gap-3 min-[360px]:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Live offers</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{section.productCount}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">From</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(section.lowestOffer)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 min-[360px]:col-span-2 xl:col-span-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Top match</p>
                <p className="mt-2 truncate text-lg font-semibold text-gray-900">{section.leadProduct.name}</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Browse more categories
              </p>
              <div className="grid gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
                {quickCategories.map((category) => {
                  const href = buildCategoryHref(category.value);

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => navigate(href)}
                      onMouseEnter={() => prefetchRoute(href)}
                      onFocus={() => prefetchRoute(href)}
                      className="inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 sm:w-auto sm:justify-start"
                    >
                      <span>{category.icon}</span>
                      <span className="min-w-0 truncate [overflow-wrap:anywhere]">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 sm:p-6 ${reverse ? "lg:order-1" : ""}`}>
          <div className="grid gap-3 min-[540px]:grid-cols-2">
            {section.products.map((product, index) => {
              const productHref = `/product/${product._id}`;
              const sellerName = product.sellerProfile?.name || "Marketplace seller";
              const location = product.sellerProfile?.location || product.sellerLocation || product.location || "Location pending";

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => navigate(productHref)}
                  onMouseEnter={() => prefetchRoute(productHref)}
                  onFocus={() => prefetchRoute(productHref)}
                  className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.45rem] border border-white/90 bg-white/95 text-left backdrop-blur-[2px] transition hover:border-orange-300 hover:shadow-sm"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#f9fafb] to-[#eef2ff] p-4">
                    <Image
                      src={product.image[0]}
                      alt={product.name}
                      width={260}
                      height={260}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      sizes={index === 0 ? "(max-width: 539px) 100vw, (max-width: 1023px) 42vw, 260px" : "(max-width: 539px) 100vw, (max-width: 1023px) 42vw, 220px"}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {getCategoryMeta(product.category).label}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-gray-900 [overflow-wrap:anywhere] sm:leading-6">
                      {product.name}
                    </p>
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
                    <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 pt-4">
                      <span className="text-sm font-semibold text-orange-700">
                        {formatCurrency(product.offerPrice)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">View item →</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate(panelHref)}
              onMouseEnter={() => prefetchRoute(panelHref)}
              onFocus={() => prefetchRoute(panelHref)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white sm:w-auto"
            >
              Explore {section.label}
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeProducts = () => {

  const { products, loadingProducts, navigate, prefetchRoute, formatCurrency } = useAppContext()

  const featuredProducts = sortProductsForLiveShowcase(products).slice(0, HOME_PRODUCT_LIMIT)

  const categorySections = homeOfferCollectionValues
    .map((categoryValue) => {
      const categoryProducts = featuredProducts.filter((product) =>
        categoryMatchesSelection(product.category, categoryValue)
      )

      if (categoryProducts.length < 2) {
        return null
      }

      const meta = getCategoryMeta(categoryValue)

      return {
        value: categoryValue,
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
        leadProduct: categoryProducts[0],
        products: categoryProducts.slice(0, 4),
        lowestOffer: Math.min(...categoryProducts.map((product) => Number(product.offerPrice) || 0)),
        productCount: categoryProducts.length,
      }
    })
    .filter(Boolean)

  const panelCount = Math.max(0, Math.min(categorySections.length, Math.floor((featuredProducts.length - 1) / PRODUCT_BATCH_SIZE)))

  if (loadingProducts) {
    return <ProductsGridSkeleton />
  }

  return (
    <div className="flex flex-col items-center pt-14">
      <div className="w-full">
        <p className="text-2xl font-semibold text-gray-900">Hot right now</p>
        <p className="mt-1 text-sm text-gray-500">
          Current picks pulled from active flash deals, recent listings, and highly rated products already in your catalog.
        </p>
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-3 min-[340px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: Math.ceil(featuredProducts.length / PRODUCT_BATCH_SIZE) }).map((_, chunkIndex) => {
          const start = chunkIndex * PRODUCT_BATCH_SIZE
          const chunkProducts = featuredProducts.slice(start, start + PRODUCT_BATCH_SIZE)
          const section = chunkIndex < panelCount ? categorySections[chunkIndex] : null
          const quickCategories = homeCategoryValues
            .slice((chunkIndex * 4) % homeCategoryValues.length)
            .concat(homeCategoryValues.slice(0, (chunkIndex * 4) % homeCategoryValues.length))
            .slice(0, 6)
            .map((categoryValue) => ({
              value: categoryValue,
              label: getCategoryMeta(categoryValue).label,
              icon: getCategoryMeta(categoryValue).icon,
            }))

          return (
            <React.Fragment key={`chunk-${chunkIndex}`}>
              {chunkProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}

              {section ? (
                <CategoryEditorialPanel
                  section={section}
                  quickCategories={quickCategories}
                  reverse={chunkIndex % 2 === 1}
                  navigate={navigate}
                  prefetchRoute={prefetchRoute}
                  formatCurrency={formatCurrency}
                />
              ) : null}
            </React.Fragment>
          )
        })}
      </div>

      <button
        onClick={() => navigate("/all-products")}
        className="mt-10 rounded-full border border-gray-300 px-12 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;
