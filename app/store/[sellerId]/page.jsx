"use client"

/* eslint-disable @next/next/no-img-element */
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import { useAppContext } from "@/context/AppContext";
import { getCategoryMeta } from "@/lib/marketplaceCategories";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const StorePage = () => {
  const { sellerId } = useParams();
  const { products, loadingProducts, navigate } = useAppContext();
  const sellerProducts = useMemo(
    () => products.filter((product) => String(product.userId) === String(sellerId)),
    [products, sellerId]
  );
  const leadProduct = sellerProducts[0];
  const seller = leadProduct?.sellerProfile;
  const categories = [...new Set(sellerProducts.map((product) => product.category).filter(Boolean))];
  const rating = seller?.ratingSummary?.overall || 0;
  const reviews = seller?.ratingSummary?.totalReviews || 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white px-4 py-6 pb-24 sm:px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {loadingProducts && !leadProduct ? (
            <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
          ) : leadProduct ? (
            <>
              <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="bg-[#101923] px-5 py-8 text-white sm:px-7 lg:px-9">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/20 bg-white">
                        <img
                          src={seller?.avatarUrl || leadProduct.image?.[0]}
                          alt={seller?.name || "Store avatar"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{seller?.name || "KawilMart Store"}</h1>
                          <SellerTrustBadge sellerProfile={seller} />
                        </div>
                        <p className="mt-2 text-sm text-white/75">{seller?.location || leadProduct.sellerLocation || "Location pending"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/all-products?seller=${encodeURIComponent(String(sellerId))}`)}
                      className="w-fit rounded-md bg-orange-600 px-4 py-2.5 text-sm font-bold text-white"
                    >
                      View all offers
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-7">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Rating</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-950">{rating ? rating.toFixed(1) : "New"}</p>
                    <p className="text-sm text-gray-500">{reviews} review{reviews === 1 ? "" : "s"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Products</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-950">{sellerProducts.length}</p>
                    <p className="text-sm text-gray-500">Active listings</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Followers</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-950">{seller?.followersCount || 0}</p>
                    <p className="text-sm text-gray-500">Store followers</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Support</p>
                    <p className="mt-2 truncate text-base font-bold text-gray-950">{seller?.supportEmail || seller?.email || "Via KawilMart"}</p>
                    <p className="text-sm text-gray-500">Contact after order</p>
                  </div>
                </div>
              </section>

              <section className="mt-7">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-950">Shop Categories</h2>
                    <p className="mt-1 text-sm text-gray-500">{seller?.description || "Browse this seller's active KawilMart listings."}</p>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => navigate(`/all-products?seller=${encodeURIComponent(String(sellerId))}&category=${encodeURIComponent(category)}`)}
                      className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                      {getCategoryMeta(category).label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-3 pb-6 min-[340px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sellerProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </section>
            </>
          ) : (
            <section className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-14 text-center">
              <h1 className="text-2xl font-bold text-gray-950">Store not found</h1>
              <p className="mt-2 text-sm text-gray-500">This seller has no active public products right now.</p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default StorePage;
