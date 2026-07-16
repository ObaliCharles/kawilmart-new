'use client'

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import CategoryLineIcon from "@/components/CategoryLineIcon";
import Skeleton from "@/components/Skeleton";
import { resolveSiteContent } from "@/lib/defaultSiteContent";
import { categoryMatchesSelection, homeCategoryValues, getCategoryMeta, homeTopRailDefaults, TOP_RAIL_PARENT } from "@/lib/marketplaceCategories";
import { getProductActivitySnapshot, sortProductsForLiveShowcase } from "@/lib/liveCommerce";
import { getProductStockSnapshot } from "@/lib/productStock";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";

const takeProducts = (products, count) => products.slice(0, count);

// Compact horizontal product strip — used for "Recently viewed" and other
// lightweight rails. Scrolls sideways; each tile links to the product.
const ProductStripRail = ({ title, products, navigate, prefetchRoute, formatCurrency, className = "" }) => {
  if (!products.length) return null;
  return (
    <section className={className}>
      <h2 className="mb-3 text-base font-bold text-gray-950 md:text-lg">{title}</h2>
      <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1">
        {products.map((product) => (
          <button
            key={`strip-${product._id}`}
            type="button"
            onClick={() => navigate(`/product/${product._id}`)}
            onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
            onFocus={() => prefetchRoute(`/product/${product._id}`)}
            className="w-[7.2rem] shrink-0 rounded-xl bg-white p-2 text-left shadow-sm ring-1 ring-gray-100 transition hover:shadow-md md:w-[8.5rem]"
          >
            <span className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              <ProductImage product={product} alt={product.name} width={130} height={130} className="h-full w-full object-contain p-1" />
            </span>
            <span className="mt-1.5 line-clamp-2 min-h-[1.9rem] text-[11px] font-semibold leading-[0.95rem] text-gray-900">{product.name}</span>
            <span className="block text-[11.5px] font-bold text-gray-950">{formatCurrency(getPriceValue(product.offerPrice || product.price))}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

const uniqueById = (products) => {
  const seen = new Set();

  return products.filter((product) => {
    const id = String(product?._id || "");
    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

const productsInCategories = (products, categories, count) =>
  takeProducts(
    products.filter((product) =>
      categories.some((category) => categoryMatchesSelection(product.category, category))
    ),
    count
  );

const getImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  if (typeof image === "string" && image.trim()) {
    return image.trim();
  }

  if (image && typeof image === "object" && typeof image.src === "string") {
    return image.src;
  }

  return assets.upload_area;
};

const getPriceValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const useImageLoadState = (src) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);

    const revealTimer = window.setTimeout(() => {
      setLoaded(true);
    }, 250);

    return () => window.clearTimeout(revealTimer);
  }, [src]);

  return [loaded, setLoaded];
};

const ProductImage = ({ product, alt, className, width, height, priority = false }) => {
  const fallbackImage = assets.upload_area;
  const [src, setSrc] = useState(() => getImage(product));
  const [loaded, setLoaded] = useImageLoadState(src);

  useEffect(() => {
    setSrc(getImage(product));
  }, [product]);

  return (
    <span className={`relative z-0 block overflow-hidden ${className || ""}`}>
      {!loaded ? <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-[inherit]" /> : null}
      <Image
        src={src || fallbackImage}
        alt={alt || product?.name || "Product image"}
        width={width}
        height={height}
        className="relative z-0 h-full w-full object-contain"
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setSrc(fallbackImage);
        }}
      />
    </span>
  );
};

const ContentImage = ({ src, alt, className, width, height, priority = false }) => {
  const fallbackImage = assets.upload_area;
  const [imageSrc, setImageSrc] = useState(src || fallbackImage);
  const [loaded, setLoaded] = useImageLoadState(imageSrc);

  useEffect(() => {
    setImageSrc(src || fallbackImage);
  }, [src]);

  return (
    <span className={`relative z-0 block overflow-hidden ${className || ""}`}>
      {!loaded ? <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-[inherit]" /> : null}
      <Image
        src={imageSrc || fallbackImage}
        alt={alt || "KawilMart offer"}
        width={width}
        height={height}
        className="relative z-0 h-full w-full object-cover"
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setImageSrc(fallbackImage);
        }}
      />
    </span>
  );
};

const HeartGlyph = ({ filled = false, className = "h-4 w-4" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
    <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

const UtilityIcon = ({ type }) => {
  const paths = {
    delivery: "M4 7h10v9H4V7Zm10 3h3l3 3v3h-6v-6ZM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    returns: "M4 7v5h5M20 17v-5h-5M6.4 9A7 7 0 0 1 18 7.8M17.6 15A7 7 0 0 1 6 16.2",
    shield: "M12 3 19 6v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Zm-3 9 2 2 4-4",
    support: "M5 13v-1a7 7 0 0 1 14 0v1M5 13h3v5H5v-5Zm11 0h3v5h-3v-5Zm0 5c0 1.7-1.3 3-3 3h-1",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    mail: "M4 6h16v12H4V6Zm0 1 8 6 8-6",
    bolt: "m13 2-8 12h6l-1 8 8-12h-6l1-8Z",
    gift: "M20 10v10H4V10m16 0H4m8 0v10M7.5 6.5A2.5 2.5 0 0 0 12 8a2.5 2.5 0 1 0-4.5-1.5Zm9 0A2.5 2.5 0 0 1 12 8a2.5 2.5 0 1 1 4.5-1.5Z",
  };

  return (
    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[type] || paths.grid} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ChevronRight = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Price = ({ product, className = "" }) => {
  const { formatCurrency } = useAppContext();
  const price = getPriceValue(product.offerPrice || product.price);
  return <span className={`font-bold text-orange-600 ${className}`}>{formatCurrency(price)}</span>;
};

const SectionHeader = ({ title, onViewAll }) => (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-xl font-extrabold text-gray-950">{title}</h2>
    <button type="button" onClick={onViewAll} className="text-sm font-bold text-orange-600">
      View all -&gt;
    </button>
  </div>
);

function getContentHref(item, fallback = "/all-products") {
  if (item?.linkType === "category" && item.category) {
    return `/all-products?category=${encodeURIComponent(item.category)}`;
  }

  if (item?.linkType === "store" && item.storeId) {
    return `/store/${encodeURIComponent(item.storeId)}`;
  }

  if (item?.productId) {
    return `/product/${item.productId}`;
  }

  return item?.primaryHref || item?.href || fallback;
}

const HeroImageSlider = ({ slides, currentIndex, onSelect, navigate, className = "", priority = false }) => {
  const safeSlides = slides.filter((slide) => slide?.imageUrl);
  const fallbackHrefs = [
    "/all-products?category=Computers%20%26%20Electronics",
    "/all-products?category=Fashion",
    "/all-products?category=Audio",
  ];
  const pointerStateRef = useRef({ active: false, startX: 0, deltaX: 0 });

  if (!safeSlides.length) {
    return null;
  }

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStateRef.current = {
      active: true,
      startX: event.clientX,
      deltaX: 0,
    };
  };

  const handlePointerMove = (event) => {
    if (!pointerStateRef.current.active) {
      return;
    }

    pointerStateRef.current.deltaX = event.clientX - pointerStateRef.current.startX;
  };

  const handlePointerUp = () => {
    const { active, deltaX } = pointerStateRef.current;
    pointerStateRef.current = { active: false, startX: 0, deltaX: 0 };

    if (!active || safeSlides.length < 2 || Math.abs(deltaX) < 48) {
      return;
    }

    const nextIndex = deltaX < 0
      ? (currentIndex + 1) % safeSlides.length
      : (currentIndex - 1 + safeSlides.length) % safeSlides.length;

    onSelect(nextIndex);
  };

  return (
    <section
      className={`relative overflow-hidden touch-pan-y select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {safeSlides.map((slide, index) => {
          const href = getContentHref(slide, fallbackHrefs[index % fallbackHrefs.length]);

          return (
            <button
              key={slide._id || index}
              type="button"
              onClick={() => navigate(href)}
              className="relative min-w-full overflow-hidden bg-gray-100 text-left"
            >
              <ContentImage
                src={slide.imageUrl}
                alt={slide.title || `KawilMart offer ${index + 1}`}
                width={1200}
                height={520}
                priority={priority && index === 0}
                className="absolute inset-0 h-full w-full"
              />
              {slide.showOverlay && (slide.title || slide.primaryButtonText) ? (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 text-white sm:p-6">
                  {slide.offer ? <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">{slide.offer}</p> : null}
                  {slide.title ? <p className="mt-1 max-w-md text-lg font-bold leading-snug sm:text-2xl">{slide.title}</p> : null}
                  {slide.primaryButtonText ? (
                    <span className="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-950">
                      {slide.primaryButtonText}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {safeSlides.length > 1 ? (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/25 px-1.5 py-1 backdrop-blur-sm sm:gap-1.5 sm:px-2 sm:py-1.5">
          {safeSlides.map((slide, index) => (
            <button
              key={slide._id || index}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(index);
              }}
              className={`h-1.5 rounded-full transition-all sm:h-2 ${currentIndex === index ? "w-4 bg-white sm:w-5" : "w-1.5 bg-white/55 sm:w-2"}`}
              aria-label={`Show offer ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

// A neutral, branded empty-state for banner slots that have no admin-uploaded
// banner yet. This deliberately does NOT fall back to a product photo — that
// was the cause of the "same picture in every container" bug, since every
// empty slot reused the first product image. Renders the same regardless of
// catalog, keeps the layout intact, and stays clickable.
const PromoPlaceholder = ({ navigate, href = "/all-products", className = "", label = "Explore the marketplace" }) => (
  <button
    type="button"
    onClick={() => navigate(href)}
    className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 text-left ${className}`}
  >
    <span className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
    <span className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />
    <span className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
      <Image src={assets.logo} alt="KawilMart" width={40} height={40} className="h-8 w-auto brightness-0 invert" />
      <span className="text-xs font-bold text-white sm:text-sm">{label}</span>
    </span>
  </button>
);

// No products[0] fallback — an unmatched category returns null so its tile
// shows an icon instead of an unrelated product's photo.
const productForCategory = (products, category) => (
  products.find((product) => categoryMatchesSelection(product.category, category)) || null
);

const MobileRoundCategory = ({ label, category, icon, imageUrl, navigate }) => {
  // Prefer the admin-uploaded category PNG, then the emoji, then a line icon.
  // Never falls back to a product photo, which is why category tiles no longer
  // all show the same first-product image.
  return (
    <button
      type="button"
      onClick={() => navigate(`/all-products?category=${encodeURIComponent(category)}`)}
      className="flex min-w-0 flex-col items-center gap-1.5 text-center"
    >
      <span className="flex h-[3.35rem] w-[3.35rem] items-center justify-center overflow-hidden rounded-full bg-white text-2xl shadow-sm ring-1 ring-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={label} className="h-full w-full object-contain p-1.5" />
        ) : icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : (
          <CategoryLineIcon category={category} className="h-5 w-5 text-gray-700" />
        )}
      </span>
      <span className="line-clamp-2 min-h-7 text-[10px] font-bold leading-[14px] text-gray-950">{label}</span>
    </button>
  );
};

const MobileTopCategory = ({ label, category, imageUrl, icon, products, navigate }) => {
  const product = imageUrl ? null : productForCategory(products, category);
  const brandLogo = product?.sellerProfile?.avatarUrl;

  return (
    <button
      type="button"
      onClick={() => navigate(`/all-products?category=${encodeURIComponent(category)}`)}
      className="flex h-[6.7rem] min-w-0 flex-col items-center justify-center rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-gray-100"
    >
      <span className="relative flex h-12 w-full items-center justify-center">
        {imageUrl ? (
          // Admin-uploaded PNG icon (set from Admin -> Categories -> Top Categories)
          <img src={imageUrl} alt={label} className="h-full w-full object-contain" />
        ) : product ? (
          <ProductImage product={product} alt={label} width={86} height={62} className="h-full w-full object-contain" />
        ) : icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <CategoryLineIcon category={category} className="h-5 w-5 text-gray-700" />
        )}
        {brandLogo ? (
          <span className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
            <Image src={brandLogo} alt={`${label} brand`} width={24} height={24} className="h-full w-full object-cover" />
          </span>
        ) : null}
      </span>
      <span className="mt-2 line-clamp-1 text-[12px] font-bold text-gray-950">{label}</span>
    </button>
  );
};

const MobileServiceCard = ({ title, text, icon }) => (
  <div className="flex items-center gap-2 px-2.5 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-orange-600">{icon}</div>
    <div className="min-w-0 text-left">
      <p className="text-[11px] font-extrabold leading-4 text-gray-950">{title}</p>
      <p className="mt-0.5 truncate text-[10px] leading-4 text-gray-500">{text}</p>
    </div>
  </div>
);

const FLASH_CARD_BACKGROUNDS = [
  "bg-gradient-to-br from-orange-300/90 via-amber-200 to-orange-100",
  "bg-gradient-to-br from-rose-300/90 via-pink-200 to-rose-100",
  "bg-gradient-to-br from-violet-300/85 via-purple-200 to-violet-100",
  "bg-gradient-to-br from-sky-300/85 via-cyan-200 to-sky-100",
  "bg-gradient-to-br from-amber-300/90 via-yellow-200 to-amber-100",
  "bg-gradient-to-br from-fuchsia-300/85 via-pink-200 to-fuchsia-100",
];

const getFlashCardBackground = (index = 0) => FLASH_CARD_BACKGROUNDS[index % FLASH_CARD_BACKGROUNDS.length];

const MobileFlashCard = ({ product, navigate, prefetchRoute, formatCurrency, toggleProductLike, cardIndex = 0 }) => {
  const activity = getProductActivitySnapshot(product);
  const originalPrice = getPriceValue(product.price);
  const offerPrice = getPriceValue(product.offerPrice || product.price);
  const stockSnapshot = getProductStockSnapshot(product);
  const [liked, setLiked] = useState(Boolean(product.likedByCurrentUser));

  useEffect(() => {
    setLiked(Boolean(product.likedByCurrentUser));
  }, [product.likedByCurrentUser]);

  const likeProduct = async (event) => {
    event.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    const result = await toggleProductLike(product._id);
    if (!result?.success) setLiked(!nextLiked);
    else if (typeof result.product?.likedByCurrentUser === "boolean") setLiked(result.product.likedByCurrentUser);
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className={`relative isolate w-[8.5rem] shrink-0 rounded-xl p-2 text-left shadow-md interactive-lift ${getFlashCardBackground(cardIndex)}`}
    >
      <span className="absolute left-2 top-2 z-20 rounded-md bg-gray-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
        -{Math.max(activity.priceDropPercent, 15)}%
      </span>
      <span onClick={likeProduct} className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm ${liked ? "text-red-600" : "text-gray-500"}`}>
        <HeartGlyph filled={liked} />
      </span>
      <span className="relative z-0 flex aspect-square items-center justify-center rounded-lg bg-white/75 p-1 shadow-inner backdrop-blur-sm">
        <ProductImage product={product} alt={product.name} width={150} height={150} className="h-full w-full object-contain" />
      </span>
      <span className="mt-2 line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-4 text-gray-950">{product.name}</span>
      <span className="mt-1 block text-[11px] font-medium text-gray-700/80">{activity.localTrend}</span>
      <span className="mt-1 block text-sm font-extrabold text-gray-950">{formatCurrency(offerPrice)}</span>
      {originalPrice > offerPrice ? <span className="text-[11px] text-gray-700/60 line-through">{formatCurrency(originalPrice)}</span> : null}
      {stockSnapshot.hasTrackedStock ? (
        <div className="mt-2 space-y-1">
          <span className="block h-1.5 overflow-hidden rounded-full bg-black/10">
            <span
              className={`block h-full rounded-full ${stockSnapshot.status === "low" ? "bg-rose-600" : "bg-gray-900/70"}`}
              style={{ width: `${stockSnapshot.status === "out" ? 0 : stockSnapshot.status === "low" ? 28 : 62}%` }}
            />
          </span>
          <span className="block text-[10px] font-medium text-gray-800/70">{stockSnapshot.label}</span>
        </div>
      ) : null}
    </button>
  );
};

const MobileProductCard = ({ product, navigate, prefetchRoute, formatCurrency, toggleProductLike }) => {
  const activity = getProductActivitySnapshot(product);
  const originalPrice = getPriceValue(product.price);
  const offerPrice = getPriceValue(product.offerPrice || product.price);
  const stockSnapshot = getProductStockSnapshot(product);
  const soldCount = Math.max(0, Number(product.soldCount) || 0);
  const [liked, setLiked] = useState(Boolean(product.likedByCurrentUser));

  useEffect(() => {
    setLiked(Boolean(product.likedByCurrentUser));
  }, [product.likedByCurrentUser]);

  const likeProduct = async (event) => {
    event.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    const result = await toggleProductLike(product._id);
    if (!result?.success) setLiked(!nextLiked);
    else if (typeof result.product?.likedByCurrentUser === "boolean") setLiked(result.product.likedByCurrentUser);
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className="relative isolate rounded-lg border border-gray-200 bg-white p-2 text-left shadow-sm"
    >
      <span className={`absolute left-2 top-2 z-20 rounded px-2 py-1 text-[10px] font-bold text-white ${activity.hasDiscount ? "bg-rose-500" : "bg-green-500"}`}>
        {activity.hasDiscount ? `-${activity.priceDropPercent}%` : "NEW"}
      </span>
      <span onClick={likeProduct} className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ${liked ? "text-red-600" : "text-gray-400"}`}>
        <HeartGlyph filled={liked} />
      </span>
      <span className="relative z-0 flex aspect-[1.12/1] items-center justify-center rounded-md bg-gray-50">
        <ProductImage product={product} alt={product.name} width={190} height={170} className="h-full w-full object-contain p-2" />
      </span>
      <span className="mt-2 line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-4 text-gray-950">{product.name}</span>
      <span className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
        <span className="text-orange-500">★</span>
        {activity.hasRating ? activity.displayRating.toFixed(1) : "New"} · {soldCount > 0 ? `${soldCount} sold` : "Fresh"}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold text-gray-950">{formatCurrency(offerPrice)}</span>
        {originalPrice > offerPrice ? <span className="text-[10px] text-rose-300 line-through">{formatCurrency(originalPrice)}</span> : null}
      </span>
      {stockSnapshot.hasTrackedStock ? (
        <div className="mt-2 space-y-1">
          <span className="block h-1.5 overflow-hidden rounded-full bg-gray-100">
            <span
              className={`block h-full rounded-full ${stockSnapshot.status === "low" ? "bg-rose-500" : "bg-orange-600"}`}
              style={{ width: `${stockSnapshot.status === "out" ? 0 : stockSnapshot.status === "low" ? 28 : 62}%` }}
            />
          </span>
          <span className="block text-[10px] font-medium text-gray-500">{stockSnapshot.label}</span>
        </div>
      ) : null}
    </button>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !email.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/newsletter", { email: email.trim() });
      if (data.success) {
        toast.success(data.message || "Subscribed successfully");
        setEmail("");
      } else {
        toast.error(data.message || "Could not subscribe right now");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not subscribe right now");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-white p-5 shadow-sm ring-1 ring-orange-100">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16v12H4V6Zm0 0 8 7 8-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h2 className="text-sm font-extrabold text-gray-950">Subscribe to our newsletter</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-gray-600">Get updates on new arrivals and exclusive offers.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-orange-100">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 px-4 py-3 text-[12px] outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-5 text-[12px] font-bold text-white transition disabled:opacity-70"
        >
          {submitting ? "..." : "Subscribe"}
        </button>
      </form>
    </section>
  );
};

const MobileHome = ({
  heroSlides,
  activeHeroIndex,
  setActiveHeroIndex,
  activePromo,
  marketingBanners,
  sidebarBanners = [],
  dealOfDayBanners = [],
  dealProducts,
  recommendedProducts,
  sortedProducts,
  storeCards,
  storeLoadMoreRef,
  timeLeft,
  hasCountdown,
  homeCategoryRail = [],
  topRailTiles = [],
  recentlyViewedProducts = [],
  navigate,
  prefetchRoute,
  formatCurrency,
  toggleProductLike,
}) => {
  const heroFallback = sortedProducts[0];
  const activeDealIndex = activePromo?._activeDealIndex || 0;
  // No fallback to an arbitrary product — Deal of the Day only shows when a
  // real active flash deal exists, otherwise the section is hidden.
  const activeDealOfDayBanner = dealOfDayBanners.length
    ? dealOfDayBanners[activeDealIndex % dealOfDayBanners.length]
    : null;
  const dealOfDay = activeDealOfDayBanner
    ? sortedProducts.find((product) => product._id === activeDealOfDayBanner.productId) || null
    : (dealProducts[activeDealIndex % Math.max(dealProducts.length, 1)] || null);
  const dealOfDayActivity = dealOfDay ? getProductActivitySnapshot(dealOfDay) : null;
  const topStoreCards = storeCards;
  const promoHref = getContentHref(activePromo, "/all-products?sort=newest");
  const hasRealPromo = Boolean(activePromo?.imageUrl);
  const mobileMarketingBanners = (Array.isArray(marketingBanners) ? marketingBanners : [])
    .filter((item) => item?.imageUrl)
    .slice(0, 3);

  return (
    <main className="bg-[#fbfbfb] px-3 pb-8 pt-3 md:hidden">
      {heroSlides.length ? (
        <HeroImageSlider
          slides={heroSlides}
          currentIndex={activeHeroIndex % Math.max(heroSlides.length, 1)}
          onSelect={setActiveHeroIndex}
          navigate={navigate}
          priority
          className="aspect-[2.08/1] rounded-xl bg-gray-100 shadow-sm"
        />
      ) : (
        <PromoPlaceholder navigate={navigate} className="aspect-[2.08/1] w-full rounded-xl shadow-sm" />
      )}

      <section className="mt-4 grid grid-cols-5 gap-x-2 gap-y-3">
        {homeCategoryRail.slice(0, 9).map((category) => (
          <MobileRoundCategory key={category.value} label={category.label} category={category.value} icon={category.icon} imageUrl={category.imageUrl} navigate={navigate} />
        ))}
        <button type="button" onClick={() => navigate("/categories")} className="flex min-w-0 flex-col items-center gap-2 text-center">
          <span className="flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm"><UtilityIcon type="grid" /></span>
          <span className="line-clamp-2 min-h-7 text-[10px] font-bold leading-[14px] text-gray-950">More</span>
        </button>
      </section>

      <section className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <MobileServiceCard title="100% Original" text="Genuine products" icon={<UtilityIcon type="shield" />} />
        <MobileServiceCard title="Fast Delivery" text="Get it in 24 - 48hrs" icon={<UtilityIcon type="delivery" />} />
        <MobileServiceCard title="Easy Returns" text="7-day return policy" icon={<UtilityIcon type="returns" />} />
        <MobileServiceCard title="Secure Payment" text="Pay safely" icon={<UtilityIcon type="grid" />} />
      </section>

      <section className="-mx-3 mt-6 rounded-xl bg-gradient-to-br from-orange-100/90 via-rose-100/75 to-amber-50 px-3 py-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-gray-950">Flash Sale</h2>
            <p className="mt-0.5 text-[10px] text-gray-500">Limited-time deals</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {hasCountdown ? <FlashCountdown timeLeft={timeLeft} size="sm" /> : null}
            <button type="button" onClick={() => navigate("/all-products?filter=flash")} className="text-[11px] font-bold text-orange-600">
              View all -&gt;
            </button>
          </div>
        </div>
        <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1">
          {(dealProducts.length ? dealProducts : sortedProducts).slice(0, 6).map((product, index) => (
            <MobileFlashCard key={`mobile-flash-${index}-${product._id || product.name}`} product={product} cardIndex={index} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} toggleProductLike={toggleProductLike} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Today's For You!" onViewAll={() => navigate("/all-products")} />
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[
            ["Best Seller", "/all-products?sort=popular"],
            ["New Arrivals", "/all-products?sort=newest"],
            ["Top Rated", "/all-products?sort=rating"],
            ["Special Discount", "/all-products?filter=flash"],
          ].map(([item, href], index) => (
            <button key={item} type="button" onClick={() => navigate(href)} className={`shrink-0 rounded-md border px-4 py-2 text-[12px] font-bold ${index === 0 ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-950"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recommendedProducts.slice(0, 6).map((product, index) => (
            <MobileProductCard key={`mobile-reco-${index}-${product._id || product.name}`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} toggleProductLike={toggleProductLike} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Top Categories" onViewAll={() => navigate("/all-products")} />
        <div className="grid grid-cols-4 gap-3">
          {topRailTiles.map((tile) => (
            <MobileTopCategory key={tile.label} label={tile.label} category={tile.category} imageUrl={tile.imageUrl} icon={tile.icon} products={sortedProducts} navigate={navigate} />
          ))}
          <button type="button" onClick={() => navigate("/categories")} className="flex h-[6.7rem] flex-col items-center justify-center rounded-xl bg-white text-center shadow-sm ring-1 ring-gray-100">
            <span className="text-gray-400"><UtilityIcon type="grid" /></span>
            <span className="mt-2 text-[12px] font-bold text-gray-950">All Categories</span>
          </button>
        </div>
      </section>

      <ProductStripRail
        title="Recently viewed"
        products={recentlyViewedProducts}
        navigate={navigate}
        prefetchRoute={prefetchRoute}
        formatCurrency={formatCurrency}
        className="mt-8"
      />

      {hasRealPromo ? (
        <button
          type="button"
          onClick={() => navigate(promoHref)}
          className="relative mt-6 block aspect-[2.08/1] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm"
        >
          <ContentImage src={activePromo.imageUrl} alt={activePromo.title || "Promotion"} width={720} height={346} className="h-full w-full transition-opacity duration-500" />
        </button>
      ) : null}

      {sidebarBanners.length ? (
        <section className="mt-5 grid grid-cols-2 gap-3">
          {sidebarBanners.slice(0, 2).map((banner, index) => (
            <MarketingBannerTile
              key={banner._id || `sidebar-banner-${index}`}
              item={banner}
              navigate={navigate}
              prefetchRoute={prefetchRoute}
              className="aspect-square rounded-lg"
            />
          ))}
        </section>
      ) : null}

      {mobileMarketingBanners.length ? (
        <section className="mt-6 grid gap-2">
          {mobileMarketingBanners.map((item, index) => (
            <MarketingBannerTile
              key={getMarketingBannerKey(item, index)}
              item={item}
              navigate={navigate}
              prefetchRoute={prefetchRoute}
              className="aspect-[2.35/1]"
            />
          ))}
        </section>
      ) : null}

      {dealOfDay && dealOfDayActivity?.flashDealActive ? (
        <section
          onClick={() => navigate(`/product/${dealOfDay._id}`)}
          className="relative mt-6 h-44 cursor-pointer overflow-hidden rounded-lg bg-[#101923] text-white shadow-sm"
        >
          {/* Keyed by product so each rotation crossfades in at the exact
              same card size — no jumping between deals. */}
          <div key={dealOfDay._id} className="animate-deal-swap flex h-full w-full items-stretch">
            {activeDealOfDayBanner ? (
              <>
                <ContentImage
                  src={activeDealOfDayBanner.imageUrl}
                  alt={dealOfDay.name}
                  width={720}
                  height={360}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {dealOfDayActivity.flashDealCountdownLabel ? (
                  <div className="relative z-10 flex items-end p-6">
                    <FlashCountdown timeLeft={getTimeParts(dealOfDayActivity.flashDealEndsInMs)} size="sm" />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <span className="flex w-2/5 shrink-0 items-center justify-center bg-white p-3">
                  <ProductImage product={dealOfDay} alt={dealOfDay.name} width={230} height={230} className="h-full w-full object-contain" />
                </span>
                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center px-5 py-4">
                  {dealOfDayActivity.flashDealCountdownLabel ? (
                    <FlashCountdown timeLeft={getTimeParts(dealOfDayActivity.flashDealEndsInMs)} size="sm" />
                  ) : null}
                  <p className="mt-2.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5">{dealOfDay.name}</p>
                  <p className="mt-1 truncate text-lg font-extrabold">{formatCurrency(getPriceValue(dealOfDay.offerPrice || dealOfDay.price))}</p>
                  <p className="mt-0.5 min-h-[1.25rem] text-sm font-extrabold text-orange-400">
                    {dealOfDayActivity.hasDiscount ? `${dealOfDayActivity.priceDropPercent}% OFF` : ""}
                  </p>
                  <span className="block truncate text-[11px] text-white/75">{getProductStockSnapshot(dealOfDay).label}</span>
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader title="Best Selling Stores" onViewAll={() => navigate("/all-products?sort=popular")} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-3">
          {topStoreCards.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => navigate(store.href)}
              className="flex min-h-[4.25rem] min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md lg:w-[13rem] lg:flex-none"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {store.avatarUrl ? (
                  <img src={store.avatarUrl} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-gray-700">{store.name.slice(0, 1)}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-extrabold text-gray-950 lg:text-[12px]">{store.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-gray-500 lg:text-[11px]">{store.location}</span>
                <span className="mt-0.5 block text-[10px] font-semibold text-orange-600 lg:text-[11px]">{store.productCount} products</span>
              </span>
            </button>
          ))}
        </div>
        <div ref={storeLoadMoreRef} className="h-1 w-full" aria-hidden="true" />
      </section>

      <NewsletterSection />

      <section className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <MobileServiceCard title="Free Delivery" text="On orders over UGX 100,000" icon={<UtilityIcon type="delivery" />} />
        <MobileServiceCard title="Easy Returns" text="14 days return policy" icon={<UtilityIcon type="returns" />} />
        <MobileServiceCard title="Secure Payment" text="100% secure checkout" icon={<UtilityIcon type="shield" />} />
      </section>
    </main>
  );
};

const CompactProduct = ({ product, navigate, prefetchRoute }) => (
  <button
    type="button"
    onClick={() => navigate(`/product/${product._id}`)}
    onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
    onFocus={() => prefetchRoute(`/product/${product._id}`)}
    className="grid min-w-0 grid-cols-[50px_minmax(0,1fr)] items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-left transition hover:border-orange-300"
  >
    <span className="flex h-11 w-11 items-center justify-center bg-white">
      <ProductImage product={product} alt={product.name} width={64} height={64} className="h-full w-full object-contain" />
    </span>
    <span className="min-w-0">
      <span className="block truncate text-[11px] font-semibold text-gray-950">{product.name}</span>
      <span className="mt-1 block text-[11px] text-gray-500">
        From <Price product={product} className="text-[11px]" />
      </span>
    </span>
  </button>
);

const DealCard = ({ product, navigate, prefetchRoute, formatCurrency, cardIndex = 0 }) => {
  const activity = getProductActivitySnapshot(product);
  const originalPrice = getPriceValue(product.price);
  const offerPrice = getPriceValue(product.offerPrice || product.price);

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className={`relative isolate min-w-0 rounded-xl p-2.5 text-left shadow-md interactive-lift ${getFlashCardBackground(cardIndex)}`}
    >
      <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-gray-950/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
        {activity.hasDiscount ? `-${activity.priceDropPercent}%` : "Offer"}
      </span>
      <span className="relative z-0 flex aspect-[1.15/1] items-center justify-center rounded-lg bg-white/75 p-1.5 shadow-inner backdrop-blur-sm">
        <ProductImage product={product} alt={product.name} width={140} height={118} className="h-full w-full object-contain" />
      </span>
      <span className="mt-2 line-clamp-2 min-h-8 text-[12px] font-semibold leading-4 text-gray-950">{product.name}</span>
      <span className="mt-2 flex flex-wrap items-center gap-1.5">
        {activity.hasDiscount ? (
          <span className="text-[11px] text-gray-800/60 line-through">{formatCurrency(originalPrice)}</span>
        ) : null}
        <span className="text-[12px] font-bold text-gray-950">{formatCurrency(offerPrice)}</span>
      </span>
    </button>
  );
};

const getMarketingBannerKey = (item, index) => {
  const baseId = item?._id || item?.href || item?.title || item?.imageUrl || "";
  const imageId = item?.imageUrl || "";
  return baseId ? `${baseId}-${index}-${imageId}` : `market-banner-${index}-${imageId}`;
};

function MarketingBannerTile({ item, navigate, prefetchRoute, className = "", priority = false }) {
  const href = getContentHref(item, item?.href || "/all-products");

  if (!item?.imageUrl) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      onMouseEnter={() => prefetchRoute(href)}
      onFocus={() => prefetchRoute(href)}
      className={`group relative block overflow-hidden rounded-lg bg-gray-100 text-left shadow-sm ring-1 ring-gray-100 ${className}`}
    >
      <ContentImage
        src={item.imageUrl}
        alt={item.title || "Marketplace promotion"}
        width={900}
        height={420}
        priority={priority}
        className="h-full w-full transition duration-500 group-hover:scale-[1.02]"
      />
      {item.showOverlay && (item.title || item.buttonText) ? (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/55 via-black/5 to-transparent p-3 text-white">
          {item.title ? <p className="line-clamp-2 text-sm font-bold leading-snug">{item.title}</p> : null}
          {item.buttonText ? (
            <span className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-950">
              {item.buttonText}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

const MarketingBannerGrid = ({ items, navigate, prefetchRoute, className = "" }) => {
  const banners = uniqueById(items.filter((item) => item?.imageUrl)).slice(0, 5);

  if (!banners.length) {
    return null;
  }

  return (
    <section className={`grid gap-2.5 md:grid-cols-2 xl:grid-cols-6 ${className}`}>
      {banners.map((item, index) => (
        <MarketingBannerTile
          key={getMarketingBannerKey(item, index)}
          item={item}
          navigate={navigate}
          prefetchRoute={prefetchRoute}
          priority={index === 0}
          className={
            index < 2
              ? "aspect-[2.45/1] xl:col-span-3"
              : "aspect-[1.85/1] md:aspect-[2.1/1] xl:col-span-2"
          }
        />
      ))}
    </section>
  );
};

const HomeStorefrontSkeleton = () => (
  <>
    <main className="bg-[#fbfbfb] px-3 pb-8 pt-3 md:hidden" aria-hidden="true">
      <Skeleton className="aspect-[2.08/1] w-full rounded-xl" />

      <section className="mt-4 grid grid-cols-5 gap-x-2 gap-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`mobile-category-${index}`} className="flex flex-col items-center gap-2">
            <Skeleton className="h-[3.35rem] w-[3.35rem] rounded-full" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`mobile-service-${index}`} className="flex items-center gap-2 px-2.5 py-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-xl" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`mobile-flash-${index}`} className="w-[9.6rem] shrink-0 space-y-2 rounded-lg border border-gray-200 bg-white p-2">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </main>

    <main className="hidden bg-white px-4 pb-16 pt-4 md:block" aria-hidden="true">
      <div className="mx-auto max-w-[1420px]">
        <section className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_245px]">
          <aside className="h-[260px] rounded-md border border-gray-200 bg-white p-2.5">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`side-category-${index}`} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </aside>

          <Skeleton className="h-[260px] rounded-md" />
          <Skeleton className="h-[260px] rounded-md" />
        </section>

        <section className="mt-3 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`feature-banner-${index}`} className="h-[132px] rounded-md" />
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded-xl" />
              <Skeleton className="h-3 w-64 rounded-full" />
            </div>
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`deal-skeleton-${index}`} className="space-y-2 rounded-md border border-gray-200 bg-white p-2">
                <Skeleton className="aspect-[1.18/1] w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <Skeleton className="mb-3 h-6 w-44 rounded-xl" />
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={`market-item-skeleton-${index}`} className="space-y-3 rounded-md border border-gray-200 bg-white p-2.5">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  </>
);

const RecommendedCard = ({ product, navigate, prefetchRoute, formatCurrency }) => {
  const activity = getProductActivitySnapshot(product);
  const activityLabel = activity.hasRating
    ? `${activity.displayRating}/5 from ${activity.reviewCount} review${activity.reviewCount === 1 ? "" : "s"}`
    : activity.likesCount > 0
      ? `${activity.likesCount} like${activity.likesCount === 1 ? "" : "s"}`
      : activity.freshnessLabel || `Available in ${activity.localTrend}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className="rounded-md border border-gray-200 bg-white p-2.5 text-left transition hover:border-orange-300"
    >
      <span className="flex aspect-square items-center justify-center">
        <ProductImage product={product} alt={product.name} width={190} height={190} className="h-full w-full object-contain" />
      </span>
      <span className="mt-3 line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-4 text-gray-950">{product.name}</span>
      <span className="mt-1 block text-[11px] text-gray-400">SKU: {product._id.slice(-8).toUpperCase()}</span>
      <span className="mt-2.5 flex items-center gap-2">
        <span className="text-sm font-bold text-orange-600">{formatCurrency(getPriceValue(product.offerPrice || product.price))}</span>
        {activity.hasDiscount ? <span className="text-xs text-gray-400 line-through">{formatCurrency(getPriceValue(product.price))}</span> : null}
      </span>
      <span className="mt-1.5 block text-[11px] text-gray-500">{activityLabel}</span>
    </button>
  );
};

const getTimeParts = (milliseconds) => {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const padTime = (value) => String(value).padStart(2, "0");

const FlashCountdown = ({ timeLeft, size = "md" }) => {
  const hasTime = Boolean(
    timeLeft && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0)
  );

  if (!hasTime) {
    return null;
  }

  const units = timeLeft.days > 0
    ? [
        [padTime(timeLeft.days), "Days"],
        [padTime(timeLeft.hours), "Hrs"],
        [padTime(timeLeft.minutes), "Min"],
        [padTime(timeLeft.seconds), "Sec"],
      ]
    : [
        [padTime(timeLeft.hours), "Hrs"],
        [padTime(timeLeft.minutes), "Min"],
        [padTime(timeLeft.seconds), "Sec"],
      ];

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-1 rounded-lg bg-gray-950/5 px-1.5 py-1">
        <span className="pr-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-700">Ends</span>
        {units.map(([value, label], index) => (
          <span key={label} className="flex items-center gap-1">
            {index > 0 ? <span className="text-[10px] font-black text-gray-400">:</span> : null}
            <span className="flip-card flip-card-sm text-[11px] font-extrabold">
              <span key={value} className="flip-digit">{value}</span>
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl bg-gray-950/5 px-2 py-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">Ends in</span>
      <div className="flex items-start gap-1">
        {units.map(([value, label], index) => (
          <div key={label} className="flex items-start gap-1">
            {index > 0 ? <span className="pt-0.5 text-[12px] font-black leading-[1.35rem] text-gray-400">:</span> : null}
            <div className="text-center">
              <span className="flip-card text-[12px] font-extrabold">
                <span key={value} className="flip-digit">{value}</span>
              </span>
              <span className="mt-0.5 block text-[8.5px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MegaStoreHome = ({ siteContent, initialProducts = [] }) => {
  const { products, loadingProducts, navigate, prefetchRoute, formatCurrency, toggleProductLike, customTopCategories, subcategoriesByParent } = useAppContext();
  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);

  useEffect(() => {
    setRecentlyViewedIds(getRecentlyViewedIds());
  }, []);
  const resolvedContent = useMemo(() => resolveSiteContent(siteContent), [siteContent]);
  // Real top-level categories (the static marketplace list plus any the admin
  // added), each with its icon/image — replaces the old hardcoded category
  // rails so what shows is always real, admin-manageable categories. Admins
  // attach an uploaded PNG to any static category by creating a top-level
  // Category record of the same name with an image; it's merged in here.
  const homeCategoryRail = useMemo(() => {
    const dbByName = new Map((customTopCategories || []).map((category) => [category.name, category]));
    const usedNames = new Set();
    const staticRail = homeCategoryValues.map((value) => {
      const meta = getCategoryMeta(value);
      const dbMatch = dbByName.get(value);
      if (dbMatch) usedNames.add(value);
      return { label: meta.label, value, icon: dbMatch?.icon || meta.icon, imageUrl: dbMatch?.imageUrl || "" };
    });
    const customRail = (customTopCategories || [])
      .filter((category) => !usedNames.has(category.name))
      .map((category) => ({
        label: category.name,
        value: category.name,
        icon: category.icon || "📦",
        imageUrl: category.imageUrl || "",
      }));
    return [...staticRail, ...customRail];
  }, [customTopCategories]);
  // "Top Categories" quick-pick rail: static defaults (T-Shirt, Shoes, ...)
  // merged with admin-managed records stored under the TOP_RAIL_PARENT
  // sentinel — an uploaded PNG on a matching record replaces the tile image,
  // and extra records become additional tiles.
  const topRailTiles = useMemo(() => {
    const railRecords = (subcategoriesByParent?.get(TOP_RAIL_PARENT) || [])
      .filter((record) => record.isActive !== false);
    const recordsByName = new Map(railRecords.map((record) => [record.name, record]));
    const usedNames = new Set();
    const staticTiles = homeTopRailDefaults.map(({ label, category }) => {
      const dbMatch = recordsByName.get(label);
      if (dbMatch) usedNames.add(label);
      return { label, category, imageUrl: dbMatch?.imageUrl || "", icon: dbMatch?.icon || "" };
    });
    const customTiles = railRecords
      .filter((record) => !usedNames.has(record.name))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((record) => ({
        label: record.name,
        category: record.name,
        imageUrl: record.imageUrl || "",
        icon: record.icon || "",
      }));
    return [...staticTiles, ...customTiles];
  }, [subcategoriesByParent]);
  // Recently viewed products, most recent first (needs 2+ to feel like a rail).
  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length < 2 || !products.length) return [];
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    return recentlyViewedIds
      .map((id) => productsById.get(id))
      .filter(Boolean)
      .slice(0, 10);
  }, [recentlyViewedIds, products]);
  const storefrontProducts = products.length
    ? products
    : initialProducts.length
      ? initialProducts
      : [];
  const sortedProducts = sortProductsForLiveShowcase(storefrontProducts);
  const heroProduct = sortedProducts[0];
  // Flash Deals only ever shows products that are genuinely flagged as an
  // active flash deal (real discount, within its start/end window — see
  // getProductActivitySnapshot). Products merely marked "featured" or
  // "discount" promotionType are a different concept and must not appear
  // here, or the countdown has nothing real to count down to.
  const flashDealProducts = sortedProducts.filter((product) => getProductActivitySnapshot(product).flashDealActive);
  const dealProducts = takeProducts(
    uniqueById(flashDealProducts)
      .sort((leftProduct, rightProduct) => (Number(rightProduct.date) || 0) - (Number(leftProduct.date) || 0)),
    5
  );
  const homeProducts = productsInCategories(sortedProducts, ["Home & Living", "Appliances", "Construction & Tools"], 10);
  const electronicsProducts = productsInCategories(sortedProducts, ["Computers & Electronics", "Phones & Tablets", "Audio", "Watches & Wearables", "Accessories"], 10);
  const recommendedProducts = sortedProducts;
  const heroSlides = resolvedContent.heroSlides.filter((slide) => slide.imageUrl);
  const promoSlides = resolvedContent.promoBanners.filter((banner) => banner.imageUrl);
  const featuredCards = resolvedContent.featuredCards.filter((card) => card.imageUrl);
  const sidebarBanners = resolvedContent.sidebarPromoBanners.filter((banner) => banner.imageUrl);
  // A "Deal of the Day" banner is any admin-uploaded promo/sidebar banner
  // pointed at a product (via productId) that currently has a genuinely
  // active flash deal — the countdown shown for it is that specific
  // product's own deal, not a generic site-wide timer.
  const dealOfDayBanners = [...promoSlides, ...sidebarBanners].filter((banner) => {
    if (!banner.productId) return false;
    const linkedProduct = sortedProducts.find((product) => product._id === banner.productId);
    return linkedProduct ? getProductActivitySnapshot(linkedProduct).flashDealActive : false;
  });
  const storeCards = Object.entries(
    sortedProducts.reduce((acc, product) => {
      const storeId = product.userId || product.sellerProfile?.id || product.sellerProfile?._id;
      if (!storeId) {
        return acc;
      }

      if (!acc[storeId]) {
        acc[storeId] = [];
      }

      acc[storeId].push(product);
      return acc;
    }, {})
  )
    .map(([storeId, storeProducts]) => {
      const sortedStoreProducts = sortProductsForLiveShowcase(storeProducts);
      const primaryProduct = sortedStoreProducts[0];
      return {
        id: storeId,
        name: primaryProduct?.sellerProfile?.name || "Marketplace store",
        avatarUrl: primaryProduct?.sellerProfile?.avatarUrl || "",
        location: primaryProduct?.sellerProfile?.location || primaryProduct?.sellerLocation || "Location pending",
        productCount: sortedStoreProducts.length,
        href: `/store/${encodeURIComponent(storeId)}`,
      };
    })
    .sort((left, right) => right.productCount - left.productCount)
    ;
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [visibleStoreCount, setVisibleStoreCount] = useState(8);
  const storeLoadMoreRef = useRef(null);

  const visibleStoreCards = storeCards.slice(0, visibleStoreCount);

  useEffect(() => {
    if (heroSlides.length < 2) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    if (promoSlides.length < 2) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActivePromoIndex((current) => (current + 1) % promoSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [promoSlides.length]);

  useEffect(() => {
    if (dealProducts.length < 2) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveDealIndex((current) => (current + 1) % dealProducts.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [dealProducts.length]);

  const earliestDealDeadline = useMemo(() => {
    const deadlines = dealProducts
      .map((product) => getProductActivitySnapshot(product).flashDealEndsAt)
      .filter((value) => Number.isFinite(value) && value > Date.now());

    return deadlines.length ? Math.min(...deadlines) : 0;
  }, [dealProducts]);

  useEffect(() => {
    if (!earliestDealDeadline) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [earliestDealDeadline]);

  const activePromo = {
    ...(promoSlides[activePromoIndex % Math.max(promoSlides.length, 1)] || resolvedContent.promoBanner),
    _activeDealIndex: activeDealIndex,
  };
  const marketingBanners = [...promoSlides, ...featuredCards];
  const timeLeft = getTimeParts(earliestDealDeadline ? earliestDealDeadline - now : 0);

  useEffect(() => {
    setVisibleStoreCount(Math.min(8, storeCards.length || 8));
  }, [storeCards.length]);

  useEffect(() => {
    if (!storeLoadMoreRef.current || visibleStoreCount >= storeCards.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleStoreCount((current) => Math.min(current + 4, storeCards.length));
      },
      { rootMargin: "180px 0px" }
    );

    observer.observe(storeLoadMoreRef.current);

    return () => observer.disconnect();
  }, [storeCards.length, visibleStoreCount]);

  if (!heroProduct && loadingProducts) {
    return <HomeStorefrontSkeleton />;
  }

  if (!heroProduct) {
    return (
      <main className="bg-white px-4 pb-16 pt-4">
        <div className="mx-auto max-w-[1420px]">
          <section className="rounded-md border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <h1 className="text-2xl font-bold text-gray-950">No marketplace products yet</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
              Deals, offers, images, names, and prices will appear here automatically as sellers or admins add products to the database.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <>
    <MobileHome
      heroSlides={heroSlides}
      activeHeroIndex={activeHeroIndex}
      setActiveHeroIndex={setActiveHeroIndex}
      activePromo={activePromo}
      marketingBanners={marketingBanners}
      sidebarBanners={sidebarBanners}
      dealOfDayBanners={dealOfDayBanners}
      dealProducts={dealProducts}
      recommendedProducts={recommendedProducts}
      sortedProducts={sortedProducts}
      storeCards={visibleStoreCards}
      storeLoadMoreRef={storeLoadMoreRef}
      timeLeft={timeLeft}
      hasCountdown={earliestDealDeadline > now}
      homeCategoryRail={homeCategoryRail}
      topRailTiles={topRailTiles}
      recentlyViewedProducts={recentlyViewedProducts}
      navigate={navigate}
      prefetchRoute={prefetchRoute}
      formatCurrency={formatCurrency}
      toggleProductLike={toggleProductLike}
    />
    <main className="hidden bg-white px-4 pb-16 pt-4 md:block">
      <div className="mx-auto max-w-[1420px]">
        <section className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_245px]">
          <aside className="h-[260px] overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="flex h-full flex-col gap-0.5 overflow-y-auto p-2">
              {homeCategoryRail.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => navigate(`/all-products?category=${encodeURIComponent(category.value)}`)}
                  className="flex w-full shrink-0 items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-gray-800 transition hover:bg-orange-50 hover:text-orange-600"
                >
                  <span className="truncate">{category.label}</span>
                  <span className="text-gray-400"><ChevronRight /></span>
                </button>
              ))}
              <button type="button" onClick={() => navigate("/categories")} className="shrink-0 px-2.5 py-2 text-left text-[12px] font-semibold text-orange-600">+ More categories</button>
            </div>
          </aside>

          {heroSlides.length ? (
            <HeroImageSlider
              slides={heroSlides}
              currentIndex={activeHeroIndex % Math.max(heroSlides.length || 1, 1)}
              onSelect={setActiveHeroIndex}
              navigate={navigate}
              priority
              className="h-[260px] rounded-md bg-gray-100"
            />
          ) : (
            <PromoPlaceholder navigate={navigate} className="h-[260px] w-full rounded-md" label="Shop the KawilMart marketplace" />
          )}

          {activePromo?.imageUrl ? (
            <button
              type="button"
              onClick={() => navigate(getContentHref(activePromo, "/all-products?filter=flash"))}
              className="relative block h-[260px] overflow-hidden rounded-md bg-gray-100 text-left"
            >
              <Image src={activePromo.imageUrl} alt={activePromo.title || "Promotional offer"} width={420} height={520} className="absolute inset-0 h-full w-full object-cover" />
            </button>
          ) : (
            <PromoPlaceholder navigate={navigate} href="/all-products?filter=flash" className="h-[260px]" label="See today's offers" />
          )}
        </section>

        {featuredCards.length ? (
          <section className="mt-3 grid gap-3 md:grid-cols-3">
            {featuredCards.slice(0, 3).map((card, index) => (
              <MarketingBannerTile
                key={card._id || `hero-feature-${index}`}
                item={card}
                navigate={navigate}
                prefetchRoute={prefetchRoute}
                className="h-[132px] rounded-md"
              />
            ))}
          </section>
        ) : null}

        {dealProducts.length ? (
          <section className="mt-6 rounded-xl bg-gradient-to-br from-orange-100/80 via-rose-100/70 to-amber-50/90 px-4 py-4">
            <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-950">Flash Deals</h2>
                <p className="text-[11px] text-gray-500">Active promotions ending soon</p>
              </div>
              <div className="flex items-center gap-3">
                {earliestDealDeadline > now ? <FlashCountdown timeLeft={timeLeft} /> : null}
                <button
                  type="button"
                  onClick={() => navigate("/all-products?filter=flash")}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  View all -&gt;
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {dealProducts.map((product, index) => (
                <DealCard key={`deal-${index}-${product._id || product.name}`} product={product} cardIndex={index} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} />
              ))}
            </div>
          </section>
        ) : null}

        {homeProducts.length ? (
          <section className="mt-6 rounded-md bg-orange-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">Home and outdoor products</h2>
              <button type="button" onClick={() => navigate("/all-products?category=Home%20%26%20Living")} className="text-xs font-semibold text-orange-600">Explore all -&gt;</button>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-5">
              {homeProducts.map((product, index) => (
                <CompactProduct key={`home-${index}-${product._id || product.name}`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} />
              ))}
            </div>
          </section>
        ) : null}

        {electronicsProducts.length ? (
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">Consumer electronics and gadgets</h2>
              <button type="button" onClick={() => navigate("/all-products?category=Computers%20%26%20Electronics")} className="text-xs font-semibold text-orange-600">Explore all -&gt;</button>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-5">
              {electronicsProducts.map((product, index) => (
                <CompactProduct key={`electronics-${index}-${product._id || product.name}`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} />
              ))}
            </div>
          </section>
        ) : null}

        <MarketingBannerGrid
          items={marketingBanners}
          navigate={navigate}
          prefetchRoute={prefetchRoute}
          className="mt-8"
        />

        <ProductStripRail
          title="Recently viewed"
          products={recentlyViewedProducts}
          navigate={navigate}
          prefetchRoute={prefetchRoute}
          formatCurrency={formatCurrency}
          className="mt-8"
        />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-gray-950">All marketplace items</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
            {recommendedProducts.map((product, index) => (
              <RecommendedCard key={`recommended-${index}-${product._id || product.name}`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} />
            ))}
          </div>
        </section>

        {visibleStoreCards.length ? (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Best Selling Stores</h2>
                <p className="text-xs text-gray-500">Quick access to active stores with current listings.</p>
              </div>
              <button type="button" onClick={() => navigate("/all-products?sort=popular")} className="text-xs font-semibold text-orange-600">
                View all stores →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleStoreCards.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => navigate(store.href)}
                  onMouseEnter={() => prefetchRoute(store.href)}
                  onFocus={() => prefetchRoute(store.href)}
                  className="flex min-h-[4.75rem] w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    {store.avatarUrl ? (
                      <Image src={store.avatarUrl} alt={store.name} width={56} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-gray-700">{store.name.slice(0, 1)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-gray-950">{store.name}</span>
                    <span className="block text-[11px] text-gray-500">{store.location}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-orange-600">{store.productCount} products</span>
                  </span>
                </button>
              ))}
            </div>
            <div ref={storeLoadMoreRef} className="h-1 w-full" aria-hidden="true" />
          </section>
        ) : null}
      </div>
    </main>
    </>
  );
};

export default MegaStoreHome;
