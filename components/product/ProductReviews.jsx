'use client'

import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";

const Star = ({ filled, className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
    <path
      d="M12 3.6 14.7 9l6 .9-4.35 4.2 1.03 5.9L12 17.2 6.62 20l1.03-5.9L3.3 9.9l6-.9L12 3.6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const StarRow = ({ value = 0, className = "h-4 w-4", gap = "gap-0.5" }) => (
  <span className={`flex items-center ${gap} text-amber-400`} aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} filled={index < Math.round(value)} className={className} />
    ))}
  </span>
);

const relativeTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const units = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [size, name] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      return `${count} ${name}${count === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
};

const initialsFor = (name = "") => (
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?"
);

const AVATAR_TONES = [
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

const toneFor = (seed = "") => {
  let hash = 0;
  for (const char of String(seed)) hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash];
};

const ReviewCard = ({ review }) => (
  <article className="min-w-0 rounded-xl bg-gray-50/70 p-3.5 ring-1 ring-gray-100">
    <div className="flex min-w-0 items-start gap-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${toneFor(review.userId || review.userName)}`}>
        {initialsFor(review.userName)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-[12.5px] font-bold text-gray-950">{review.userName}</span>
          {review.verifiedPurchase ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified Purchase
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <StarRow value={review.rating} className="h-3.5 w-3.5" />
          <span className="text-[11px] text-gray-400">{relativeTime(review.date)}</span>
        </div>
      </div>
    </div>

    {review.title ? (
      <h4 className="mt-2.5 break-words text-[13px] font-bold text-gray-950">{review.title}</h4>
    ) : null}
    {review.comment ? (
      <p className="mt-1 break-words text-[12.5px] leading-[19px] text-gray-600">{review.comment}</p>
    ) : null}
  </article>
);

const ReviewForm = ({ productId, existing, onDone, onCancel }) => {
  const { getToken } = useAppContext();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(existing?.title || "");
  const [comment, setComment] = useState(existing?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!rating) {
      toast.error("Please choose a star rating");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const { data } = await axios.post(
        "/api/product/review",
        { productId, rating, title, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message || "Thanks for your review");
        onDone?.();
      } else {
        toast.error(data.message || "Could not save your review");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save your review");
    } finally {
      setSubmitting(false);
    }
  };

  const shown = hovered || rating;

  return (
    <form onSubmit={submit} className="rounded-xl bg-white p-3.5 ring-1 ring-gray-200">
      <p className="text-[12.5px] font-bold text-gray-950">
        {existing ? "Update your review" : "Write a review"}
      </p>

      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onMouseEnter={() => setHovered(index + 1)}
            onClick={() => setRating(index + 1)}
            aria-label={`Rate ${index + 1} star${index === 0 ? "" : "s"}`}
            className={`transition ${index < shown ? "text-amber-400" : "text-gray-300"} hover:scale-110`}
          >
            <Star filled={index < shown} className="h-7 w-7" />
          </button>
        ))}
        <span className="ml-1.5 text-[11.5px] font-semibold text-gray-500">
          {shown ? `${shown} of 5` : "Tap a star"}
        </span>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={90}
        placeholder="Sum it up in a few words (optional)"
        className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-[12.5px] outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
      <textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        placeholder="What did you like or dislike? How was the quality and delivery?"
        className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[12.5px] outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

      <div className="mt-2.5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-gray-100 px-4 py-2 text-[12px] font-semibold text-gray-600 transition hover:bg-gray-200"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-orange-600 px-5 py-2 text-[12px] font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : existing ? "Update review" : "Submit review"}
        </button>
      </div>
    </form>
  );
};

const ProductReviews = ({ product, onReviewsChanged }) => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [starFilter, setStarFilter] = useState(0);
  const [sortBy, setSortBy] = useState("recent");
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const reviews = useMemo(() => (Array.isArray(product?.reviews) ? product.reviews : []), [product]);
  const total = reviews.length;

  const summary = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    let sum = 0;

    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)));
      buckets[rating - 1] += 1;
      sum += rating;
    }

    const average = total ? sum / total : 0;
    // "Recommend" mirrors how shops report it: 4 stars and above.
    const recommend = total ? Math.round(((buckets[3] + buckets[4]) / total) * 100) : 0;

    return { buckets, average, recommend };
  }, [reviews, total]);

  const ownReview = user ? reviews.find((review) => String(review.userId) === String(user.id)) : null;

  const visibleReviews = useMemo(() => {
    let list = starFilter ? reviews.filter((review) => Math.round(review.rating) === starFilter) : [...reviews];

    list.sort((a, b) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return list;
  }, [reviews, starFilter, sortBy]);

  const startReview = () => {
    if (!user) {
      openSignIn?.();
      return;
    }
    setShowForm(true);
  };

  return (
    <section id="reviews" className="mt-6 scroll-mt-24">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-4">
        {/* Summary ----------------------------------------------------- */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-[15px] font-bold text-gray-950">Customer Reviews</h2>

          {total === 0 ? (
            <div className="mt-3">
              <p className="text-[12.5px] leading-[18px] text-gray-500">
                No reviews yet. If you have bought this, you can be the first to review it.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-[38px] font-black leading-none text-gray-950">{summary.average.toFixed(1)}</p>
                <div className="min-w-0 pb-1">
                  <StarRow value={summary.average} />
                  <p className="mt-1 text-[11.5px] text-gray-500">
                    Based on {total} review{total === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {/* Breakdown bars, tappable as filters. */}
              <div className="mt-3.5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.buckets[star - 1];
                  const percent = total ? Math.round((count / total) * 100) : 0;
                  const active = starFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarFilter(active ? 0 : star)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 rounded-lg px-1 py-0.5 transition ${active ? "bg-orange-50" : "hover:bg-gray-50"}`}
                    >
                      <span className="flex w-6 shrink-0 items-center gap-0.5 text-[11px] font-semibold text-gray-600">
                        {star}
                        <Star filled className="h-3 w-3 text-amber-400" />
                      </span>
                      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span
                          className="block h-full rounded-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-gray-500">{percent}%</span>
                    </button>
                  );
                })}
              </div>

              {summary.recommend > 0 ? (
                <p className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-[11.5px] text-gray-600">
                  <span className="text-emerald-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span><strong className="font-bold text-gray-900">{summary.recommend}%</strong> of customers recommend this product</span>
                </p>
              ) : null}
            </>
          )}

          {!showForm ? (
            <button
              type="button"
              onClick={startReview}
              className="mt-3.5 w-full rounded-full bg-orange-600 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700"
            >
              {ownReview ? "Edit your review" : "Write a review"}
            </button>
          ) : null}
        </div>

        {/* Review list -------------------------------------------------- */}
        <div className="min-w-0">
          {showForm ? (
            <div className="mb-3">
              <ReviewForm
                productId={product._id}
                existing={ownReview}
                onCancel={() => setShowForm(false)}
                onDone={() => {
                  setShowForm(false);
                  onReviewsChanged?.();
                }}
              />
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-gray-950">
                What Customers Are Saying
              </h2>

              {total > 1 ? (
                <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-gray-500">
                  <span className="sr-only">Sort reviews</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-lg bg-gray-50 px-2 py-1.5 text-[11.5px] font-semibold text-gray-700 outline-none"
                  >
                    <option value="recent">Most recent</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </label>
              ) : null}
            </div>

            {starFilter ? (
              <button
                type="button"
                onClick={() => setStarFilter(0)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700"
              >
                {starFilter}-star only
                <span aria-hidden="true">&times;</span>
              </button>
            ) : null}

            {visibleReviews.length === 0 ? (
              <p className="mt-3 rounded-xl bg-gray-50 px-3 py-6 text-center text-[12.5px] text-gray-500">
                {total === 0
                  ? "Be the first to review this product."
                  : `No ${starFilter}-star reviews yet.`}
              </p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {visibleReviews.slice(0, visibleCount).map((review, index) => (
                    <ReviewCard key={review._id || `${review.userId}-${index}`} review={review} />
                  ))}
                </div>

                {visibleReviews.length > visibleCount ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((current) => current + 6)}
                    className="mt-3 w-full rounded-full bg-gray-100 py-2.5 text-[12px] font-bold text-gray-700 transition hover:bg-gray-200"
                  >
                    Show more reviews ({visibleReviews.length - visibleCount} left)
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
