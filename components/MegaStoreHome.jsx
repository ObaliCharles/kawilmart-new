'use client'

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import { defaultSiteContent, resolveSiteContent } from "@/lib/defaultSiteContent";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
import { getProductActivitySnapshot, sortProductsForLiveShowcase } from "@/lib/liveCommerce";

const compactCategories = [
  ["Automobiles", "car", "/all-products?category=Automotive"],
  ["Home appliance", "home", "/all-products?category=Appliances"],
  ["Tools & Equipment", "tools", "/all-products?category=Construction%20%26%20Tools"],
  ["Books & Magazines", "book", "/all-products?category=Books%20%26%20Learning"],
  ["Electronic gadgets", "phone", "/all-products?category=Computers%20%26%20Electronics"],
  ["Clothing", "shirt", "/all-products?category=Fashion"],
  ["Sports & Outdoor", "ball", "/all-products?category=Sports%20%26%20Outdoors"],
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

const ProductImage = ({ product, alt, className, width, height, priority = false }) => {
  const fallbackImage = assets.upload_area;
  const [src, setSrc] = useState(() => getImage(product));

  useEffect(() => {
    setSrc(getImage(product));
  }, [product]);

  return (
    <Image
      src={src || fallbackImage}
      alt={alt || product?.name || "Product image"}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setSrc(fallbackImage)}
    />
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
      className="relative min-w-0 rounded-md border border-gray-200 bg-white p-2 text-left transition hover:border-orange-300"
    >
      <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
        {activity.hasDiscount ? `-${activity.priceDropPercent}%` : "Offer"}
      </span>
      <span className="flex aspect-[1.18/1] items-center justify-center">
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

const getContentHref = (item, fallback = "/all-products") => {
  if (item?.productId) {
    return `/product/${item.productId}`;
  }

  return item?.primaryHref || item?.href || fallback;
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
  const { products, loadingProducts, navigate, prefetchRoute, formatCurrency } = useAppContext();
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
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
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
  const activePromo = promoSlides[activePromoIndex % Math.max(promoSlides.length, 1)] || resolvedContent.promoBanner;
  const timeLeft = getTimeParts(earliestDealDeadline ? earliestDealDeadline - now : 0);

  if (!heroProduct && loadingProducts) {
    return (
      <main className="bg-white px-4 pb-16 pt-4">
        <div className="mx-auto max-w-[1420px]">
          <div className="h-[270px] animate-pulse rounded-md bg-gray-100" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        </div>
      </main>
    );
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
    <main className="bg-white px-4 pb-16 pt-4">
      <div className="mx-auto max-w-[1420px]">
        <section className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_245px]">
          <aside className="rounded-md border border-gray-200 bg-white p-2.5">
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

          <section className="grid min-h-[270px] overflow-hidden rounded-md bg-gradient-to-r from-orange-50 to-orange-100 md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-6 lg:p-8">
              {activeHero.offer ? <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">{activeHero.offer}</p> : null}
              <h1 className="max-w-sm text-[28px] font-extrabold leading-tight text-gray-950">{activeHero.title}</h1>
              <p className="mt-3 max-w-xs text-[13px] leading-5 text-gray-600">Discover current marketplace offers, fresh uploads, and seller-backed deals.</p>
              <button type="button" onClick={() => navigate(getContentHref(activeHero, "/all-products"))} className="mt-5 w-fit rounded-md border border-orange-600 px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-600 hover:text-white">
                {activeHero.primaryButtonText || "Learn more"} -&gt;
              </button>
            </div>
            <div className="flex items-center justify-center p-6">
              <Image src={activeHero.imageUrl || assets.header_macbook_image} alt={activeHero.title || "Homepage offer"} width={620} height={380} className="h-full max-h-[230px] w-full object-contain transition-opacity duration-300" priority />
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-md bg-gray-950 p-5 text-white">
            <div className="relative z-10 max-w-[190px]">
              <h2 className="text-lg font-bold leading-tight">{activePromo.title || "Promotional offers"}</h2>
              {activePromo.description ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/75">{activePromo.description}</p> : null}
              <button type="button" onClick={() => navigate(getContentHref(activePromo, "/all-products?filter=flash"))} className="mt-5 rounded-md bg-orange-600 px-4 py-2 text-xs font-semibold text-white">{activePromo.buttonText || "Get offer"}</button>
            </div>
            <Image src={activePromo.imageUrl || getImage(heroProduct)} alt={activePromo.title || "Promotional offer"} width={220} height={240} className="absolute bottom-0 right-0 h-36 w-36 object-contain opacity-95" />
          </aside>
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

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-gray-950">All marketplace items</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
            {recommendedProducts.map((product) => (
              <RecommendedCard key={product._id} product={product} navigate={navigate} prefetchRoute={prefetchRoute} formatCurrency={formatCurrency} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default MegaStoreHome;
