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
  <article className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[80px_minmax(0,1fr)_10rem_9rem] sm:items-center">
    <Skeleton className="h-20 w-20 rounded-lg" />
    <div className="space-y-3">
      <Skeleton className="h-5 w-4/5 rounded-full" />
      <Skeleton className="h-4 w-52 max-w-full rounded-full" />
      <Skeleton className="h-4 w-36 rounded-full" />
    </div>
    <Skeleton className="h-11 w-36 rounded-md" />
    <Skeleton className="h-5 w-24 rounded-full sm:ml-auto" />
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
      <main className="bg-white px-4 pb-24 pt-4 sm:px-6 md:px-10 md:py-8 lg:px-12">
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-gray-200 bg-white px-4 pb-4 pt-8 md:hidden">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-950">
              <svg className="h-6 w-6" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-lg font-extrabold text-gray-950">Shopping Cart ({cartCount})</h1>
            <button type="button" onClick={() => visibleCartItemIds.forEach((itemId) => updateCartQuantity(itemId, 0))} aria-label="Clear cart" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-950">
              <svg className="h-6 w-6" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M6 7h12m-9 0V5h6v2m-7 3 .5 9m7-9-.5 9M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl">
          <h1 className="hidden text-3xl font-bold tracking-tight text-gray-950 md:block">
            Shopping Cart <span className="text-2xl">({cartCount} items)</span>
          </h1>

          <div className="mt-0 grid gap-6 md:mt-6 lg:grid-cols-[minmax(0,65fr)_minmax(22rem,35fr)]">
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white md:space-y-4 md:overflow-visible md:border-0">
              {isCartHydrating && (
                <>
                  {Array.from({ length: Math.max(1, Math.min(visibleCartItemIds.length || 2, 3)) }).map((_, index) => (
                    <CartItemSkeleton key={index} />
                  ))}
                </>
              )}

              {!isCartHydrating && visibleCartItemIds.length === 0 && (
                <div className="p-8 text-sm text-gray-500">
                  Your cart is empty or those items are no longer available.
                </div>
              )}

              {!isCartHydrating && visibleCartItemIds.map((itemId) => {
                const product = products.find(product => product._id === itemId);
                const quantity = resolvedCartItems[itemId];
                if (quantity <= 0) return null;

                if (!product) {
                  return (
                    <article key={itemId} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      This cart item is no longer available in the marketplace and will be removed from your cart.
                    </article>
                  );
                }

                return (
                    <article key={itemId} className="relative grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-gray-200 bg-white p-3 last:border-b-0 min-[380px]:grid-cols-[5.5rem_minmax(0,1fr)] min-[380px]:gap-x-4 min-[380px]:p-4 md:rounded-xl md:border md:grid-cols-[80px_minmax(0,1fr)_10rem_9rem] md:items-center">
                      <button
                        type="button"
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-gray-500 hover:text-red-500"
                        onClick={() => updateCartQuantity(product._id, 0)}
                        aria-label="Remove item"
                      >
                        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-gray-100 bg-white min-[380px]:h-[5.5rem] min-[380px]:w-[5.5rem] md:h-20 md:w-20 md:border-0">
                      <CartProductImage product={product} />
                    </div>

                    <div className="min-w-0 pr-7 md:pr-0">
                      <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-gray-950">{product.name}</h2>
                      <p className="mt-2 text-[13px] text-gray-500">Color: Standard <span className="mx-2">|</span> SKU: {product._id.slice(-6).toUpperCase()}</p>
                      <p className="mt-2 hidden text-sm text-gray-500 md:block">Unit price: {formatCurrency(product.offerPrice)}</p>
                    </div>

                    <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-2 md:contents">
                    <div className="flex h-10 w-32 max-w-full items-center justify-between rounded-md border border-gray-200 bg-white px-2 md:h-11 md:w-36 md:px-3">
                      <button type="button" onClick={() => updateCartQuantity(product._id, quantity - 1)} className="flex h-8 w-8 items-center justify-center text-orange-600" aria-label="Decrease quantity">
                        <Image src={assets.decrease_arrow} alt="" className="h-3 w-3" />
                      </button>
                      <input
                        onChange={e => updateCartQuantity(product._id, Number(e.target.value))}
                        type="number"
                        value={quantity}
                        className="w-10 text-center text-base font-medium outline-none"
                      />
                      <button type="button" onClick={() => addToCart(product._id)} className="flex h-8 w-8 items-center justify-center text-orange-600" aria-label="Increase quantity">
                        <Image src={assets.increase_arrow} alt="" className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="min-w-0 flex-1 text-right text-sm font-bold text-orange-600 [overflow-wrap:anywhere] md:flex-none md:text-left md:text-base">
                      {formatCurrency(product.offerPrice * quantity)}
                    </p>
                    </div>
                  </article>
                );
              })}
            </section>

            <OrderSummary />
          </div>

          <button onClick={() => router.push('/all-products')} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
            <Image className="h-4 w-4 rotate-180" src={assets.arrow_right_icon_colored} alt="" />
            Continue Shopping
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Cart;
