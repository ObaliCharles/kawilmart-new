'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import Skeleton from "@/components/Skeleton";

const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (image && typeof image === "object" && typeof image.src === "string") return image.src;
  return assets.upload_area;
};

const CartProductImage = ({ product }) => {
  const [src, setSrc] = useState(() => getProductImage(product));
  useEffect(() => { setSrc(getProductImage(product)); }, [product]);
  return (
    <Image src={src || assets.upload_area} alt={product?.name || "Product"} className="h-full w-full object-contain" width={72} height={72} onError={() => setSrc(assets.upload_area)} />
  );
};

const CartItemSkeleton = () => (
  <article className="flex gap-3 rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
    <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-3.5 w-3/4 rounded-full" />
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
    loadingProducts,
    loadingUser,
  } = useAppContext();
  const visibleCartItemIds = Object.keys(resolvedCartItems).filter((itemId) => resolvedCartItems[itemId] > 0);
  const isCartHydrating = loadingUser || (loadingProducts && visibleCartItemIds.length > 0);
  const cartCount = getCartCount();

  return (
    <>
      <Navbar hideMobileHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-3 pb-20 pt-3 sm:px-6 md:py-6 lg:px-8">
        <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-gray-200/80 bg-[#f8fafc]/95 px-3 pb-2.5 pt-7 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => window.history.back()} aria-label="Go back" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <h1 className="text-sm font-bold text-gray-950">Checkout ({cartCount})</h1>
            <button type="button" onClick={() => visibleCartItemIds.forEach((id) => updateCartQuantity(id, 0))} className="text-[11px] font-medium text-gray-500">Clear</button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <header className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-950">Checkout</h1>
            <p className="text-xs text-gray-500">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
          </header>

          <div className="mt-0 grid gap-4 md:mt-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <section className="space-y-2">
              {isCartHydrating && Array.from({ length: Math.max(1, Math.min(visibleCartItemIds.length || 2, 3)) }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))}

              {!isCartHydrating && visibleCartItemIds.length === 0 && (
                <div className="rounded-xl bg-white px-5 py-10 text-center ring-1 ring-gray-100">
                  <p className="text-sm font-medium text-gray-700">Cart is empty</p>
                  <button type="button" onClick={() => navigate("/all-products")} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white">Browse products</button>
                </div>
              )}

              {!isCartHydrating && visibleCartItemIds.map((itemId) => {
                const product = products.find((entry) => entry._id === itemId);
                const quantity = resolvedCartItems[itemId];
                if (quantity <= 0 || !product) return null;

                return (
                  <article key={itemId} className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-50">
                      <CartProductImage product={product} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-1 text-xs font-semibold text-gray-950">{product.name}</h2>
                      <p className="text-[11px] text-gray-500">{formatCurrency(product.offerPrice)} · Qty {quantity}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => updateCartQuantity(product._id, quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-orange-600" aria-label="Decrease">
                        <Image src={assets.decrease_arrow} alt="" className="h-2.5 w-2.5" />
                      </button>
                      <button type="button" onClick={() => addToCart(product._id)} className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-orange-600" aria-label="Increase">
                        <Image src={assets.increase_arrow} alt="" className="h-2.5 w-2.5" />
                      </button>
                      <button type="button" onClick={() => updateCartQuantity(product._id, 0)} className="ml-0.5 flex h-7 w-7 items-center justify-center text-gray-400 hover:text-red-500" aria-label="Remove">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                    <p className="w-16 shrink-0 text-right text-xs font-bold text-gray-950">{formatCurrency(product.offerPrice * quantity)}</p>
                  </article>
                );
              })}
            </section>

            <div className="lg:sticky lg:top-4 lg:self-start">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Cart;