'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AllProductsPageSkeleton, ProductsGridSkeleton } from "@/components/PageSkeletons";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { categoryMatchesSelection, getCategoryMeta, marketplaceFilterCategories } from "@/lib/marketplaceCategories";
import { getProductActivitySnapshot } from "@/lib/liveCommerce";
import { getCategoryExperience } from "@/lib/categoryExperiences";

const categories = ["All", ...marketplaceFilterCategories];

const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under UGX 50,000", min: 0, max: 50000 },
  { label: "UGX 50K – 150K", min: 50000, max: 150000 },
  { label: "UGX 150K – 500K", min: 150000, max: 500000 },
  { label: "UGX 500K – 1M", min: 500000, max: 1000000 },
  { label: "Above UGX 1M", min: 1000000, max: Infinity },
];

const formatPriceRangeLabel = (range) => {
  if (!range) return "All Prices";
  if (range.label === "All Prices") return range.label;
  return range.label.replace("UGX ", "").replace("Under ", "Under ");
};

const sortOptions = [
  { label: "Best Match", value: "relevance" },
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
  { label: "Best Discount", value: "discount" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Popular", value: "popular" },
];

const conditionOptions = [
  { label: "Any condition", value: "all" },
  { label: "New arrivals", value: "new" },
  { label: "On sale", value: "sale" },
  { label: "Flash deals", value: "flash" },
  { label: "In stock", value: "stock" },
];

const ratingOptions = [
  { label: "Any rating", value: 0 },
  { label: "4.5 and up", value: 4.5 },
  { label: "4.0 and up", value: 4 },
  { label: "3.5 and up", value: 3.5 },
];

const filterCategoryHighlights = marketplaceFilterCategories.slice(0, 8);
const mobileRailCategories = marketplaceFilterCategories;

const CategoryGlyph = ({ className = "h-4 w-4", category = "all" }) => {
  const iconPaths = {
    all: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5L21 11l-2-4.5L16 4l-2 2h-4L8 4Z",
    "beauty & cosmetics": "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
    "health & personal care": "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
    "home & living": "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
    "phones & tablets": "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
    "computers & electronics": "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
    audio: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
    "watches & wearables": "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
    accessories: "M8 7V5a2 2 0 0 1 4 0v2m4 0V5a2 2 0 0 1 4 0v2M7 7h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V7ZM4 12h3",
    appliances: "M7 4h10v16H7V4Zm2 3h6m-5 10h4m-5-6h6v4H9v-4Z",
    "baby products": "M8 10a4 4 0 0 1 8 0v2h1.5A2.5 2.5 0 0 1 20 14.5V19H4v-4.5A2.5 2.5 0 0 1 6.5 12H8v-2Zm2 7h.1M14 17h.1M10 9h4",
    "office & stationery": "M5 19l4-1 10-10-3-3L6 15l-1 4Zm10-13 3 3M5 5h6M5 9h3",
    "sports & outdoors": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
    automotive: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9",
    "books & learning": "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
    "construction & tools": "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
    smartphone: "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
    laptop: "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
    camera: "M5 8h2l1.5-2h7L16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Zm7 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    headphone: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
    earphone: "M7 10a5 5 0 0 1 10 0v4a2.5 2.5 0 0 1-2.5 2.5H9.5A2.5 2.5 0 0 1 7 14v-4Zm2 5v3m4-3v3",
    watch: "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
  };

  const normalizedCategory = String(category || "all").trim().toLowerCase();
  const pathData = iconPaths[normalizedCategory] || iconPaths.all;

  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
        <path d={pathData} stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
};

const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (image && typeof image === "object" && typeof image.src === "string") return image.src;
  return assets.upload_area;
};

const formatCount = (count) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(count) || 0));

const SelectedProductCard = ({ product, formatCurrency, navigate, prefetchRoute, addToCart }) => {
  const activity = getProductActivitySnapshot(product);
  const originalPrice = Number(product.price) || 0;
  const offerPrice = Number(product.offerPrice || product.price) || 0;
  const rating = getRatingValue(product);
  const discount = originalPrice > offerPrice ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100) : activity.priceDropPercent;

  return (
    <article
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => prefetchRoute(`/product/${product._id}`)}
      onFocus={() => prefetchRoute(`/product/${product._id}`)}
      className="group relative flex min-w-0 cursor-pointer flex-col rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      {discount > 0 ? (
        <span className="absolute left-3 top-3 z-10 rounded bg-orange-600 px-2 py-1 text-[11px] font-extrabold text-white">-{discount}%</span>
      ) : null}
      <button type="button" onClick={(event) => event.stopPropagation()} className="absolute right-3 top-3 z-10 text-gray-400 hover:text-orange-600" aria-label="Save product">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      </button>
      <span className="flex aspect-[1.08/1] items-center justify-center">
        <Image src={getProductImage(product)} alt={product.name} width={260} height={230} className="h-full w-full object-contain p-2 transition group-hover:scale-105" />
      </span>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-gray-950">{product.name}</h3>
      <p className="mt-1 line-clamp-1 text-[12px] text-gray-500">{product.description || product.category}</p>
      <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
        <p className="text-base font-extrabold text-orange-600">{formatCurrency(offerPrice)}</p>
        {originalPrice > offerPrice ? <p className="text-[11px] text-gray-400 line-through">{formatCurrency(originalPrice)}</p> : null}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[12px] text-gray-500">
        <span className="font-semibold text-orange-500">★ {rating ? rating.toFixed(1) : "New"}</span>
        <span>({activity.reviewCount || product.reviewCount || 0})</span>
        <span className="truncate">{product.sellerLocation || product.location || "Kampala"}</span>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void addToCart(product._id);
        }}
        className="mt-4 flex h-9 items-center justify-center gap-2 rounded-md border border-orange-200 text-[12px] font-extrabold text-orange-600 transition hover:bg-orange-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2M10 20h.01M17 20h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Add to Cart
      </button>
    </article>
  );
};

const MobileProductMini = ({ product, formatCurrency, navigate, addToCart }) => (
  <article onClick={() => navigate(`/product/${product._id}`)} className="relative min-w-0 rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
    <button type="button" onClick={(event) => event.stopPropagation()} className="absolute right-2 top-2 z-10 text-gray-400" aria-label="Save product">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    </button>
    <span className="flex aspect-[1.12/1] items-center justify-center">
      <Image src={getProductImage(product)} alt={product.name} width={150} height={130} className="h-full w-full object-contain p-1" />
    </span>
    <h3 className="line-clamp-2 min-h-9 text-[12px] font-bold leading-[18px] text-gray-950">{product.name}</h3>
    <p className="mt-1 text-[10px] font-semibold text-orange-500">★ {getRatingValue(product) ? getRatingValue(product).toFixed(1) : "New"}</p>
    <div className="mt-1 flex items-center justify-between gap-2">
      <p className="min-w-0 text-[13px] font-extrabold text-gray-950 [overflow-wrap:anywhere]">{formatCurrency(product.offerPrice || product.price)}</p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void addToCart(product._id);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white"
        aria-label="Add to cart"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2M10 20h.01M17 20h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  </article>
);

const normalizeSearchText = (value = "") => (
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const buildSearchTerms = (query) => {
  const baseTerms = normalizeSearchText(query).split(" ").filter(Boolean);
  const expandedTerms = new Set();

  baseTerms.forEach((term) => {
    expandedTerms.add(term);

    if (term.length > 3 && term.endsWith("es")) {
      expandedTerms.add(term.slice(0, -2));
    }

    if (term.length > 2 && term.endsWith("s")) {
      expandedTerms.add(term.slice(0, -1));
    }
  });

  return [...expandedTerms];
};

const getRatingValue = (product) => {
  const rating = product.ratingSummary?.average || product.rating || product.averageRating || 0;
  return Math.max(0, Math.min(5, Number(rating) || 0));
};

const getBrandLabel = (product) => {
  const explicitBrand = product.brand || product.manufacturer || product.sellerProfile?.storeName;

  if (explicitBrand && String(explicitBrand).trim()) {
    return String(explicitBrand).trim();
  }

  const firstNameToken = normalizeSearchText(product.name).split(" ").find((word) => word.length > 2);
  return firstNameToken ? firstNameToken[0].toUpperCase() + firstNameToken.slice(1) : "Other";
};

const getTileProducts = (products, tile, fallbackCategory, count = 4) => {
  const categoriesToMatch = Array.isArray(tile?.categories) ? tile.categories : [];
  const keywordsToMatch = Array.isArray(tile?.keywords) ? tile.keywords.map(normalizeSearchText).filter(Boolean) : [];

  const matches = products.filter((product) => {
    const productCategory = product?.category || "";
    const haystack = normalizeSearchText(`${product?.name || ""} ${product?.description || ""} ${productCategory}`);

    return categoriesToMatch.some((category) => categoryMatchesSelection(productCategory, category))
      || keywordsToMatch.some((keyword) => haystack.includes(keyword));
  });

  const fallbackMatches = matches.length
    ? matches
    : products.filter((product) => categoryMatchesSelection(product?.category, fallbackCategory));

  return fallbackMatches.slice(0, count);
};

const getDiscountPercent = (product, fallback = 6) => {
  const originalPrice = Number(product?.price) || 0;
  const offerPrice = Number(product?.offerPrice || product?.price) || 0;

  if (originalPrice > offerPrice) {
    return Math.max(1, Math.round(((originalPrice - offerPrice) / originalPrice) * 100));
  }

  return fallback;
};

const mobileSectionThemes = [
  {
    surface: "bg-[#eef9ea]",
    text: "text-[#2d7b1f]",
    iconBg: "bg-[#2f8b25]",
    addBg: "bg-[#edf8e9]",
    addText: "text-[#3c982d]",
  },
  {
    surface: "bg-[#fff3e9]",
    text: "text-[#9a3412]",
    iconBg: "bg-[#f45b12]",
    addBg: "bg-[#fff0e4]",
    addText: "text-[#f45b12]",
  },
  {
    surface: "bg-[#edf7ff]",
    text: "text-[#1d4f9a]",
    iconBg: "bg-[#248bd8]",
    addBg: "bg-[#e9f5ff]",
    addText: "text-[#248bd8]",
  },
  {
    surface: "bg-[#fff1f7]",
    text: "text-[#9d174d]",
    iconBg: "bg-[#db2777]",
    addBg: "bg-[#fff0f6]",
    addText: "text-[#db2777]",
  },
];

const supermarketMobileTiles = [
  {
    label: "Fresh Foods",
    categories: ["Home & Living"],
    keywords: ["fresh", "vegetable", "fruit", "tomato", "onion", "avocado", "spinach", "meat"],
    description: "Fresh vegetables, fruits, meat & more",
  },
  {
    label: "Food Cupboard",
    categories: ["Home & Living", "Appliances"],
    keywords: ["rice", "sugar", "oil", "coffee", "pasta", "flour", "cereal"],
    description: "Staples to keep your kitchen full",
  },
  {
    label: "Beverages",
    categories: ["Home & Living", "Appliances"],
    keywords: ["drink", "juice", "water", "soda", "coffee", "tea", "beverage"],
    description: "Refreshing drinks for every moment",
  },
  {
    label: "Household",
    categories: ["Home & Living", "Appliances"],
    keywords: ["detergent", "clean", "mop", "broom", "household", "soap"],
    description: "Cleaning and home essentials",
  },
  {
    label: "Personal Care",
    categories: ["Health & Personal Care", "Beauty & Cosmetics"],
    keywords: ["lotion", "soap", "shampoo", "deodorant", "care"],
    description: "Daily care for the family",
  },
  {
    label: "Baby Care",
    categories: ["Baby Products"],
    keywords: ["baby", "diaper", "nappy", "feeding"],
    description: "Baby care and feeding essentials",
  },
];

const supermarketRailTiles = [
  supermarketMobileTiles[1],
  supermarketMobileTiles[0],
  supermarketMobileTiles[2],
  supermarketMobileTiles[3],
  supermarketMobileTiles[4],
  supermarketMobileTiles[5],
].filter(Boolean);

const supermarketTileIcons = {
  "Food Cupboard": "🫙",
  "Fresh Foods": "🥬",
  Beverages: "🍹",
  Household: "🧴",
  "Personal Care": "🧼",
  "Baby Care": "🍼",
};

const MobileCategoryProductCard = ({ product, formatCurrency, navigate, addToCart, theme, discount, fallbackLabel = "Browse item" }) => (
  <article
    onClick={() => product?._id ? navigate(`/product/${product._id}`) : undefined}
    className={`relative min-w-0 overflow-hidden rounded-xl border border-black/5 bg-white p-1.5 shadow-[0_8px_18px_rgba(15,23,42,0.08)] min-[390px]:rounded-2xl min-[390px]:p-2 ${product?._id ? "cursor-pointer" : ""}`}
  >
    <span className={`absolute left-1.5 top-1.5 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-black text-white min-[390px]:left-2 min-[390px]:top-2 min-[390px]:px-2 min-[390px]:text-[10px] ${theme.iconBg}`}>
      -{discount}%
    </span>
    <span className="flex h-[4.75rem] items-center justify-center min-[390px]:h-[5.8rem]">
      <Image src={getProductImage(product)} alt={product?.name || fallbackLabel} width={150} height={120} className="h-full w-full object-contain p-1" />
    </span>
    <h3 className="mt-1 line-clamp-2 min-h-8 text-[10px] font-semibold leading-4 text-gray-950 min-[390px]:text-[11px]">{product?.name || fallbackLabel}</h3>
    <div className="mt-1 flex items-end justify-between gap-1">
      <p className="min-w-0 text-[10px] font-black leading-3 text-gray-950 [overflow-wrap:anywhere] min-[390px]:text-[12px]">
        {product ? formatCurrency(product.offerPrice || product.price) : "Browse"}
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (product?._id) void addToCart(product._id);
        }}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full min-[390px]:h-8 min-[390px]:w-8 ${theme.addBg} ${theme.addText}`}
        aria-label={product?._id ? "Add to cart" : "Browse category"}
      >
        <svg className="h-4 w-4 min-[390px]:h-5 min-[390px]:w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  </article>
);

const MobileCategorySection = ({ tile, products, experience, index, formatCurrency, navigate, addToCart }) => {
  const theme = mobileSectionThemes[index % mobileSectionThemes.length];
  const sectionProducts = getTileProducts(products, tile, experience.meta.value, 4);
  const heroProducts = sectionProducts.length ? sectionProducts : experience.heroProducts.slice(0, 4);
  const leadProduct = heroProducts[0] || experience.featuredProduct;
  const displayProducts = heroProducts.length ? heroProducts.slice(0, 4) : Array.from({ length: 4 }, (_, productIndex) => ({
    _placeholder: true,
    name: [tile.label, "Deal", "Pick", "Essential"][productIndex] || tile.label,
  }));

  return (
    <section className={`overflow-hidden rounded-[1.35rem] ${theme.surface} p-3 shadow-sm`}>
      <div className="grid min-h-[8.8rem] grid-cols-[minmax(0,1fr)_minmax(7rem,42%)] gap-2 min-[390px]:min-h-[9.6rem] min-[390px]:grid-cols-[minmax(0,1fr)_minmax(8rem,42%)]">
        <div className="flex min-w-0 gap-2 min-[390px]:gap-3">
          <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white min-[390px]:h-11 min-[390px]:w-11 ${theme.iconBg}`}>
            <CategoryGlyph category={tile.categories?.[0] || experience.meta.value} className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-1">
            <h2 className={`text-[22px] font-black leading-tight min-[390px]:text-2xl ${theme.text}`}>{tile.label}</h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-gray-700 min-[390px]:text-sm">{tile.description || experience.heroSubtitle}</p>
            <button
              type="button"
              onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories?.[0] || experience.meta.value)}`)}
              className={`mt-2 inline-flex items-center gap-2 text-[13px] font-black min-[390px]:mt-3 min-[390px]:text-sm ${theme.text}`}
            >
              View All
              <span aria-hidden="true">-&gt;</span>
            </button>
          </div>
        </div>
        <div className="relative flex items-end justify-end overflow-hidden">
          <Image
            src={getProductImage(leadProduct)}
            alt={leadProduct?.name || tile.label}
            width={240}
            height={180}
            className="h-28 w-full object-contain drop-shadow-xl min-[390px]:h-32"
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 min-[390px]:gap-2">
        {displayProducts.map((product, productIndex) => (
          <MobileCategoryProductCard
            key={`${tile.label}-${product?._id || productIndex}`}
            product={product?._placeholder ? null : product}
            formatCurrency={formatCurrency}
            navigate={navigate}
            addToCart={addToCart}
            theme={theme}
            discount={getDiscountPercent(product, 5 + ((index + productIndex) % 4) * 2)}
            fallbackLabel={product?.name || tile.label}
          />
        ))}
      </div>
    </section>
  );
};

const scoreFieldMatch = (value, normalizedQuery, searchTerms, weights) => {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return 0;
  }

  const compactValue = normalizedValue.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  let score = 0;

  if (compactQuery && compactValue === compactQuery) {
    score += weights.exact;
  } else if (compactQuery && compactValue.startsWith(compactQuery)) {
    score += weights.startsWith;
  } else if (compactQuery && compactValue.includes(compactQuery)) {
    score += weights.includes;
  }

  const matchedTerms = searchTerms.filter((term) => normalizedValue.includes(term)).length;

  if (matchedTerms > 0) {
    score += matchedTerms * weights.term;

    if (matchedTerms === searchTerms.length) {
      score += weights.coverageBonus;
    }
  }

  return score;
};

const getProductSearchScore = (product, query) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const searchTerms = buildSearchTerms(normalizedQuery);
  const normalizedName = normalizeSearchText(product.name);
  const nameWords = normalizedName.split(" ").filter(Boolean);

  let score = 0;

  score += scoreFieldMatch(product.name, normalizedQuery, searchTerms, {
    exact: 1400,
    startsWith: 1000,
    includes: 760,
    term: 140,
    coverageBonus: 320,
  });

  score += scoreFieldMatch(product.category, normalizedQuery, searchTerms, {
    exact: 520,
    startsWith: 360,
    includes: 240,
    term: 80,
    coverageBonus: 140,
  });

  score += scoreFieldMatch(product.description, normalizedQuery, searchTerms, {
    exact: 220,
    startsWith: 150,
    includes: 110,
    term: 32,
    coverageBonus: 70,
  });

  score += scoreFieldMatch(product.sellerLocation || product.location, normalizedQuery, searchTerms, {
    exact: 180,
    startsWith: 130,
    includes: 90,
    term: 30,
    coverageBonus: 50,
  });

  score += scoreFieldMatch(getBrandLabel(product), normalizedQuery, searchTerms, {
    exact: 260,
    startsWith: 190,
    includes: 130,
    term: 44,
    coverageBonus: 80,
  });

  const categoryMeta = getCategoryMeta(product.category);

  score += scoreFieldMatch(categoryMeta.label, normalizedQuery, searchTerms, {
    exact: 480,
    startsWith: 320,
    includes: 220,
    term: 70,
    coverageBonus: 120,
  });

  score += scoreFieldMatch(categoryMeta.aliases?.join(" "), normalizedQuery, searchTerms, {
    exact: 300,
    startsWith: 220,
    includes: 160,
    term: 56,
    coverageBonus: 100,
  });

  score += scoreFieldMatch(product.sellerProfile?.name, normalizedQuery, searchTerms, {
    exact: 420,
    startsWith: 300,
    includes: 200,
    term: 64,
    coverageBonus: 120,
  });

  if (searchTerms.length > 1 && searchTerms.every((term) => nameWords.some((word) => word.startsWith(term)))) {
    score += 260;
  }

  if (normalizedName.includes(normalizedQuery) && product.name.length <= 40) {
    score += 60;
  }

  return score;
};

function AllProductsInner() {
  const { products, loadingProducts, navigate, prefetchRoute, formatCurrency, addToCart } = useAppContext();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";
  const initialSeller = searchParams.get("seller") || "";
  const initialBrand = searchParams.get("brand") || "all";
  const initialFilter = searchParams.get("filter");
  const initialSort = searchParams.get("sort");

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState(initialFilter === "flash" ? "discount" : sortOptions.some((option) => option.value === initialSort) ? initialSort : "default");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSeller, setSelectedSeller] = useState(initialSeller);
  const [selectedCondition, setSelectedCondition] = useState(initialFilter === "flash" ? "flash" : "all");
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const hasActiveSearch = deferredSearchQuery.trim().length > 0;
  const effectiveSortBy = hasActiveSearch
    ? (sortBy === "default" ? "relevance" : sortBy)
    : (sortBy === "relevance" ? "default" : sortBy);

  useEffect(() => {
    const cat = searchParams.get("category");
    const search = searchParams.get("search");
    const seller = searchParams.get("seller");
    const brand = searchParams.get("brand");
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    setSelectedCategory(cat || "All");
    setSearchQuery(search || "");
    setSelectedSeller(seller || "");
    setSelectedBrand(brand || "all");
    setSelectedCondition(filter === "flash" ? "flash" : "all");
    setSortBy(filter === "flash" ? "discount" : sortOptions.some((option) => option.value === sort) ? sort : "default");
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPriceRange, selectedCondition, selectedBrand, selectedRating, searchQuery, selectedSeller, effectiveSortBy]);

  const brandOptions = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      const brand = getBrandLabel(product);
      acc.set(brand, (acc.get(brand) || 0) + 1);
      return acc;
    }, new Map());

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 10)
      .map(([label, count]) => ({ label, value: label, count }));
  }, [products]);

  const filterAndSort = () => {
    let filtered = products.map((product) => ({
      product,
      searchScore: hasActiveSearch ? getProductSearchScore(product, deferredSearchQuery) : 0,
    }));

    if (hasActiveSearch) {
      filtered = filtered.filter(({ searchScore }) => searchScore > 0);
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(({ product }) => categoryMatchesSelection(product.category, selectedCategory));
    }

    if (selectedSeller) {
      filtered = filtered.filter(({ product }) => product.userId === selectedSeller);
    }

    const range = priceRanges[selectedPriceRange];
    filtered = filtered.filter(({ product }) => product.offerPrice >= range.min && product.offerPrice <= range.max);

    if (selectedCondition !== "all") {
      filtered = filtered.filter(({ product }) => {
        const activity = getProductActivitySnapshot(product);
        const stock = Number(product.stock);

        if (selectedCondition === "new") return activity.isNewArrival;
        if (selectedCondition === "sale") return activity.hasDiscount;
        if (selectedCondition === "flash") return activity.flashDealActive;
        if (selectedCondition === "stock") return !Number.isFinite(stock) || stock > 0;
        return true;
      });
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter(({ product }) => getBrandLabel(product) === selectedBrand);
    }

    if (selectedRating > 0) {
      filtered = filtered.filter(({ product }) => getRatingValue(product) >= selectedRating);
    }

    if (effectiveSortBy === "relevance") {
      filtered.sort((a, b) => (
        b.searchScore - a.searchScore ||
        (b.product.date || 0) - (a.product.date || 0) ||
        a.product.offerPrice - b.product.offerPrice
      ));
    } else if (effectiveSortBy === "price_asc") {
      filtered.sort((a, b) => a.product.offerPrice - b.product.offerPrice);
    } else if (effectiveSortBy === "price_desc") {
      filtered.sort((a, b) => b.product.offerPrice - a.product.offerPrice);
    } else if (effectiveSortBy === "newest") {
      filtered.sort((a, b) => (b.product.date || 0) - (a.product.date || 0));
    } else if (effectiveSortBy === "discount") {
      filtered.sort((a, b) => {
        const da = a.product.price > 0 ? (a.product.price - a.product.offerPrice) / a.product.price : 0;
        const db = b.product.price > 0 ? (b.product.price - b.product.offerPrice) / b.product.price : 0;
        return db - da;
      });
    } else if (effectiveSortBy === "rating") {
      filtered.sort((a, b) => getRatingValue(b.product) - getRatingValue(a.product));
    } else if (effectiveSortBy === "popular") {
      filtered.sort((a, b) => (Number(b.product.likesCount) || 0) - (Number(a.product.likesCount) || 0));
    }

    return filtered.map(({ product }) => product);
  };

  const handlePriceRangeChange = (nextIndex) => {
    const normalizedIndex = Math.max(0, Math.min(priceRanges.length - 1, Number(nextIndex) || 0));
    setSelectedPriceRange(normalizedIndex);
  };

  const filteredProducts = filterAndSort();
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);
  const sellerReferenceProduct = selectedSeller ? products.find((product) => product.userId === selectedSeller) : null;
  const sellerFilterLabel = sellerReferenceProduct?.sellerProfile?.name || sellerReferenceProduct?.sellerLocation || sellerReferenceProduct?.location || "Seller collection";
  const selectedCategoryMeta = selectedCategory !== "All" ? getCategoryMeta(selectedCategory) : null;
  const resultsLabel = `${filteredProducts.length} result${filteredProducts.length === 1 ? "" : "s"}`;
  const compactHeading = hasActiveSearch || selectedBrand !== "all" || selectedSeller || selectedCondition !== "all" || selectedPriceRange !== 0 || selectedRating > 0;
  const selectedCategoryMode = selectedCategory !== "All" && !hasActiveSearch && !selectedSeller;
  const selectedCategoryPool = useMemo(() => (
    selectedCategory === "All"
      ? products
      : products.filter((product) => categoryMatchesSelection(product.category, selectedCategory))
  ), [products, selectedCategory]);
  const selectedCategoryExperience = useMemo(() => (
    getCategoryExperience(selectedCategoryPool.length ? selectedCategoryPool : products, selectedCategory)
  ), [selectedCategoryPool, products, selectedCategory]);
  const useSupermarketMobileDisplay = selectedCategory === "Home & Living";
  const mobileDisplayTiles = useSupermarketMobileDisplay
    ? supermarketMobileTiles
    : selectedCategoryExperience.tiles;
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange(0);
    setSortBy("default");
    setSearchQuery("");
    setSelectedSeller("");
    setSelectedCondition("all");
    setSelectedBrand("all");
    setSelectedRating(0);
  };

  const DropdownFilter = ({ label, valueLabel, children }) => (
    <details className="group relative">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-800 shadow-sm transition hover:border-orange-300 hover:text-orange-600 [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        {valueLabel ? <span className="max-w-20 truncate rounded-full bg-orange-50 px-1.5 py-0 text-[9px] text-orange-700">{valueLabel}</span> : null}
        <span className="text-gray-400 transition group-open:rotate-180 text-xs">⌄</span>
      </summary>
      <div className="absolute left-0 top-9 z-40 w-48 rounded-md border border-gray-200 bg-white p-1.5 shadow-xl">
        {children}
      </div>
    </details>
  );

  const FilterOption = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded px-2 py-1.5 text-left text-[11px] transition ${
        active ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm font-bold text-gray-950">Electronics & Gadgets</p>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-gray-950">Related categories</p>
        <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full border-l-2 px-2 py-1.5 text-left text-xs transition ${
                selectedCategory === cat ? "border-orange-600 bg-orange-50 font-semibold text-orange-600" : "border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat === "All" ? cat : getCategoryMeta(cat).label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-xs font-bold text-gray-950">Price Range</p>
        <div className="space-y-1">
          {priceRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => setSelectedPriceRange(index)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition ${
                selectedPriceRange === index ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-xs font-bold text-gray-950">Condition</p>
        <div className="space-y-1">
          {conditionOptions.map((condition) => (
            <button
              key={condition.value}
              onClick={() => setSelectedCondition(condition.value)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition ${
                selectedCondition === condition.value ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {condition.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-xs font-bold text-gray-950">Brand</p>
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedBrand("all")}
            className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition ${
              selectedBrand === "all" ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All brands
          </button>
          {brandOptions.map((brand) => (
            <button
              key={brand.value}
              onClick={() => setSelectedBrand(brand.value)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                selectedBrand === brand.value ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{brand.label}</span>
              <span className="text-[10px] opacity-70">{brand.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-xs font-bold text-gray-950">Rating</p>
        <div className="space-y-1">
          {ratingOptions.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition ${
                selectedRating === rating.value ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {rating.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={resetFilters}
        className="w-full rounded-md border border-orange-500 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
      >
        Clear All Filters
      </button>
    </div>
  );

  const SelectedFilterPanel = () => (
    <aside className="hidden w-[17.5rem] shrink-0 self-start lg:block">
      <div className="sticky top-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <h2 className="text-xs font-extrabold text-gray-950">Filters</h2>
          <button type="button" onClick={resetFilters} className="text-[10px] font-bold text-gray-700">Clear</button>
        </div>

        <section className="border-b border-gray-100 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-gray-950">Category</h3>
            <span className="text-gray-400 text-xs">⌃</span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="flex w-full items-center justify-between gap-2 text-left text-[10px] text-gray-700"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={`h-3 w-3 rounded-full border ${selectedCategory === "All" ? "border-orange-600 bg-orange-600 ring-1 ring-orange-100" : "border-gray-300"}`} />
                <span className="truncate">{`All ${selectedCategoryExperience.meta.label}`}</span>
              </span>
              <span className="text-[9px] text-gray-500">{formatCount(selectedCategoryPool.length)}</span>
            </button>
            {selectedCategoryExperience.tiles.slice(0, 6).map((tile) => (
              <button
                key={`filter-${tile.label}`}
                type="button"
                onClick={() => setSelectedCategory(tile.categories[0] || selectedCategoryExperience.meta.value)}
                className="flex w-full items-center justify-between gap-2 text-left text-[10px] text-gray-700"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-full border ${selectedCategory === (tile.categories[0] || selectedCategoryExperience.meta.value) ? "border-orange-600 bg-orange-600 ring-1 ring-orange-100" : "border-gray-300"}`} />
                  <span className="truncate">{tile.label}</span>
                </span>
                <span className="text-[9px] text-gray-500">{formatCount(tile.count)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-gray-950">Price (UGX)</h3>
            <span className="text-gray-400 text-xs">⌃</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handlePriceRangeChange(Math.max(0, selectedPriceRange - 1))}
              className="min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-left text-[10px] text-gray-600 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span className="block text-[9px] uppercase tracking-wide text-gray-400">Lower</span>
              <span className="block truncate font-semibold text-gray-800">{formatPriceRangeLabel(priceRanges[Math.max(0, selectedPriceRange - 1)])}</span>
            </button>
            <button
              type="button"
              onClick={() => handlePriceRangeChange(Math.min(priceRanges.length - 1, selectedPriceRange + 1))}
              className="min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-left text-[10px] text-gray-600 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span className="block text-[9px] uppercase tracking-wide text-gray-400">Selected</span>
              <span className="block truncate font-semibold text-gray-800">{formatPriceRangeLabel(priceRanges[selectedPriceRange])}</span>
            </button>
          </div>
          <div className="mt-3">
            <input
              type="range"
              min="0"
              max={priceRanges.length - 1}
              step="1"
              value={selectedPriceRange}
              onChange={(event) => handlePriceRangeChange(event.target.value)}
              className="w-full accent-orange-600"
              aria-label="Price range slider"
            />
          </div>
          <div className="mt-3 space-y-0.5 rounded-2xl border border-gray-100 bg-gray-50 p-1.5 text-[10px]">
            {priceRanges.map((range, index) => (
              <button
                key={range.label}
                type="button"
                onClick={() => handlePriceRangeChange(index)}
                className={`w-full rounded-xl px-2 py-1.5 text-left transition ${selectedPriceRange === index ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-orange-50"}`}
              >
                {formatPriceRangeLabel(range)}
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3 py-3">
          <h3 className="mb-2 text-[11px] font-extrabold text-gray-950">Brands</h3>
          <div className="mb-2 flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1.5 text-[10px] text-gray-400">
            <span>⌕</span>
            <span>Search brands</span>
          </div>
          <div className="space-y-1.5">
            {brandOptions.slice(0, 5).map((brand) => (
              <button key={brand.value} type="button" onClick={() => setSelectedBrand(brand.value)} className="flex w-full items-center justify-between text-[10px] text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded border ${selectedBrand === brand.value ? "border-orange-600 bg-orange-600" : "border-gray-300"}`} />
                  {brand.label}
                </span>
                <span className="text-[9px] text-gray-500">{brand.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3 py-3">
          <h3 className="mb-2 text-[11px] font-extrabold text-gray-950">Condition</h3>
          <div className="space-y-1.5">
            {conditionOptions.slice(1, 3).map((condition) => (
              <button key={condition.value} type="button" onClick={() => setSelectedCondition(condition.value)} className="flex w-full items-center justify-between text-[10px] text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded border ${selectedCondition === condition.value ? "border-orange-600 bg-orange-600" : "border-gray-300"}`} />
                  {condition.value === "new" ? "Brand New" : "Used"}
                </span>
                <span className="text-[9px] text-gray-500">{condition.value === "new" ? "3,124" : "1,112"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-3 py-3">
          <h3 className="mb-2 text-[11px] font-extrabold text-gray-950">Ratings</h3>
          <div className="space-y-1.5">
            {ratingOptions.slice(1).map((rating) => (
              <button key={rating.value} type="button" onClick={() => setSelectedRating(rating.value)} className="flex w-full items-center justify-between text-[10px] text-gray-700">
                <span className="text-orange-500">★★★★★ <span className="text-gray-500">& up</span></span>
                <span className="text-[9px] text-gray-500">{formatCount(Math.round(rating.value * 900))}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );

  if (selectedCategoryMode) {
    const promoCards = [
      {
        title: "Limited-time offers",
        description: `Hand-picked savings in ${selectedCategoryExperience.meta.label.toLowerCase()}.`,
        tone: "from-orange-500 to-red-500",
      },
      {
        title: "Bundle savings",
        description: "Pair related items and save more at checkout.",
        tone: "from-blue-600 to-cyan-500",
      },
      {
        title: "Top-rated picks",
        description: "Popular products from trusted sellers and stores.",
        tone: "from-violet-600 to-fuchsia-500",
      },
    ];

    const compactGroups = [
      ["TRENDING NOW", filteredProducts.slice(0, 4)],
      ["BEST SELLERS", filteredProducts.slice(4, 8)],
      ["NEW ARRIVALS", filteredProducts.slice(8, 12)],
    ];

    return (
      <>
        <Navbar hideMobileHeader />
        <main className="min-h-screen bg-[#f5f7fb] pb-16">
          <div className="mx-auto max-w-[1600px] px-3 pt-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-6">
              <SelectedFilterPanel />

              <section className="min-w-0">
                <div className="lg:hidden">
                  <div className="rounded-full border border-gray-200 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center gap-3">
                      <svg className="h-6 w-6 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products, brands..."
                        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMobileFilters(true)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm"
                        aria-label="Open filters"
                      >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 7h8m3 0h3M5 17h3m3 0h8M11 5v4m0 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => navigate("/all-products")}
                      className="flex h-[6.1rem] min-w-[5.9rem] flex-col items-center justify-center gap-2 rounded-2xl border border-orange-500 bg-white px-2 text-center text-[12px] font-black text-orange-700 shadow-sm"
                    >
                      <span className="text-3xl" aria-hidden="true">🛒</span>
                      <span>All</span>
                    </button>
                    {useSupermarketMobileDisplay ? (
                      supermarketRailTiles.map((tile) => (
                        <button
                          key={`mobile-supermarket-rail-${tile.label}`}
                          type="button"
                          onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories?.[0] || selectedCategory)}`)}
                          className="flex h-[6.1rem] min-w-[6.7rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-100 bg-white px-2 text-center text-gray-900 shadow-sm"
                        >
                          <span className="text-3xl leading-none" aria-hidden="true">{supermarketTileIcons[tile.label] || "🛍️"}</span>
                          <span className="line-clamp-2 text-[12px] font-black leading-4">{tile.label}</span>
                        </button>
                      ))
                    ) : (
                      mobileRailCategories.slice(0, 7).map((category) => {
                        const meta = getCategoryMeta(category);
                        const active = selectedCategory === category;

                        return (
                          <button
                            key={`mobile-selected-rail-${category}`}
                            type="button"
                            onClick={() => navigate(`/all-products?category=${encodeURIComponent(category)}`)}
                            className={`flex h-[6.1rem] min-w-[6.7rem] flex-col items-center justify-center gap-1.5 rounded-2xl border bg-white px-2 text-center shadow-sm ${
                              active ? "border-orange-500 text-orange-700" : "border-gray-100 text-gray-900"
                            }`}
                          >
                            <span className="text-3xl leading-none" aria-hidden="true">{meta.icon}</span>
                            <span className="line-clamp-2 text-[12px] font-black leading-4">{meta.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    {mobileDisplayTiles.slice(0, useSupermarketMobileDisplay ? 3 : 4).map((tile, index) => (
                      <MobileCategorySection
                        key={`mobile-display-${tile.label}`}
                        tile={tile}
                        products={filteredProducts.length ? filteredProducts : selectedCategoryPool}
                        experience={selectedCategoryExperience}
                        index={index}
                        formatCurrency={formatCurrency}
                        navigate={navigate}
                        addToCart={addToCart}
                      />
                    ))}
                  </div>

                  <section className="mt-5 overflow-hidden rounded-[1.35rem] bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-black text-gray-950">{useSupermarketMobileDisplay ? "Supermarket Picks" : `${selectedCategoryExperience.meta.label} Picks`}</h2>
                        <p className="text-[11px] font-semibold text-gray-500">{formatCount(filteredProducts.length)} products available</p>
                      </div>
                      <button type="button" onClick={() => setSelectedCondition("flash")} className="text-[12px] font-black text-orange-600">
                        View All -&gt;
                      </button>
                    </div>
                    {loadingProducts ? (
                      <ProductsGridSkeleton showHeader={false} />
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5 min-[390px]:gap-2">
                        {filteredProducts.slice(0, 8).map((product, index) => {
                          const theme = mobileSectionThemes[index % mobileSectionThemes.length];

                          return (
                            <MobileCategoryProductCard
                              key={`mobile-picks-${product._id || index}`}
                              product={product}
                              formatCurrency={formatCurrency}
                              navigate={navigate}
                              addToCart={addToCart}
                              theme={theme}
                              discount={getDiscountPercent(product, 6 + (index % 3) * 2)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {showMobileFilters && (
                    <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setShowMobileFilters(false)}>
                      <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-lg font-black text-gray-950">Filters</p>
                          <button type="button" onClick={() => setShowMobileFilters(false)} className="text-2xl font-bold text-gray-400">x</button>
                        </div>
                        <FilterPanel />
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden lg:block">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)] lg:items-center">
                    <div className="rounded-[2.2rem] border border-gray-100 bg-white p-8 shadow-sm">
                      <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">
                        {selectedCategoryExperience.heroBadge}
                      </div>
                      <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-950">
                        {selectedCategoryExperience.meta.label}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                        {selectedCategoryExperience.heroSubtitle}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button type="button" onClick={() => setSelectedCondition("flash")} className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm">
                          View hot deals
                        </button>
                        <button type="button" onClick={() => setSelectedCategory("All")} className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700">
                          Reset category
                        </button>
                      </div>
                    </div>

                    <div className={`overflow-hidden rounded-[2.2rem] bg-gradient-to-br ${selectedCategoryExperience.heroTint} p-6 text-white shadow-sm`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Featured category</p>
                          <p className="mt-1 text-3xl font-black">{selectedCategoryExperience.meta.label}</p>
                        </div>
                        <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
                          {formatCount(filteredProducts.length)} items
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-end gap-3">
                        {selectedCategoryExperience.heroProducts.slice(0, 4).map((product, index) => (
                          <Image
                            key={`${product?._id || index}-${index}`}
                            src={getProductImage(product)}
                            alt={product?.name || selectedCategoryExperience.meta.label}
                            width={120}
                            height={120}
                            className={`h-28 w-28 object-contain drop-shadow-2xl ${index === 0 ? "rotate-[-10deg]" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
                    {selectedCategoryExperience.tiles.map((tile) => (
                      <button
                        key={`desktop-chip-${tile.label}`}
                        type="button"
                        onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories[0] || selectedCategoryExperience.meta.value)}`)}
                        className="flex min-h-[5rem] min-w-[7.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-gray-100 bg-white px-3 text-center shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
                      >
                        <span className="text-[11px] font-semibold text-gray-900">{tile.label}</span>
                        <span className="text-[10px] text-gray-500">{formatCount(tile.count)} items</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedCategoryExperience.tiles.slice(0, 6).map((tile) => (
                      <button
                        key={`desktop-tile-${tile.label}`}
                        type="button"
                        onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories[0] || selectedCategoryExperience.meta.value)}`)}
                        className="group rounded-[1.6rem] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                      >
                        <span className="flex items-center justify-end">
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
                            {tile.count ? `${tile.count} items` : "Browse"}
                          </span>
                        </span>
                        <span className="mt-2 flex h-28 items-center justify-center">
                          {tile.product ? (
                            <Image src={getProductImage(tile.product)} alt={tile.label} width={160} height={140} className="h-full w-full object-contain transition group-hover:scale-105" />
                          ) : null}
                        </span>
                        <p className="mt-2 text-base font-bold text-gray-950">{tile.label}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-500">{tile.description || "Tap to explore"}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-3">
                    {promoCards.map((card) => (
                      <button
                        key={`promo-${card.title}`}
                        type="button"
                        onClick={() => setSelectedCondition("flash")}
                        className={`rounded-[1.6rem] bg-gradient-to-br ${card.tone} p-5 text-left text-white shadow-sm`}
                      >
                        <p className="text-sm font-black uppercase tracking-[0.14em]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/85">{card.description}</p>
                        <span className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">Shop now →</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-950">Flash deals</p>
                          <p className="text-xs text-gray-500">High-converting products for this category.</p>
                        </div>
                        <button type="button" onClick={() => setSelectedCondition("flash")} className="text-sm font-semibold text-orange-600">
                          View all →
                        </button>
                      </div>
                      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
                        {filteredProducts.slice(0, 5).map((product, index) => (
                          <button key={`desktop-flash-${product._id}`} type="button" onClick={() => navigate(`/product/${product._id}`)} className="rounded-[1.2rem] border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-200">
                            <span className="inline-flex rounded-full bg-orange-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              -{Math.max(5, 9 + index * 4)}%
                            </span>
                            <Image src={getProductImage(product)} alt={product.name} width={140} height={110} className="mt-2 h-24 w-full object-contain" />
                            <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-4 text-gray-900">{product.name}</p>
                            <p className="mt-1 text-[12px] font-black text-orange-600">{formatCurrency(product.offerPrice || product.price)}</p>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      {[
                        selectedCategoryExperience.tiles.slice(0, 2),
                        selectedCategoryExperience.tiles.slice(2, 4),
                        selectedCategoryExperience.tiles.slice(4, 6),
                      ].map((row, index) => (
                        <div key={`brand-row-${index}`} className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-950">
                              {["Featured", "Popular", "Latest"][index]}
                            </p>
                            <span className="text-xs text-gray-400">View all</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {row.map((tile) => (
                              <button
                                key={`side-${tile.label}`}
                                type="button"
                                onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories[0] || selectedCategoryExperience.meta.value)}`)}
                                className="rounded-[1.15rem] border border-gray-100 bg-gray-50 p-3 text-left"
                              >
                                <p className="line-clamp-1 text-sm font-semibold text-gray-950">{tile.label}</p>
                                <p className="mt-1 text-[11px] text-gray-500">{formatCount(tile.count)} items</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>

                  <div className="mt-6 space-y-6">
                    {compactGroups.map(([title, items]) => items.length ? (
                      <section key={`desktop-${title}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="text-sm font-bold text-gray-950">{title}</h2>
                          <button type="button" onClick={() => setSelectedCondition("flash")} className="text-sm font-semibold text-orange-600">
                            View all →
                          </button>
                        </div>
                        {loadingProducts ? (
                          <ProductsGridSkeleton showHeader={false} />
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                            {items.map((product) => (
                              <SelectedProductCard
                                key={product._id}
                                product={product}
                                formatCurrency={formatCurrency}
                                navigate={navigate}
                                prefetchRoute={prefetchRoute}
                                addToCart={addToCart}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ) : null)}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mb-4 text-xs text-gray-500">
          {hasActiveSearch ? (
            <span><span className="font-semibold text-gray-950">Search results</span></span>
          ) : (
            <span>Home <span className="mx-2 text-gray-400">&gt;</span> Electronics <span className="mx-2 text-gray-400">&gt;</span> <span className="font-semibold text-gray-950">{selectedCategoryMeta?.label || "All Products"}</span></span>
          )}
        </div>

        <section className="mb-4 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                selectedCategory === "All" ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
              }`}
            >
              <CategoryGlyph category="all" className="h-3.5 w-3.5 shrink-0" />
              <span>All products</span>
            </button>
            {filterCategoryHighlights.map((category) => {
              const meta = getCategoryMeta(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                    selectedCategory === category ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                  }`}
                >
                  <CategoryGlyph category={meta.label} className="h-3.5 w-3.5 shrink-0" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xl font-bold text-gray-950">{compactHeading ? resultsLabel : selectedCategoryMeta?.label || "All Products"}</p>
            {!compactHeading ? (
              <p className="mt-0.5 text-xs text-gray-500">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
                {selectedSeller ? ` from ${sellerFilterLabel}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="hidden text-xs font-medium text-gray-700 sm:block">Sort:</label>
            <select
              value={effectiveSortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500 sm:w-auto"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs md:hidden"
            >
              Filters
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-1.5 border-y border-gray-200 bg-gray-50 px-2 py-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <DropdownFilter
              label="Condition"
              valueLabel={selectedCondition !== "all" ? conditionOptions.find((option) => option.value === selectedCondition)?.label : ""}
            >
              {conditionOptions.map((condition) => (
                <FilterOption
                  key={condition.value}
                  active={selectedCondition === condition.value}
                  onClick={() => setSelectedCondition(condition.value)}
                >
                  {condition.label}
                </FilterOption>
              ))}
            </DropdownFilter>
            <DropdownFilter
              label="Price"
              valueLabel={selectedPriceRange !== 0 ? priceRanges[selectedPriceRange].label.replace("UGX ", "") : ""}
            >
              {priceRanges.map((range, index) => (
                <FilterOption
                  key={range.label}
                  active={selectedPriceRange === index}
                  onClick={() => setSelectedPriceRange(index)}
                >
                  {range.label}
                </FilterOption>
              ))}
            </DropdownFilter>
            <DropdownFilter label="Brand" valueLabel={selectedBrand !== "all" ? selectedBrand : ""}>
              <FilterOption active={selectedBrand === "all"} onClick={() => setSelectedBrand("all")}>
                All brands
              </FilterOption>
              {brandOptions.map((brand) => (
                <FilterOption key={brand.value} active={selectedBrand === brand.value} onClick={() => setSelectedBrand(brand.value)}>
                  <span className="flex items-center justify-between gap-3">
                    <span>{brand.label}</span>
                    <span className="text-xs text-gray-400">{brand.count}</span>
                  </span>
                </FilterOption>
              ))}
            </DropdownFilter>
            <DropdownFilter
              label="Rating"
              valueLabel={selectedRating ? `${selectedRating}+` : ""}
            >
              {ratingOptions.map((rating) => (
                <FilterOption
                  key={rating.value}
                  active={selectedRating === rating.value}
                  onClick={() => setSelectedRating(rating.value)}
                >
                  {rating.label}
                </FilterOption>
              ))}
            </DropdownFilter>
            {hasActiveSearch ? (
              <button
                type="button"
                onClick={() => setSortBy("relevance")}
                className={`h-8 rounded-full border px-3 text-[11px] font-semibold shadow-sm transition ${
                  effectiveSortBy === "relevance" ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                }`}
              >
                Relevance
              </button>
            ) : null}
          </div>
          <div className="hidden items-center gap-1.5 lg:flex">
            <span className="text-xs text-gray-600">Sort:</span>
            <select
              value={effectiveSortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active tags */}
        {(selectedCategory !== "All" || selectedPriceRange !== 0 || searchQuery || selectedSeller || selectedCondition !== "all" || selectedBrand !== "all" || selectedRating > 0) && (
          <div className="mb-5 flex flex-wrap gap-2">
            {selectedCategory !== "All" && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {selectedCategoryMeta?.label || selectedCategory}
                <button onClick={() => setSelectedCategory("All")} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {selectedPriceRange !== 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {priceRanges[selectedPriceRange].label}
                <button onClick={() => setSelectedPriceRange(0)} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {selectedCondition !== "all" && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {conditionOptions.find((option) => option.value === selectedCondition)?.label}
                <button onClick={() => setSelectedCondition("all")} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {selectedBrand !== "all" && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {selectedBrand}
                <button onClick={() => setSelectedBrand("all")} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {selectedRating > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {selectedRating}+ rating
                <button onClick={() => setSelectedRating(0)} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
            {selectedSeller && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {sellerFilterLabel}
                <button onClick={() => setSelectedSeller("")} className="ml-1 font-bold hover:text-orange-900">x</button>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6 md:flex-row md:gap-7">
          {/* Desktop sidebar */}
          <aside className="hidden w-72 flex-shrink-0 md:block">
            <div className="sticky top-36 rounded-lg border border-gray-200 bg-white p-5">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setShowMobileFilters(false)}>
              <div className="absolute bottom-0 right-0 top-0 w-full max-w-[18rem] overflow-y-auto bg-white p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <p className="font-bold text-lg">Filters</p>
                  <button onClick={() => setShowMobileFilters(false)} className="text-2xl text-gray-400">x</button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1">
            {loadingProducts ? (
              <ProductsGridSkeleton showHeader={false} />
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400">
                <span className="mb-4 text-5xl">?</span>
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-8 min-[480px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {pagedProducts.map((product, index) => (
                  <ProductCard key={`${product._id || index}-${currentPage}`} product={product} />
                ))}
              </div>
            )}
            {filteredProducts.length > 0 && totalPages > 1 ? (
              <div className="mb-14 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      currentPage === page ? "bg-orange-600 text-white" : "border border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            ) : null}
            {filteredProducts.length > 0 ? (
              <p className="mb-8 text-center text-[11px] text-gray-400">
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredProducts.length)} of {filteredProducts.length} items
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

const AllProducts = () => (
  <Suspense fallback={<AllProductsPageSkeleton />}>
    <AllProductsInner />
  </Suspense>
);

export default AllProducts;
