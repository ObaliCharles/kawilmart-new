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
  <article className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[80px_minmax(0,1fr)_10rem_9rem] sm:items-center">
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

  return (
    <>
      <Navbar />
      <main className="bg-white px-4 py-8 pb-24 sm:px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            Shopping Cart <span className="text-2xl">({getCartCount()} items)</span>
          </h1>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(22rem,35fr)]">
            <section className="space-y-4">
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
                  <article key={itemId} className="relative grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[80px_minmax(0,1fr)_10rem_9rem] sm:items-center">
                    <button
                      type="button"
                      className="absolute right-4 top-4 text-xs font-bold text-gray-400 hover:text-red-500"
                      onClick={() => updateCartQuantity(product._id, 0)}
                      aria-label="Remove item"
                    >
                      x
                    </button>
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white">
                      <CartProductImage product={product} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="line-clamp-2 pr-6 text-[15px] font-semibold text-gray-950">{product.name}</h2>
                      <p className="mt-2 text-[13px] text-gray-500">Color: Standard <span className="mx-2">|</span> SKU: {product._id.slice(-6).toUpperCase()}</p>
                      <p className="mt-2 text-sm text-gray-500">Unit price: {formatCurrency(product.offerPrice)}</p>
                    </div>

                    <div className="flex h-11 w-36 items-center justify-between rounded-md border border-gray-200 bg-white px-3">
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

                    <p className="text-right text-base font-bold text-orange-600 sm:text-left">
                      {formatCurrency(product.offerPrice * quantity)}
                    </p>
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
