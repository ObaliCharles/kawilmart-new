'use client'

import React, { useEffect, useRef, useState } from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { getProductStockSnapshot } from '@/lib/productStock';
import { getProductRatingSnapshot } from '@/lib/productRating';
import { getProductActivitySnapshot, getSystemTags } from '@/lib/liveCommerce';

const tagToneClasses = {
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
};

const getProductImage = (product) => {
    const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
    if (typeof image === "string" && image.trim()) return image.trim();
    if (image && typeof image === "object" && typeof image.src === "string") return image.src;
    return assets.upload_area;
};

const ProductCard = ({ product }) => {
    const { addToCart, formatCurrency, navigate, prefetchRoute, toggleProductLike, tagsBySlug } = useAppContext();
    const productHref = `/product/${product._id}`;
    const [liking, setLiking] = useState(false);
    const [liked, setLiked] = useState(Boolean(product.likedByCurrentUser));
    const [isAdding, setIsAdding] = useState(false);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const feedbackTimeoutRef = useRef(null);

    const discountPercent = product.price && product.price > product.offerPrice
      ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
      : null;
    const stockSnapshot = getProductStockSnapshot(product);
    const isOutOfStock = stockSnapshot.status === 'out';
    const { rating, reviewCount, hasRating, filledStars } = getProductRatingSnapshot(product);
    const soldCount = Math.max(0, Number(product.soldCount) || 0);
    const activity = getProductActivitySnapshot(product);
    const showCountdown = activity.flashDealActive && activity.flashDealCountdownLabel;
    const manualTags = Array.isArray(product.tags)
      ? product.tags.map((slug) => tagsBySlug.get(slug)).filter(Boolean)
      : [];
    const manualTagSlugs = new Set(manualTags.map((tag) => tag.slug));
    const systemTags = getSystemTags(product).filter((tag) => !manualTagSlugs.has(tag.slug));
    const badgeTags = [...manualTags, ...systemTags].slice(0, 3);
    const stockBarWidth = stockSnapshot.status === "out"
      ? 0
      : stockSnapshot.status === "low"
        ? 28
        : 62;

    const handleLikeClick = async (e) => {
        e.stopPropagation();
        if (liking) return;

        const nextLiked = !liked;
        setLiked(nextLiked);
        setLiking(true);
        const result = await toggleProductLike(product._id);
        if (!result?.success) {
            setLiked(!nextLiked);
        } else if (typeof result.product?.likedByCurrentUser === "boolean") {
            setLiked(result.product.likedByCurrentUser);
        }
        setLiking(false);
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (isAdding || isOutOfStock) return;

        setIsAdding(true);
        const result = await addToCart(product._id);
        setIsAdding(false);

        if (result?.success) {
            setAddedFeedback(true);
            if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = window.setTimeout(() => setAddedFeedback(false), 1400);
        }
    };

    const handleBuyNow = async (e) => {
        e.stopPropagation();
        if (isAdding || isOutOfStock) return;

        setIsAdding(true);
        const result = await addToCart(product._id);
        setIsAdding(false);

        if (result?.success) {
            navigate('/cart');
        }
    };

    useEffect(() => {
        setLiked(Boolean(product.likedByCurrentUser));
    }, [product.likedByCurrentUser]);

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
        };
    }, []);

    return (
        <article
            onClick={() => {
                navigate(productHref);
                scrollTo(0, 0);
            }}
            onMouseEnter={() => prefetchRoute(productHref)}
            onFocus={() => prefetchRoute(productHref)}
            className="group interactive-lift flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-2 hover:border-orange-300 hover:shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
        >
            <div className="relative flex aspect-[1.12/1] items-center justify-center overflow-hidden rounded-md bg-white">
                <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    className="h-full w-full object-contain p-3 transition duration-200 ease-snappy group-hover:scale-[1.03]"
                    width={360}
                    height={320}
                    sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, (max-width: 1535px) 22vw, 18vw"
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                />
                <span className={`absolute left-0 top-0 rounded-br-md rounded-tl-md px-2.5 py-1 text-xs font-bold text-white ${
                    discountPercent ? "bg-rose-500" : "bg-green-500"
                }`}>
                    {discountPercent ? `-${discountPercent}%` : "NEW"}
                </span>
                {showCountdown ? (
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-gray-950/80 px-2 py-1 text-center text-[10px] font-semibold text-white backdrop-blur-sm">
                        Ends in {activity.flashDealCountdownLabel}
                    </span>
                ) : null}
                <button
                  onClick={handleLikeClick}
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                    liked
                      ? "border-red-100 bg-red-50 text-red-600"
                      : "border-gray-200 bg-white hover:border-orange-200"
                  } ${liking ? "opacity-60" : ""}`}
                  aria-label={liked ? "Unlike product" : "Like product"}
                >
                    <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"}>
                        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                    </svg>
                </button>
            </div>

            <h3 className="mt-2 min-h-[2rem] line-clamp-2 text-[12px] font-semibold leading-4 text-gray-950">
                {product.name}
            </h3>

            {badgeTags.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                    {badgeTags.map((tag) => (
                        <span
                            key={tag.slug}
                            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${tagToneClasses[tag.color] || tagToneClasses.gray}`}
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            ) : null}

            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                <span className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                        <Image
                            key={star}
                            src={star < filledStars ? assets.star_icon : assets.star_dull_icon}
                            alt=""
                            className="h-3.5 w-3.5"
                        />
                    ))}
                </span>
                <span>{hasRating ? rating.toFixed(1) : "New"}{reviewCount > 0 ? ` (${reviewCount})` : ""}</span>
            </div>

            <div className="mt-1.5 space-y-1">
                {stockSnapshot.hasTrackedStock ? (
                    <div className="space-y-0.5">
                        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={`h-full rounded-full ${
                                stockSnapshot.status === "out"
                                    ? "bg-gray-300"
                                    : stockSnapshot.status === "low"
                                        ? "bg-rose-500"
                                        : "bg-orange-500"
                            }`}
                            style={{ width: `${stockBarWidth}%` }}
                        />
                    </div>
                        <p className="text-[10px] font-medium text-gray-500">{stockSnapshot.label}</p>
                    </div>
                ) : null}
                {soldCount > 0 ? (
                    <p className="text-[10px] font-medium text-gray-500">{soldCount} sold</p>
                ) : null}
            </div>

            <div className="mt-auto pt-1.5">
                <p className="text-[15px] font-black leading-tight text-gray-950">{formatCurrency(product.offerPrice || product.price)}</p>
                {product.price > product.offerPrice && (
                    <p className="text-[11px] font-medium text-gray-400 line-through">{formatCurrency(product.price)}</p>
                )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
              className={`mt-2 w-full rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                  : isAdding
                  ? 'cursor-wait bg-orange-500 text-white opacity-75'
                  : addedFeedback
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
                {isOutOfStock ? 'Sold out' : isAdding ? 'Adding...' : addedFeedback ? 'Added' : 'Add to cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isAdding || isOutOfStock}
              className="mt-1 w-full rounded-md border border-orange-600 px-3 py-1 text-[10px] font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500"
            >
                Buy now
            </button>
        </article>
    )
}

export default React.memo(ProductCard)
