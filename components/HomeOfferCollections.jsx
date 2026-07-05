'use client'

import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { getCategoryMeta } from "@/lib/marketplaceCategories";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import AddressMeta from "@/components/AddressMeta";

const categoryPriority = (product) => {
  if (product.isFlashDeal || product.promotionType === "flash_deal") return 0;
  if (product.promotionType === "featured") return 1;
  if (product.promotionType === "discount") return 2;
  return 3;
};

const sortProductsForCollections = (products) =>
  [...products].sort((a, b) => {
    const promotionDiff = categoryPriority(a) - categoryPriority(b);
    if (promotionDiff !== 0) {
      return promotionDiff;
    }

    return (b.date || 0) - (a.date || 0);
  });

const formatCategoryHighlights = (products) => {
  const uniqueCategories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  return uniqueCategories.slice(0, 3).map((category) => getCategoryMeta(category).label);
};

const HomeOfferCollections = () => {
  const { products, loadingProducts, formatCurrency, navigate, prefetchRoute } = useAppContext();

  if (loadingProducts) {
    return (
      <div className="mt-16 space-y-6" aria-hidden="true">
        <div className="h-8 w-64 animate-pulse rounded-full bg-gray-100" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[280px] animate-pulse rounded-[2rem] bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  const sortedProducts = sortProductsForCollections(products);

  const sellerCards = Object.entries(
    sortedProducts.reduce((acc, product) => {
      if (!product.userId) {
        return acc;
      }

      if (!acc[product.userId]) {
        acc[product.userId] = [];
      }

      acc[product.userId].push(product);
      return acc;
    }, {})
  )
    .map(([sellerId, sellerProducts]) => {
      const sortedSellerProducts = sortProductsForCollections(sellerProducts);
      const primaryProduct = sortedSellerProducts[0];
      const sellerName = primaryProduct?.sellerProfile?.name || "Marketplace seller";
      const sellerLocation = primaryProduct?.sellerProfile?.location || primaryProduct?.sellerLocation || primaryProduct?.location || "Location pending";
      const sellerCategories = formatCategoryHighlights(sortedSellerProducts);
      const bestOffer = Math.min(...sortedSellerProducts.map((product) => Number(product.offerPrice) || 0));

      return {
        key: sellerId,
        title: sellerName,
        location: sellerLocation,
        productCount: sortedSellerProducts.length,
        heroProduct: sortedSellerProducts[0],
        products: sortedSellerProducts.slice(0, 3),
        description: sellerCategories.length
          ? `Currently listing ${sellerCategories.join(", ")}`
          : "Explore this seller's active offers.",
        badge: `${sortedSellerProducts.length} product${sortedSellerProducts.length === 1 ? "" : "s"}`,
        href: `/all-products?seller=${encodeURIComponent(sellerId)}`,
        footer: `Best price ${formatCurrency(bestOffer)}`,
      };
    })
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 2);

  if (!sellerCards.length) {
    return null;
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-3xl font-semibold text-gray-900">Shop by store</p>
          <p className="max-w-2xl text-sm text-gray-500">
            Browse active shops with current listings, real prices, and quick entry into each storefront.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {sellerCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.href)}
            onMouseEnter={() => prefetchRoute(card.href)}
            onFocus={() => prefetchRoute(card.href)}
            className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white text-left transition hover:border-orange-300 hover:shadow-lg"
          >
            <div className="grid gap-0 sm:grid-cols-[minmax(0,220px)_1fr]">
              <div className="relative aspect-[4/3] min-h-[220px] bg-[#f4f2ed] sm:aspect-auto">
                <Image
                  src={card.heroProduct.image[0]}
                  alt={card.heroProduct.name}
                  width={520}
                  height={620}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 640px) 100vw, 220px"
                />
              </div>

              <div className="min-w-0 p-5 sm:p-6">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="inline-flex w-fit rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700 shadow-sm">
                      {card.badge}
                    </span>
                    <div className="mt-4 flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
                      <p className="min-w-0 text-2xl font-semibold text-gray-900 [overflow-wrap:anywhere]">{card.title}</p>
                      <SellerTrustBadge
                        sellerProfile={card.heroProduct?.sellerProfile}
                        className="w-fit max-w-full"
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                    <AddressMeta
                      className="mt-3 text-sm text-gray-500"
                      textClassName="[overflow-wrap:anywhere]"
                    >
                      {card.location}
                    </AddressMeta>
                  </div>
                  <span className="text-sm font-semibold text-orange-700 sm:shrink-0">
                    {card.footer}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {card.products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-[#fbfaf8] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                          {getCategoryMeta(product.category).label}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {product.name}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatCurrency(product.offerPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  Open store offers
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HomeOfferCollections;
