'use client'
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";

const WishlistPage = () => {
  const { products, loadingProducts, navigate } = useAppContext();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const likedProducts = products.filter((product) => product.likedByCurrentUser);
  const isHydrating = !isLoaded || (user && loadingProducts && products.length === 0);

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 pb-24 sm:px-6 md:py-6 lg:px-8">
        <header className="mb-4">
          <h1 className="text-lg font-bold text-gray-950">Wishlist</h1>
          <p className="text-xs text-gray-500">
            {likedProducts.length
              ? `${likedProducts.length} saved item${likedProducts.length === 1 ? "" : "s"}`
              : "Items you like are saved here"}
          </p>
        </header>

        {isHydrating ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[0.62/1] rounded-lg" />
            ))}
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white px-5 py-14 text-center ring-1 ring-gray-100">
            <p className="text-sm font-medium text-gray-700">Sign in to see your wishlist</p>
            <p className="mt-1 text-xs text-gray-500">Tap the heart on any product to save it here.</p>
            <button type="button" onClick={() => openSignIn()} className="mt-4 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700">
              Sign in
            </button>
          </div>
        ) : likedProducts.length === 0 ? (
          <div className="rounded-xl bg-white px-5 py-14 text-center ring-1 ring-gray-100">
            <svg className="mx-auto h-10 w-10 text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-700">Nothing saved yet</p>
            <p className="mt-1 text-xs text-gray-500">Tap the heart on any product to keep it here for later.</p>
            <button type="button" onClick={() => navigate("/all-products")} className="mt-4 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700">
              Start browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {likedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default WishlistPage;
