"use client"
import { useEffect, useRef, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import React from "react";
import ProductRating from "@/components/ProductRating";
import { ProductDetailSkeleton } from "@/components/PageSkeletons";
import ProductActivityChips from "@/components/ProductActivityChips";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import { getLocationLabel, getProductActivitySnapshot, sortProductsForLiveShowcase } from "@/lib/liveCommerce";
import { getProductStockSnapshot } from "@/lib/productStock";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";

const Product = () => {

    const { id } = useParams();

    const { products, addToCart, formatCurrency, navigate, prefetchRoute, toggleProductLike, triggerCartFly } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [liking, setLiking] = useState(false);
    const mainImageRef = useRef(null);
    const [cartAction, setCartAction] = useState(null);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const feedbackTimeoutRef = useRef(null);

    const fetchProductData = async () => {
        const product = products.find(product => product._id === id);
        setProductData(product);
    }

    useEffect(() => {
        fetchProductData();
        // Product details are derived from route params and context products.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, products])

    const handleLikeClick = async () => {
        if (!productData || liking) {
            return;
        }

        setLiking(true);
        await toggleProductLike(productData._id);
        setLiking(false);
    };

    const handleAddToCart = async () => {
        if (!productData || cartAction) {
            return;
        }

        setCartAction('add');
        const result = await addToCart(productData._id);
        setCartAction(null);

        if (result?.success) {
            triggerCartFly(mainImageRef.current, mainImage || productData.image[0]);
            setAddedFeedback(true);
            if (feedbackTimeoutRef.current) {
                window.clearTimeout(feedbackTimeoutRef.current);
            }

            feedbackTimeoutRef.current = window.setTimeout(() => {
                setAddedFeedback(false);
            }, 1400);
        }
    };

    const handleBuyNow = async () => {
        if (!productData || cartAction) {
            return;
        }

        setCartAction('buy');
        const result = await addToCart(productData._id);

        if (result?.success) {
            navigate('/cart');
        } else {
            setCartAction(null);
        }
    };

    const productActivity = productData ? getProductActivitySnapshot(productData) : null;
    const stockSnapshot = productData ? getProductStockSnapshot(productData) : null;
    const isOutOfStock = stockSnapshot?.status === 'out';
    // Related items: same category first (what "related" actually means to a
    // shopper), padded with general best-performers only when needed.
    const sameCategoryProducts = sortProductsForLiveShowcase(
        products.filter((product) => product._id !== id
            && categoryMatchesSelection(product.category, productData?.category))
    );
    const relatedProducts = sameCategoryProducts.length >= 5
        ? sameCategoryProducts.slice(0, 5)
        : [
            ...sameCategoryProducts,
            ...sortProductsForLiveShowcase(
                products.filter((product) => product._id !== id
                    && !sameCategoryProducts.some((entry) => entry._id === product._id))
            ),
        ].slice(0, 5);
    const relatedTitleIsCategory = sameCategoryProducts.length >= 3;

    useEffect(() => {
        recordRecentlyViewed(id);
    }, [id]);

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                window.clearTimeout(feedbackTimeoutRef.current);
            }
        };
    }, []);

    return productData ? (<>
        <Navbar />
        <div className="bg-white px-4 py-8 pb-24 sm:px-6 md:px-10 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 text-sm text-gray-500">
                Home <span className="mx-2">/</span> {productData.category} <span className="mx-2">/</span> {productData.name}
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[45fr_55fr] md:gap-8 lg:gap-10">
                <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)]">
                    <div className="order-2 grid grid-cols-5 gap-2 sm:order-1 sm:grid-cols-1">
                        {productData.image.slice(0, 6).map((image, index) => (
                            <div
                                key={index}
                                onClick={() => setMainImage(image)}
                                className={`cursor-pointer overflow-hidden rounded-lg bg-white transition ${image === (mainImage || productData.image[0]) ? "ring-2 ring-orange-500" : "ring-1 ring-gray-100 hover:ring-orange-200"}`}
                            >
                                <Image
                                    src={image}
                                    alt={`${productData.name} preview ${index + 1}`}
                                    className="aspect-square w-full object-contain p-2"
                                    width={160}
                                    height={160}
                                    sizes="72px"
                                />
                            </div>

                        ))}
                    </div>
                    <div ref={mainImageRef} className="relative order-1 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:order-2">
                        <button type="button" className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-500 shadow-sm" aria-label="Zoom image">
                          <Image src={assets.search_icon} alt="" className="h-5 w-5" />
                        </button>
                        <Image
                            src={mainImage || productData.image[0]}
                            alt={productData.name}
                            className="aspect-square w-full bg-white object-contain p-5"
                            width={1280}
                            height={720}
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h1 className="text-[22px] font-bold leading-tight text-gray-950">
                            {productData.name}
                        </h1>
                        <button
                            onClick={handleLikeClick}
                            className={`shrink-0 rounded-md border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                                productData.likedByCurrentUser
                                    ? "border-orange-200 bg-orange-50 text-orange-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:text-orange-600"
                            } ${liking ? "opacity-60" : ""}`}
                        >
                            {productData.likedByCurrentUser ? "Liked" : "Like"} · {productData.likesCount || 0}
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <ProductRating product={productData} size="lg" />
                      <span className="text-gray-300">|</span>
                      <button type="button" className="font-semibold text-orange-600">See all reviews</button>
                    </div>
                    <p className="mt-3 text-[13px] text-gray-600">
                      by <span className="font-semibold text-orange-600">{productData.sellerProfile?.name || "KawilMart Seller"}</span>
                    </p>
                    <hr className="my-5 border-gray-100" />
                    <ProductActivityChips product={productData} maxItems={4} className="mb-4" />
                    <p className="text-[32px] font-extrabold text-orange-600">
                        {formatCurrency(productData.offerPrice)}
                        {productActivity?.hasDiscount ? (
                            <span className="ml-3 align-middle text-base font-normal text-gray-400 line-through">
                                {formatCurrency(productData.price)}
                            </span>
                        ) : null}
                        {productActivity?.hasDiscount ? (
                          <span className="ml-3 align-middle rounded-md bg-red-500 px-2 py-1 text-sm font-bold text-white">
                            -{productActivity.priceDropPercent}%
                          </span>
                        ) : null}
                    </p>
                    {productData.description ? (
                        <div className="mt-5">
                            <p className={`text-[13px] leading-6 text-gray-600 ${showFullDescription ? "" : "line-clamp-3"}`}>
                                {productData.description}
                            </p>
                            {productData.description.length > 160 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowFullDescription((current) => !current)}
                                    className="mt-1 text-xs font-semibold text-orange-600 transition hover:text-orange-700"
                                >
                                    {showFullDescription ? "Show less" : "Read more"}
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Compact product + seller facts — one soft panel, no tables */}
                    <div className="mt-5 rounded-xl bg-gray-50/80 p-3.5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
                            <div className="col-span-2 flex flex-wrap items-center gap-2">
                                <span className="text-gray-400">Store</span>
                                <span className="font-semibold text-gray-900">{productData.sellerProfile?.name || 'Marketplace seller'}</span>
                                <SellerTrustBadge sellerProfile={productData.sellerProfile} />
                                {productData.sellerProfile?.ratingSummary?.totalReviews ? (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                        ★ {productData.sellerProfile?.ratingSummary?.overall || 0}/5 ({productData.sellerProfile?.ratingSummary?.totalReviews})
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <span className="block text-gray-400">Category</span>
                                <span className="font-medium text-gray-800">{productData.category}</span>
                            </div>
                            <div>
                                <span className="block text-gray-400">Availability</span>
                                <span className="font-medium text-gray-800">{stockSnapshot?.label || 'Stock updates soon'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-400">Item location</span>
                                <span className="font-medium text-gray-800">{productData.location || productData.sellerLocation || 'Location pending'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-400">Trending near</span>
                                <span className="font-medium text-gray-800">{getLocationLabel(productData.sellerLocation || productData.location)}</span>
                            </div>
                        </div>
                        <p className="mt-3 border-t border-gray-100 pt-2.5 text-[11px] text-gray-400">
                            Seller contact unlocks after you place an order and the seller accepts it.
                        </p>
                    </div>

                    {productActivity ? (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">You save</p>
                                <p className="mt-0.5 truncate text-sm font-bold text-gray-900">
                                    {productActivity.hasDiscount ? formatCurrency(productActivity.savingsAmount) : 'Best price'}
                                </p>
                            </div>
                            <div className="rounded-xl bg-sky-50 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Feedback</p>
                                <p className="mt-0.5 truncate text-sm font-bold text-gray-900">
                                    {productActivity.hasRating
                                        ? `${productActivity.displayRating}/5`
                                        : `${productActivity.likesCount} like${productActivity.likesCount === 1 ? '' : 's'}`}
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                    {stockSnapshot?.hasTrackedStock ? 'Stock' : productActivity.flashDealCountdownLabel ? 'Deal ends' : 'Trend'}
                                </p>
                                <p className="mt-0.5 truncate text-sm font-bold text-gray-900">
                                    {stockSnapshot?.hasTrackedStock
                                        ? stockSnapshot.label
                                        : productActivity.flashDealCountdownLabel
                                        ? productActivity.flashDealCountdownLabel
                                        : productActivity.localTrend}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Reviews Section */}
                    {productData.reviews && productData.reviews.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Reviews ({productData.reviews.length})</h3>
                            <div className="space-y-4">
                                {productData.reviews.map((review, index) => (
                                    <div key={index} className="rounded-xl bg-gray-50/80 p-3.5">
                                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="font-medium">{review.userName}</span>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Image
                                                        key={i}
                                                        src={i < review.rating ? assets.star_icon : assets.star_dull_icon}
                                                        alt="star"
                                                        className="h-4 w-4"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm">{review.comment}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(review.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-2.5">
                        <button
                            onClick={handleAddToCart}
                            disabled={!!cartAction || isOutOfStock}
                            className={`h-12 w-full rounded-[10px] py-3.5 text-sm font-semibold transition ${
                                isOutOfStock
                                    ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                                    : cartAction
                                    ? 'cursor-wait bg-gray-200 text-gray-500'
                                    : addedFeedback
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                        >
                            {isOutOfStock ? 'Sold out' : cartAction === 'add' ? 'Adding...' : addedFeedback ? 'Added' : 'Add to cart'}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={!!cartAction || isOutOfStock}
                            className={`h-12 w-full rounded-[10px] border-2 py-3.5 text-sm font-semibold transition ${
                                isOutOfStock
                                    ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500'
                                    : cartAction
                                    ? 'cursor-wait border-orange-300 bg-orange-50 text-orange-500'
                                    : 'border-orange-600 bg-white text-orange-600 hover:bg-orange-50'
                            }`}
                        >
                            {isOutOfStock ? 'Unavailable' : cartAction === 'buy' ? 'Adding...' : 'Buy now'}
                        </button>
                        <button
                          type="button"
                          onClick={handleLikeClick}
                          className={`inline-flex w-fit items-center gap-2 text-sm font-semibold ${productData.likedByCurrentUser ? "text-red-600" : "text-orange-600"}`}
                        >
                          <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill={productData.likedByCurrentUser ? "currentColor" : "none"}>
                            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                          </svg>
                          {productData.likedByCurrentUser ? "Saved to wishlist" : "Add to wishlist"}
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none"><path d="M4 7 12 3l8 4-8 4-8-4Zm0 0v10l8 4 8-4V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Delivered by KawilMart riders
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-orange-600" viewBox="0 0 24 24" fill="none"><path d="M4 7v5h5M20 17v-5h-5M6.4 9A7 7 0 0 1 18 7.8M17.6 15A7 7 0 0 1 6 16.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        30-day returns
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-sky-600" viewBox="0 0 24 24" fill="none"><path d="M12 3 19 6v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Buyer protection
                      </span>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4 mt-16">
                    <p className="text-center text-2xl font-medium sm:text-3xl">
                        {relatedTitleIsCategory
                            ? <>More in <span className="font-medium text-orange-600">{productData.category}</span></>
                            : <>Hot <span className="font-medium text-orange-600">Right Now</span></>}
                    </p>
                    <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
                </div>
                <div className="mt-6 grid w-full grid-cols-1 gap-3 pb-14 min-[340px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
                    {relatedProducts.map((product, index) => <ProductCard key={`related-${index}-${product._id || product.name}`} product={product} />)}
                </div>
                <button
                    onClick={() => navigate('/all-products')}
                    onMouseEnter={() => prefetchRoute('/all-products')}
                    onFocus={() => prefetchRoute('/all-products')}
                    className="mb-16 w-full rounded-full bg-gray-100 px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200 sm:w-auto"
                >
                    See more
                </button>
            </div>
        </div>

        {/* Sticky mobile buy bar: price + actions always reachable above the dock */}
        <div className="fixed inset-x-0 bottom-[4.55rem] z-30 flex items-center gap-2.5 border-t border-gray-100 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
            <div className="min-w-0 shrink-0">
                <p className="text-[14px] font-black leading-tight text-gray-950">{formatCurrency(productData.offerPrice || productData.price)}</p>
                {productActivity?.hasDiscount ? (
                    <p className="text-[10px] font-medium text-gray-400 line-through">{formatCurrency(productData.price)}</p>
                ) : null}
            </div>
            <button
                onClick={handleAddToCart}
                disabled={!!cartAction || isOutOfStock}
                className={`min-w-0 flex-1 rounded-full py-2.5 text-[12px] font-bold transition ${
                    isOutOfStock
                        ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                        : cartAction
                        ? 'cursor-wait bg-gray-200 text-gray-500'
                        : addedFeedback
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-600 text-white'
                }`}
            >
                {isOutOfStock ? 'Sold out' : cartAction === 'add' ? 'Adding...' : addedFeedback ? 'Added ✓' : 'Add to cart'}
            </button>
            <button
                onClick={handleBuyNow}
                disabled={!!cartAction || isOutOfStock}
                className={`min-w-0 flex-1 rounded-full border-2 py-2 text-[12px] font-bold transition ${
                    isOutOfStock
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
                        : 'border-orange-600 bg-white text-orange-600'
                }`}
            >
                {cartAction === 'buy' ? 'Adding...' : 'Buy now'}
            </button>
        </div>
        <Footer />
    </>
    ) : (
        <>
            <Navbar />
            <ProductDetailSkeleton />
            <Footer />
        </>
    )
};

export default Product;
