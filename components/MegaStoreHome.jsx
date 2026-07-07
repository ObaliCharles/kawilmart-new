'use client'

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import CategoryLineIcon from "@/components/CategoryLineIcon";
import Skeleton from "@/components/Skeleton";
import { defaultSiteContent, resolveSiteContent } from "@/lib/defaultSiteContent";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
import { getProductActivitySnapshot, sortProductsForLiveShowcase } from "@/lib/liveCommerce";
import { getProductStockSnapshot } from "@/lib/productStock";

const compactCategories = [
  ["Automobiles", "car", "/all-products?category=Automotive"],
  ["Home appliance", "home", "/all-products?category=Appliances"],
  ["Tools & Equipment", "tools", "/all-products?category=Construction%20%26%20Tools"],
  ["Books & Magazines", "book", "/all-products?category=Books%20%26%20Learning"],
  ["Electronic gadgets", "phone", "/all-products?category=Computers%20%26%20Electronics"],
  ["Clothing", "shirt", "/all-products?category=Fashion"],
  ["Sports & Outdoor", "ball", "/all-products?category=Sports%20%26%20Outdoors"],
];

const mobileFeaturedCategories = [
  ["Phones", "Phones & Tablets"],
  ["Laptops", "Computers & Electronics"],
  ["Audio", "Audio"],
  ["TV sets", "Computers & Electronics"],
];

const mobileTopCategories = [
  ["T-Shirt", "Fashion"],
  ["Shirt", "Fashion"],
  ["Shoes", "Fashion"],
  ["Watches", "Watches & Wearables"],
  ["Bag", "Accessories"],
  ["Jeans", "Fashion"],
  ["Jacket", "Fashion"],
];

const takeProducts = (products, count) => products.slice(0, count);

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

const CategoryIcon = ({ type }) => {
  const paths = {
    car: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9M8 17a1.5 1.5 0 1 0 0 .1m8-.1a1.5 1.5 0 1 0 0 .1",
    home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
    tools: "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
    book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
    phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2",
    shirt: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
    ball: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  };

  return (
    <svg className="h-5 w-5 text-gray-700" aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[type] || paths.phone} stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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

  if (!safeSlides.length) {
    return null;
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
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
            </button>
          );
        })}
      </div>

      {safeSlides.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
          {safeSlides.map((slide, index) => (
            <button
              key={slide._id || index}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(index);
              }}
              className={`h-2 rounded-full transition-all ${currentIndex === index ? "w-5 bg-white" : "w-2 bg-white/55"}`}
              aria-label={`Show offer ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

const productForCategory = (products, category) => (
  products.find((product) => categoryMatchesSelection(product.category, category)) || products[0]
);

const MobileRoundCategory = ({ label, category, products, navigate }) => {
  const product = productForCategory(products, category);

  return (
    <button
      type="button"
      onClick={() => navigate(`/all-products?category=${encodeURIComponent(category)}`)}
      className="flex min-w-0 flex-col items-center gap-1.5 text-center"
    >
      <span className="flex h-[3.35rem] w-[3.35rem] items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-100">
        {product ? (
          <ProductImage product={product} alt={label} width={76} height={76} className="h-full w-full object-contain p-1" />
        ) : (
          <CategoryLineIcon category={category} className="h-5 w-5 text-gray-700" />
        )}
      </span>
      <span className="line-clamp-2 min-h-7 text-[10px] font-bold leading-[14px] text-gray-950">{label}</span>
    </button>
  );
};

const MobileTopCategory = ({ label, category, products, navigate }) => {
  const product = productForCategory(products, category);
  const brandLogo = product?.sellerProfile?.avatarUrl;

  return (
    <button
      type="button"
      onClick={() => navigate(`/all-products?category=${encodeURIComponent(category)}`)}
      className="flex h-[6.7rem] min-w-0 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm"
    >
      <span className="relative flex h-12 w-full items-center justify-center">
        {product ? (
          <ProductImage product={product} alt={label} width={86} height={62} className="h-full w-full object-contain" />
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

const MobileFlashCard = ({ product, navigate, prefetchRoute, formatCurrency, toggleProductLike }) => {
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
      className="relative isolate w-[9.6rem] shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-left shadow-sm"
    >
      <span className="absolute left-2 top-2 z-20 rounded bg-rose-500 px-2 py-1 text-[11px] font-bold text-white">
        -{Math.max(activity.priceDropPercent, 15)}%
      </span>
      <span onClick={likeProduct} className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ${liked ? "text-red-600" : "text-gray-400"}`}>
        <HeartGlyph filled={liked} />
      </span>
      <span className="relative z-0 flex aspect-square items-center justify-center rounded-md bg-gray-50">
        <ProductImage product={product} alt={product.name} width={150} height={150} className="h-full w-full object-contain p-1" />
      </span>
      <span className="mt-2 block line-clamp-2 min-h-9 text-[12px] font-bold leading-[18px] text-gray-950">{product.name}</span>
      <span className="mt-1 block text-[11px] text-gray-500">{activity.localTrend}</span>
      <span className="mt-1 block text-sm font-extrabold text-orange-600">{formatCurrency(offerPrice)}</span>
      {originalPrice > offerPrice ? <span className="text-[11px] text-gray-400 line-through">{formatCurrency(originalPrice)}</span> : null}
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
      <span className="mt-2 block line-clamp-2 min-h-10 text-[13px] font-bold leading-5 text-gray-950">{product.name}</span>
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

const MobileHome = ({
  heroSlides,
  activeHeroIndex,
  setActiveHeroIndex,
  activePromo,
  marketingBanners,
  dealProducts,
  recommendedProducts,
  sortedProducts,
  timeLeft,
  navigate,
  prefetchRoute,
  formatCurrency,
  toggleProductLike,
}) => {
  const heroFallback = sortedProducts[0];
  const dealOfDay = dealProducts[activePromo?._activeDealIndex || 0] || dealProducts[0] || sortedProducts[0];
  const topStoreProducts = uniqueById(sortedProducts).filter((product) => product.userId).slice(0, 8);
  const promoProduct = sortedProducts[1] || heroFallback;
  const secondPromoProduct = sortedProducts[2] || heroFallback;
  const promoHref = getContentHref(activePromo, "/all-products?sort=newest");
  const mobileHeroSlides = heroSlides.length ? heroSlides : [{ ...defaultSiteContent.heroSlides[0], imageUrl: getImage(heroFallback) }];
  const mobileMarketingBanners = (Array.isArray(marketingBanners) ? marketingBanners : [])
    .filter((item) => item?.imageUrl)
    .slice(0, 3);

  return (
    <main className="bg-[#fbfbfb] px-3 pb-8 pt-3 md:hidden">
      <HeroImageSlider
        slides={mobileHeroSlides}
        currentIndex={activeHeroIndex % Math.max(mobileHeroSlides.length, 1)}
        onSelect={setActiveHeroIndex}
        navigate={navigate}
        priority
        className="aspect-[2.08/1] rounded-xl bg-gray-100 shadow-sm"
      />

      <section className="mt-4 grid grid-cols-5 gap-x-2 gap-y-3">
        {mobileFeaturedCategories.map(([label, category]) => (
          <MobileRoundCategory key={label} label={label} category={category} products={sortedProducts} navigate={navigate} />
        ))}
        <button type="button" onClick={() => navigate("/all-products")} className="flex min-w-0 flex-col items-center gap-2 text-center">
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

      <section className="mt-8">
        <SectionHeader title="Flash Sale" onViewAll={() => navigate("/all-products?filter=flash")} />
        <div className="mb-4 flex items-center gap-2">
          {[padTime(timeLeft.hours || 8), padTime(timeLeft.minutes || 17), padTime(timeLeft.seconds || 56), "23"].map((value, index) => (
            <span key={`${value}-${index}`} className="rounded-md bg-rose-500 px-2 py-1 text-[12px] font-extrabold text-white">{value}</span>
          ))}
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {(dealProducts.length ? dealProducts : sortedProducts).slice(0, 8).map((product) => (
            <MobileFlashCard key={`${product._id}-mobile-flash`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} toggleProductLike={toggleProductLike} />
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
          {recommendedProducts.slice(0, 6).map((product) => (
            <MobileProductCard key={`${product._id}-mobile-reco`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} toggleProductLike={toggleProductLike} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Top Categories" onViewAll={() => navigate("/all-products")} />
        <div className="grid grid-cols-4 gap-3">
          {mobileTopCategories.map(([label, category]) => (
            <MobileTopCategory key={label} label={label} category={category} products={sortedProducts} navigate={navigate} />
          ))}
          <button type="button" onClick={() => navigate("/all-products")} className="flex h-[6.7rem] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white text-center shadow-sm">
            <span className="text-gray-400"><UtilityIcon type="grid" /></span>
            <span className="mt-2 text-[12px] font-bold text-gray-950">All Categories</span>
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate(promoHref)}
        className="relative mt-6 block aspect-[2.08/1] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm"
      >
        <ContentImage src={activePromo.imageUrl || getImage(promoProduct)} alt={activePromo.title || "New arrivals"} width={720} height={346} className="h-full w-full transition-opacity duration-500" />
      </button>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="relative min-h-40 overflow-hidden rounded-lg bg-orange-50 p-4">
          <h3 className="text-lg font-extrabold leading-6 text-gray-950">Bank Offers Up to 20% Off</h3>
          <p className="mt-2 text-[12px] leading-5 text-gray-600">Exclusive discounts on select cards.</p>
          <button type="button" onClick={() => navigate(getContentHref(activePromo, "/all-products?filter=flash"))} className="mt-4 text-[12px] font-bold text-orange-600">Shop Now -&gt;</button>
          <ProductImage product={secondPromoProduct} alt="Bank offer" width={120} height={100} className="absolute bottom-2 right-1 h-20 w-24 object-contain" />
        </div>
        <div className="relative min-h-40 overflow-hidden rounded-lg bg-orange-50 p-4">
          <h3 className="text-lg font-extrabold leading-6 text-gray-950">Refer & Earn UGX 10,000</h3>
          <p className="mt-2 text-[12px] leading-5 text-gray-600">Invite friends and get rewarded.</p>
          <button type="button" onClick={() => navigate("/about")} className="mt-4 text-[12px] font-bold text-orange-600">Refer Now -&gt;</button>
          <span className="absolute bottom-4 right-4 text-orange-500"><UtilityIcon type="gift" /></span>
        </div>
      </section>

      {mobileMarketingBanners.length ? (
        <section className="mt-6 grid gap-2">
          {mobileMarketingBanners.map((item, index) => (
            <MarketingBannerTile
              key={item?._id || item?.imageUrl || `mobile-market-banner-${index}`}
              item={item}
              navigate={navigate}
              prefetchRoute={prefetchRoute}
              className="aspect-[2.35/1]"
            />
          ))}
        </section>
      ) : null}

      {dealOfDay ? (
        <section onClick={() => navigate(`/product/${dealOfDay._id}`)} className="relative mt-6 cursor-pointer overflow-hidden rounded-lg bg-[#101923] px-6 py-7 text-white shadow-sm">
          <div className="relative z-10 max-w-[58%]">
            <h2 className="text-xl font-extrabold">Deal of the Day</h2>
            <div className="mt-4 flex gap-2">
              {[padTime(timeLeft.hours || 8), padTime(timeLeft.minutes || 17), padTime(timeLeft.seconds || 56)].map((value, index) => (
                <span key={`${value}-dod-${index}`} className="rounded bg-orange-600 px-2 py-1 text-[12px] font-extrabold">{value}</span>
              ))}
            </div>
            <p className="mt-4 line-clamp-2 text-sm font-bold">{dealOfDay.name}</p>
            <p className="mt-3 text-lg font-extrabold">{formatCurrency(getPriceValue(dealOfDay.offerPrice || dealOfDay.price))}</p>
            <p className="mt-3 text-sm font-extrabold text-orange-500">{Math.max(getProductActivitySnapshot(dealOfDay).priceDropPercent, 15)}% OFF</p>
            <span className="mt-3 block h-1.5 w-40 rounded-full bg-white/30">
              <span className="block h-full w-3/5 rounded-full bg-orange-600" />
            </span>
            <span className="mt-2 block text-[11px] text-white/75">{getProductStockSnapshot(dealOfDay).label}</span>
          </div>
          <ProductImage product={dealOfDay} alt={dealOfDay.name} width={230} height={230} className="absolute bottom-5 right-2 h-40 w-40 object-contain" />
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader title="Best Selling Stores" onViewAll={() => navigate("/all-products?sort=popular")} />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {topStoreProducts.map((product) => (
            <button key={`${product._id}-store`} type="button" onClick={() => navigate(`/store/${encodeURIComponent(product.sellerProfile?.id || product.userId)}`)} className="flex w-40 shrink-0 items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {product.sellerProfile?.avatarUrl ? (
                  <img src={product.sellerProfile.avatarUrl} alt={product.sellerProfile?.name || product.name} className="h-full w-full object-cover" />
                ) : (
                  <ContentImage src={getImage(product)} alt={product.sellerProfile?.name || product.name} width={56} height={56} className="h-full w-full object-cover" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-extrabold text-gray-950">{product.sellerProfile?.name || "KawilMart Store"}</span>
                <span className="mt-1 block text-[11px] text-orange-500">★ {(product.sellerProfile?.ratingSummary?.overall || 0).toFixed(1)}</span>
                <span className="mt-1 block text-[11px] text-gray-500">{Math.max(0, Number(product.soldCount) || 0)} sold</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-orange-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-orange-200 text-orange-600"><UtilityIcon type="mail" /></span>
          <div>
            <h2 className="text-sm font-extrabold text-gray-950">Subscribe to our newsletter</h2>
            <p className="mt-1 text-[12px] leading-5 text-gray-600">Get updates on new arrivals and exclusive offers.</p>
          </div>
        </div>
        <form className="mt-4 flex overflow-hidden rounded-md bg-white">
          <input type="email" placeholder="Enter your email" className="min-w-0 flex-1 px-4 py-3 text-[12px] outline-none" />
          <button type="submit" className="bg-orange-600 px-4 text-[12px] font-bold text-white">Subscribe</button>
        </form>
      </section>

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

const DealCard = ({ product, navigate, prefetchRoute, formatCurrency }) => {
  const activity = getProductActivitySnapshot(product);
  const originalPrice = getPriceValue(product.price);
  const offerPrice = getPriceValue(product.offerPrice || product.price);

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className="relative isolate min-w-0 rounded-md border border-gray-200 bg-white p-2 text-left transition hover:border-orange-300"
    >
      <span className="absolute left-2 top-2 z-20 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
        {activity.hasDiscount ? `-${activity.priceDropPercent}%` : "Offer"}
      </span>
      <span className="relative z-0 flex aspect-[1.18/1] items-center justify-center">
        <ProductImage product={product} alt={product.name} width={140} height={118} className="h-full w-full object-contain" />
      </span>
      <span className="mt-2 line-clamp-2 min-h-8 text-[12px] font-semibold leading-4 text-gray-950">{product.name}</span>
      <span className="mt-2 flex flex-wrap items-center gap-1.5">
        {activity.hasDiscount ? (
          <span className="text-[11px] text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
        ) : null}
        <span className="text-[12px] font-bold text-orange-600">{formatCurrency(offerPrice)}</span>
      </span>
    </button>
  );
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
          key={item._id || `market-banner-${index}`}
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
          <aside className="rounded-md border border-gray-200 bg-white p-2.5 lg:row-span-2">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={`side-category-${index}`} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </aside>

          <Skeleton className="h-[238px] rounded-md xl:h-[252px]" />
          <Skeleton className="min-h-[238px] rounded-md xl:min-h-[252px]" />

          <div className="grid gap-3 lg:col-span-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`feature-banner-${index}`} className="aspect-[2.15/1] rounded-md" />
            ))}
          </div>
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
      <span className="mt-3 line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-[18px] text-gray-950">{product.name}</span>
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

const getPromotionRank = (product) => {
  const activity = getProductActivitySnapshot(product);

  if (activity.flashDealActive) {
    return 0;
  }

  if (product?.promotionType === "discount") {
    return 1;
  }

  if (product?.promotionType === "featured") {
    return 2;
  }

  return 99;
};

const isPromotedProduct = (product) => getPromotionRank(product) < 99;

const MegaStoreHome = ({ siteContent, initialProducts = [] }) => {
  const { products, loadingProducts, navigate, prefetchRoute, formatCurrency, toggleProductLike } = useAppContext();
  const resolvedContent = useMemo(() => resolveSiteContent(siteContent || defaultSiteContent), [siteContent]);
  const storefrontProducts = products.length
    ? products
    : initialProducts.length
      ? initialProducts
      : [];
  const sortedProducts = sortProductsForLiveShowcase(storefrontProducts);
  const heroProduct = sortedProducts[0];
  const flashDealProducts = sortedProducts.filter((product) => getProductActivitySnapshot(product).flashDealActive);
  const offerProducts = sortedProducts.filter((product) => {
    return product.promotionType === "discount" || product.promotionType === "featured";
  });
  const dealProducts = takeProducts(
    uniqueById([...flashDealProducts, ...offerProducts])
      .filter(isPromotedProduct)
      .sort((leftProduct, rightProduct) => {
        const rankDifference = getPromotionRank(leftProduct) - getPromotionRank(rightProduct);

        if (rankDifference !== 0) {
          return rankDifference;
        }

        return (Number(rightProduct.date) || 0) - (Number(leftProduct.date) || 0);
      }),
    7
  );
  const homeProducts = productsInCategories(sortedProducts, ["Home & Living", "Appliances", "Construction & Tools"], 10);
  const electronicsProducts = productsInCategories(sortedProducts, ["Computers & Electronics", "Phones & Tablets", "Audio", "Watches & Wearables", "Accessories"], 10);
  const recommendedProducts = sortedProducts;
  const heroSlides = resolvedContent.heroSlides.filter((slide) => slide.imageUrl);
  const promoSlides = resolvedContent.promoBanners.filter((banner) => banner.imageUrl);
  const featuredCards = resolvedContent.featuredCards.filter((card) => card.imageUrl);
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
    .slice(0, 8);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [now, setNow] = useState(Date.now());

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

  const activeHero = heroSlides[activeHeroIndex % Math.max(heroSlides.length, 1)] || defaultSiteContent.heroSlides[0];
  const activePromo = {
    ...(promoSlides[activePromoIndex % Math.max(promoSlides.length, 1)] || resolvedContent.promoBanner),
    _activeDealIndex: activeDealIndex,
  };
  const marketingBanners = [...promoSlides, ...featuredCards];
  const timeLeft = getTimeParts(earliestDealDeadline ? earliestDealDeadline - now : 0);

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
      marketingBanners={marketingBanners.length ? marketingBanners : [...defaultSiteContent.heroSlides, ...defaultSiteContent.featuredCards]}
      dealProducts={dealProducts}
      recommendedProducts={recommendedProducts}
      sortedProducts={sortedProducts}
      timeLeft={timeLeft}
      navigate={navigate}
      prefetchRoute={prefetchRoute}
      formatCurrency={formatCurrency}
      toggleProductLike={toggleProductLike}
    />
    <main className="hidden bg-white px-4 pb-16 pt-4 md:block">
      <div className="mx-auto max-w-[1420px]">
        <section className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_245px]">
          <aside className="rounded-md border border-gray-200 bg-white p-2.5 lg:row-span-2">
            <div className="space-y-1">
              {compactCategories.map(([label, icon, href]) => (
                <div
                  key={label}
                  className="group relative"
                >
                  <button
                    type="button"
                    onClick={() => navigate(href)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] text-gray-800 transition hover:bg-orange-50 hover:text-orange-600 group-hover:bg-orange-50 group-hover:text-orange-600"
                  >
                    <span className="flex items-center gap-2.5"><CategoryIcon type={icon} />{label}</span>
                    <span className="text-gray-400 group-hover:text-orange-500"><ChevronRight /></span>
                  </button>
                  <div className="absolute left-full top-0 z-30 hidden min-w-52 rounded-md border border-gray-200 bg-white p-2 text-[12px] text-gray-700 shadow-lg group-hover:block group-focus-within:block">
                    <button type="button" onClick={() => navigate(`${href}&filter=flash`)} className="block w-full rounded px-3 py-2 text-left hover:bg-orange-50 hover:text-orange-600">{label} deals</button>
                    <button type="button" onClick={() => navigate(`${href}&sort=newest`)} className="block w-full rounded px-3 py-2 text-left hover:bg-orange-50 hover:text-orange-600">New arrivals</button>
                    <button type="button" onClick={() => navigate(`${href}&sort=popular`)} className="block w-full rounded px-3 py-2 text-left hover:bg-orange-50 hover:text-orange-600">Best sellers</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => navigate("/all-products")} className="px-2.5 py-2 text-[12px] font-semibold text-orange-600">+ More categories</button>
            </div>
          </aside>

          <HeroImageSlider
            slides={heroSlides.length ? heroSlides : [activeHero]}
            currentIndex={activeHeroIndex % Math.max(heroSlides.length || 1, 1)}
            onSelect={setActiveHeroIndex}
            navigate={navigate}
            priority
            className="h-[238px] rounded-md bg-gray-100 xl:h-[252px]"
          />

          <button
            type="button"
            onClick={() => navigate(getContentHref(activePromo, "/all-products?filter=flash"))}
            className="relative block min-h-[238px] overflow-hidden rounded-md bg-gray-100 text-left xl:min-h-[252px]"
          >
            <Image src={activePromo.imageUrl || getImage(heroProduct)} alt={activePromo.title || "Promotional offer"} width={420} height={520} className="absolute inset-0 h-full w-full object-cover" />
          </button>

          <div className="grid gap-3 lg:col-span-2 md:grid-cols-3">
            {(featuredCards.length ? featuredCards : defaultSiteContent.featuredCards).slice(0, 3).map((card, index) => (
              <MarketingBannerTile
                key={card._id || `hero-feature-${index}`}
                item={card}
                navigate={navigate}
                prefetchRoute={prefetchRoute}
                className="aspect-[2.15/1] rounded-md"
              />
            ))}
          </div>
        </section>

        {dealProducts.length ? (
          <section className="mt-7">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Deals and offers</h2>
                <p className="text-xs text-gray-500">Active flash deals, discounts, and featured promotions set by admin.</p>
              </div>
              {earliestDealDeadline ? (
                <div className="flex gap-2">
                  {[
                    [padTime(timeLeft.days), "Days"],
                    [padTime(timeLeft.hours), "Hours"],
                    [padTime(timeLeft.minutes), "Mins"],
                    [padTime(timeLeft.seconds), "Secs"],
                  ].map(([value, label]) => (
                    <div key={label} className="text-center">
                      <div className="rounded-md bg-orange-600 px-2.5 py-1.5 text-xs font-bold text-white">{value}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              {dealProducts.map((product, index) => (
                <DealCard key={`${product._id}-deal-${index}`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} />
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
              {homeProducts.map((product) => (
                <CompactProduct key={`${product._id}-home`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} />
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
              {electronicsProducts.map((product) => (
                <CompactProduct key={`${product._id}-electronics`} product={product} navigate={navigate} prefetchRoute={prefetchRoute} />
              ))}
            </div>
          </section>
        ) : null}

        <MarketingBannerGrid
          items={marketingBanners.length ? marketingBanners : [...defaultSiteContent.heroSlides, ...defaultSiteContent.featuredCards]}
          navigate={navigate}
          prefetchRoute={prefetchRoute}
          className="mt-8"
        />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-gray-950">All marketplace items</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
            {recommendedProducts.map((product) => (
              <RecommendedCard key={product._id} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} />
            ))}
          </div>
        </section>

        {storeCards.length ? (
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
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {storeCards.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => navigate(store.href)}
                  onMouseEnter={() => prefetchRoute(store.href)}
                  onFocus={() => prefetchRoute(store.href)}
                  className="flex w-[18rem] shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
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
          </section>
        ) : null}
      </div>
    </main>
    </>
  );
};

export default MegaStoreHome;
