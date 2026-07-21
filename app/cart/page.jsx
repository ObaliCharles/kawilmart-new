'use client'
import React, { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import CartItemRow, { CartProductImage } from "@/components/CartItemRow";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import Skeleton from "@/components/Skeleton";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
import { sortProductsForLiveShowcase } from "@/lib/liveCommerce";

const CartItemSkeleton = () => (
  <article className="flex gap-2.5 rounded-lg bg-white p-2 ring-1 ring-gray-100">
    <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
    <div className="min-w-0 flex-1 space-y-1.5">
      <Skeleton className="h-3 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/3 rounded-full" />
    </div>
  </article>
);

const Cart = () => {
  const {
    products,
    navigate,
    addToCart,
    updateCartQuantity,
    getCartCount,
    formatCurrency,
    resolvedCartItems,
    cartMutatingItemIds,
    loadingProducts,
    loadingUser,
  } = useAppContext();
  const visibleCartItemIds = Object.keys(resolvedCartItems).filter((itemId) => resolvedCartItems[itemId] > 0);
  const isCartHydrating = loadingUser || (loadingProducts && visibleCartItemIds.length > 0);
  const cartCount = getCartCount();

  // Cross-sell: best performers from the same categories as the cart items.
  const crossSellProducts = useMemo(() => {
    if (!visibleCartItemIds.length || !products.length) return [];
    const inCart = new Set(visibleCartItemIds);
    const cartCategories = [...new Set(
      visibleCartItemIds
        .map((itemId) => products.find((entry) => entry._id === itemId)?.category)
        .filter(Boolean)
    )];
    if (!cartCategories.length) return [];
    return sortProductsForLiveShowcase(
      products.filter((product) => !inCart.has(product._id)
        && cartCategories.some((category) => categoryMatchesSelection(product.category, category)))
    ).slice(0, 8);
    // visibleCartItemIds is derived fresh each render from resolvedCartItems.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, resolvedCartItems]);

  return (
    <>
      <Navbar hideMobileHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-3 pb-8 pt-0 sm:px-6 md:py-4 lg:px-8">
        {/* Matches the compact MobilePageHeader in Navbar. The negative margin
            has to track the main's padding at every breakpoint or the bar stops
            being full-bleed between sm and md. */}
        <div className="sticky top-0 z-30 -mx-3 mb-2 border-b border-gray-200/80 bg-[#f8fafc]/95 px-3 pb-1.5 pt-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => window.history.back()} aria-label="Go back" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-700">
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <h1 className="truncate text-[13px] font-bold text-gray-950">Checkout ({cartCount})</h1>
            <button
              type="button"
              onClick={() => visibleCartItemIds.forEach((id) => updateCartQuantity(id, 0))}
              disabled={visibleCartItemIds.length === 0}
              className="shrink-0 text-[11px] font-medium text-gray-500 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <header className="hidden md:block mb-3">
            <h1 className="text-lg font-bold text-gray-950">Checkout</h1>
            <p className="text-[11px] text-gray-500">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
          </header>

          {/* Two-pane from md up — tablets have the width for it, and waiting
              until lg left an awkward full-width summary on iPad portrait. */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <section className="space-y-2">
              {isCartHydrating && Array.from({ length: Math.max(1, Math.min(visibleCartItemIds.length || 2, 3)) }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))}

              {!isCartHydrating && visibleCartItemIds.length === 0 && (
                <div className="rounded-xl bg-white px-5 py-8 text-center ring-1 ring-gray-100">
                  <p className="text-sm font-medium text-gray-700">Cart is empty</p>
                  <button type="button" onClick={() => navigate("/all-products")} className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white">Browse products</button>
                </div>
              )}

              {!isCartHydrating && visibleCartItemIds.map((itemId) => {
                const product = products.find((entry) => entry._id === itemId);
                const quantity = resolvedCartItems[itemId];
                if (quantity <= 0 || !product) return null;

                return (
                  <CartItemRow
                    key={itemId}
                    product={product}
                    quantity={quantity}
                    isMutating={cartMutatingItemIds.has(itemId)}
                    formatCurrency={formatCurrency}
                    onOpen={() => navigate(`/product/${product._id}`)}
                    onIncrease={() => addToCart(product._id)}
                    onDecrease={() => updateCartQuantity(product._id, quantity - 1)}
                    onRemove={() => updateCartQuantity(product._id, 0)}
                  />
                );
              })}
            </section>

            <div className="md:sticky md:top-4 md:self-start">
              <OrderSummary />
            </div>
          </div>

          {crossSellProducts.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-2.5 text-sm font-bold text-gray-950">You may also like</h2>
              <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1">
                {crossSellProducts.map((product) => (
                  <div key={`cross-${product._id}`} className="w-[7.6rem] shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
                    <button type="button" onClick={() => navigate(`/product/${product._id}`)} className="block w-full text-left">
                      <span className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                        <CartProductImage product={product} />
                      </span>
                      <span className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-gray-900">{product.name}</span>
                      <span className="block text-[11.5px] font-bold text-gray-950">{formatCurrency(product.offerPrice || product.price)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void addToCart(product._id)}
                      className="mt-1.5 w-full rounded-full bg-orange-50 py-1.5 text-[10.5px] font-bold text-orange-700 transition hover:bg-orange-100"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Cart;
