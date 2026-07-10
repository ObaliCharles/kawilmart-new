'use client'
import React from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import Skeleton from "@/components/Skeleton";
import { useEffect, useState } from "react";

const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  if (typeof image === "string" && image.trim()) {
    return image.trim();
  }

  if (image && typeof image === "object" && typeof image.src === "string") {
    return image.src;
  }

  return assets.upload_area;
};

const CartProductImage = ({ product }) => {
  const [src, setSrc] = useState(() => getProductImage(product));

  useEffect(() => {
    setSrc(getProductImage(product));
  }, [product]);

  return (
    <Image
      src={src || assets.upload_area}
      alt={product?.name || "Cart product"}
      className="h-full w-full object-contain"
      width={100}
      height={100}
      onError={() => setSrc(assets.upload_area)}
    />
  );
};

const CartItemSkeleton = () => (
  <article className="flex gap-4 rounded-lg border border-gray-100 bg-white p-4">
    <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-8 w-28 rounded-md" />
    </div>
  </article>
);

const Cart = () => {
  const {
    products,
    router,
    addToCart,
    updateCartQuantity,
    getCartCount,
    formatCurrency,
    resolvedCartItems,
    loadingProducts,
    loadingUser,
  } = useAppContext();
  const visibleCartItemIds = Object.keys(resolvedCartItems).filter((itemId) => resolvedCartItems[itemId] > 0);
  const isCartHydrating = loadingUser || (loadingProducts && visibleCartItemIds.length > 0);
  const cartCount = getCartCount();

  return (
    <>
      <Navbar hideMobileHeader />
      <main className="min-h-screen bg-gray-50/80 px-4 pb-24 pt-4 sm:px-6 md:px-10 md:py-8 lg:px-12">
        <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-gray-200/80 bg-gray-50/95 px-4 pb-3 pt-8 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => router.back()} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-white">
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-gray-950">Cart ({cartCount})</h1>
            <button type="button" onClick={() => visibleCartItemIds.forEach((itemId) => updateCartQuantity(itemId, 0))} aria-label="Clear cart" className="text-xs font-medium text-gray-500 hover:text-red-600">
              Clear
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <header className="hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Checkout</h1>
            <p className="mt-1 text-sm text-gray-500">{cartCount} item{cartCount === 1 ? "" : "s"} in your cart</p>
          </header>

          <div className="mt-0 grid gap-5 md:mt-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="space-y-3">
              {isCartHydrating && (
                <>
                  {Array.from({ length: Math.max(1, Math.min(visibleCartItemIds.length || 2, 3)) }).map((_, index) => (
                    <CartItemSkeleton key={index} />
                  ))}
                </>
              )}

              {!isCartHydrating && visibleCartItemIds.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                  <p className="text-sm font-medium text-gray-700">Your cart is empty</p>
                  <p className="mt-1 text-xs text-gray-500">Add items to continue checkout.</p>
                  <button
                    onClick={() => router.push("/all-products")}
                    className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    Browse products
                  </button>
                </div>
              )}

              {!isCartHydrating && visibleCartItemIds.map((itemId) => {
                const product = products.find(product => product._id === itemId);
                const quantity = resolvedCartItems[itemId];
                if (quantity <= 0) return null;

                if (!product) {
                  return (
                    <article key={itemId} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This item is no longer available and will be removed from your cart.
                    </article>
                  );
                }

                const lineTotal = product.offerPrice * quantity;

                return (
                  <article key={itemId} className="relative rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-red-500"
                      onClick={() => updateCartQuantity(product._id, 0)}
                      aria-label="Remove item"
                    >
                      <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>

                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-50 sm:h-[4.5rem] sm:w-[4.5rem]">
                        <CartProductImage product={product} />
                      </div>

                      <div className="min-w-0 flex-1 pr-6">
                        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">{product.name}</h2>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatCurrency(product.offerPrice)} each
                          <span className="mx-1.5 text-gray-300">·</span>
                          SKU {product._id.slice(-6).toUpperCase()}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50/50">
                            <button type="button" onClick={() => updateCartQuantity(product._id, quantity - 1)} className="flex h-9 w-9 items-center justify-center text-orange-600" aria-label="Decrease quantity">
                              <Image src={assets.decrease_arrow} alt="" className="h-3 w-3" />
                            </button>
                            <input
                              onChange={e => updateCartQuantity(product._id, Number(e.target.value))}
                              type="number"
                              value={quantity}
                              className="w-10 min-w-0 bg-transparent text-center text-sm font-medium outline-none"
                            />
                            <button type="button" onClick={() => addToCart(product._id)} className="flex h-9 w-9 items-center justify-center text-orange-600" aria-label="Increase quantity">
                              <Image src={assets.increase_arrow} alt="" className="h-3 w-3" />
                            </button>
                          </div>

                          <p className="text-sm font-bold text-gray-950">{formatCurrency(lineTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <OrderSummary />
            </div>
          </div>

          {visibleCartItemIds.length > 0 && (
            <button onClick={() => router.push('/all-products')} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700">
              <Image className="h-3.5 w-3.5 rotate-180" src={assets.arrow_right_icon_colored} alt="" />
              Continue shopping
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Cart;
