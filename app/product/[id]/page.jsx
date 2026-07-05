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

const Product = () => {

    const { id } = useParams();

    const { products, addToCart, formatCurrency, navigate, prefetchRoute, toggleProductLike } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [liking, setLiking] = useState(false);
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
    const relatedProducts = sortProductsForLiveShowcase(
        products.filter((product) => product._id !== id)
    ).slice(0, 5);

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
            <div className="mx-auto max-w-7xl rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
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
                                className={`cursor-pointer overflow-hidden rounded-md border bg-white ${image === (mainImage || productData.image[0]) ? "border-2 border-orange-500" : "border-gray-200"}`}
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
                    <div className="relative order-1 overflow-hidden rounded-lg border border-gray-200 bg-white sm:order-2">
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
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-950">Color:</p>
                      <div className="mt-3 flex gap-4">
                        {["#d6b49d", "#111827", "#ffffff", "#6b7280", "#312e81"].map((color, index) => (
                          <button
                            key={color}
                            type="button"
                            className={`h-8 w-8 rounded-full border ${index === 0 ? "ring-2 ring-orange-600 ring-offset-2" : "border-gray-200"}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-950">Quantity:</p>
                      <div className="mt-3 flex h-10 w-36 items-center justify-between rounded-md border border-gray-200 px-4">
                        <span className="font-semibold text-orange-600">-</span>
                        <span className="font-semibold text-gray-950">1</span>
                        <span className="font-semibold text-orange-600">+</span>
                      </div>
                    </div>
                    <hr className="my-6 border-gray-200" />
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full table-auto border-collapse text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="bg-gray-50 px-4 py-3 font-medium text-gray-600">Store</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{productData.sellerProfile?.name || 'Marketplace seller'}</span>
                                            <SellerTrustBadge sellerProfile={productData.sellerProfile} />
                                        </div>
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="bg-gray-50 px-4 py-3 font-medium text-gray-600">Business area</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {productData.sellerProfile?.location || productData.sellerLocation || 'Location pending'}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="bg-gray-50 px-4 py-3 font-medium text-gray-600">Category</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {productData.category}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="bg-gray-50 px-4 py-3 font-medium text-gray-600">Item location</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {productData.location || productData.sellerLocation || 'Location pending'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-gray-50 px-4 py-3 font-medium text-gray-600">Availability</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {stockSnapshot?.label || 'Stock updates soon'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {productActivity ? (
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-500">You save</p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                    {productActivity.hasDiscount ? formatCurrency(productActivity.savingsAmount) : 'Current best price'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600">Buyer feedback</p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                    {productActivity.hasRating
                                        ? `${productActivity.displayRating}/5`
                                        : `${productActivity.likesCount} like${productActivity.likesCount === 1 ? '' : 's'}`}
                                </p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                    {stockSnapshot?.hasTrackedStock ? 'Stock level' : productActivity.flashDealCountdownLabel ? 'Deal window' : 'Available in'}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                    {stockSnapshot?.hasTrackedStock
                                        ? stockSnapshot.label
                                        : productActivity.flashDealCountdownLabel
                                        ? `Ends in ${productActivity.flashDealCountdownLabel}`
                                        : productActivity.localTrend}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Seller Information */}
                    <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Seller Information</h3>
                        <div className="space-y-2 text-sm">
                            <p>
                                <strong>Store:</strong>{" "}
                                {productData.sellerProfile?.name || 'Seller'}
                            </p>
                            <SellerTrustBadge sellerProfile={productData.sellerProfile} />
                            <p><strong>Business Location:</strong> {productData.sellerProfile?.location || productData.sellerLocation || 'Location pending'}</p>
                            <p><strong>Product Location:</strong> {productData.location || productData.sellerLocation || 'Location pending'}</p>
                            <p>
                                <strong>Seller Rating:</strong>{" "}
                                {productData.sellerProfile?.ratingSummary?.totalReviews
                                    ? `${productData.sellerProfile?.ratingSummary?.overall || 0} / 5 (${productData.sellerProfile?.ratingSummary?.totalReviews || 0} reviews)`
                                    : 'No seller reviews yet'}
                            </p>
                            <p><strong>Trending near:</strong> {getLocationLabel(productData.sellerLocation || productData.location)}</p>
                            <p className="rounded-md bg-white px-3 py-2 text-xs text-orange-800">
                                Seller contact unlocks only after you place an order and the seller accepts it in KawilMart.
                            </p>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    {productData.reviews && productData.reviews.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Reviews ({productData.reviews.length})</h3>
                            <div className="space-y-4">
                                {productData.reviews.map((review, index) => (
                                    <div key={index} className="rounded-lg border border-gray-200 p-4">
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

                    <div className="mt-10 flex flex-col gap-3">
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
                          className="w-fit text-sm font-semibold text-orange-600"
                        >
                          Heart Add to wishlist
                        </button>
                    </div>
                    <div className="mt-5 space-y-3 rounded-xl border border-orange-100 bg-orange-50 p-4 text-[13px] text-gray-700">
                      <p>Sold by KawilMart Seller</p>
                      <p>Free delivery by Tue, 28 May</p>
                      <p>30-day returns</p>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4 mt-16">
                    <p className="text-center text-2xl font-medium sm:text-3xl">Hot <span className="font-medium text-orange-600">Right Now</span></p>
                    <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
                </div>
                <div className="mt-6 grid w-full grid-cols-1 gap-3 pb-14 min-[340px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
                    {relatedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
                <button
                    onClick={() => navigate('/all-products')}
                    onMouseEnter={() => prefetchRoute('/all-products')}
                    onFocus={() => prefetchRoute('/all-products')}
                    className="mb-16 w-full rounded border px-8 py-2 text-gray-500/70 transition hover:bg-slate-50/90 sm:w-auto"
                >
                    See more
                </button>
            </div>
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
