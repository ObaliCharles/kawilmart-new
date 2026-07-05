'use client'

import React from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { getProductRatingSnapshot } from "@/lib/productRating";

const ProductRating = ({ product, size = "sm", showMeta = true }) => {
    const { rating, hasRating, likesCount, reviewCount, filledStars } = getProductRatingSnapshot(product);
    const starSize = size === "lg" ? "h-4 w-4" : "h-3 w-3";
    const valueClassName = size === "lg" ? "text-sm" : "text-xs";

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <p className={`${valueClassName} font-medium text-gray-700 min-w-10`}>
                    {hasRating ? rating.toFixed(1) : "New"}
                </p>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Image
                            key={index}
                            className={starSize}
                            src={index < filledStars ? assets.star_icon : assets.star_dull_icon}
                            alt={index < filledStars ? "filled star" : "empty star"}
                        />
                    ))}
                </div>
            </div>

            {showMeta && (
                <p className="text-xs text-gray-400">
                    {likesCount} like{likesCount === 1 ? "" : "s"}
                    {reviewCount > 0 ? ` · ${reviewCount} review${reviewCount === 1 ? "" : "s"}` : ""}
                    {!hasRating ? " · no ratings yet" : ""}
                </p>
            )}
        </div>
    );
};

export default ProductRating;
