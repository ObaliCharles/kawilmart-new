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

const categories = ["All", ...marketplaceFilterCategories];

const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under UGX 50,000", min: 0, max: 50000 },
  { label: "UGX 50K – 150K", min: 50000, max: 150000 },
  { label: "UGX 150K – 500K", min: 150000, max: 500000 },
  { label: "UGX 500K – 1M", min: 500000, max: 1000000 },
  { label: "Above UGX 1M", min: 1000000, max: Infinity },
];

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

const legacyRailCategories = new Set(["Smartphone", "Laptop", "Camera", "Headphone", "Earphone", "Watch"]);
const primaryPanelCategories = marketplaceFilterCategories.filter((category) => !legacyRailCategories.has(category));
const filterCategoryHighlights = primaryPanelCategories.slice(0, 8);
const mobileRailCategories = primaryPanelCategories;

const categoryIconPaths = {
  All: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  Fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
  "Beauty & Cosmetics": "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
  "Health & Personal Care": "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
  "Home & Living": "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  "Phones & Tablets": "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  "Computers & Electronics": "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
  Audio: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
  "Watches & Wearables": "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
  Accessories: "M7 7V5a2 2 0 0 1 4 0v2m4 0V5a2 2 0 0 1 4 0v2M7 7h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V7Zm-3 5h3",
  Appliances: "M7 4h10v16H7V4Zm2 3h6m-5 10h4m-5-6h6v4H9v-4Z",
  "Baby Products": "M6 10h12l1.2 6.2a2 2 0 0 1-1.9 2.4H6.7a2 2 0 0 1-1.9-2.4L6 10Zm3 3h.01M15 13h.01M9 7l1-2h4l1 2",
  "Office & Stationery": "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
  "Sports & Outdoors": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  Automotive: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9",
  "Books & Learning": "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
  "Construction & Tools": "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
};

const CategoryGlyph = ({ category = "All", className = "h-4 w-4" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d={categoryIconPaths[category] || categoryIconPaths.All} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
  </svg>
);

const gridIconPath = "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z";

const selectedCategoryTiles = [
  ["All", ["All"], ["all"]],
  ["Smartphones", ["Phones & Tablets"], ["phone", "smartphone", "iphone", "galaxy"]],
  ["Laptops", ["Computers & Electronics"], ["laptop", "macbook", "thinkpad"]],
  ["Desktops", ["Computers & Electronics"], ["desktop", "pc", "tower"]],
  ["Monitors", ["Computers & Electronics"], ["monitor", "display"]],
  ["TV & Video", ["Computers & Electronics", "Appliances"], ["tv", "television"]],
  ["Audio", ["Audio"], ["headphone", "speaker", "earbud"]],
  ["Wearables", ["Watches & Wearables"], ["watch", "wearable"]],
  ["Accessories", ["Accessories"], ["charger", "cable", "adapter"]],
];

const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (image && typeof image === "object" && typeof image.src === "string") return image.src;
  return assets.upload_area;
};

const formatCount = (count) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(count) || 0));

const normalizeProductText = (product) => (
  `${normalizeSearchText(product?.name)} ${normalizeSearchText(product?.description)} ${normalizeSearchText(product?.category)}`
);

const findTileProduct = (products, categoriesForTile, keywords) => (
  products.find((product) => (
    categoriesForTile.some((category) => category === "All" || categoryMatchesSelection(product.category, category))
    || keywords.some((keyword) => normalizeProductText(product).includes(normalizeSearchText(keyword)))
  )) || products[0] || null
);

const SelectedCategoryTile = ({ label, product, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-[5.15rem] min-w-[6.6rem] flex-col items-center justify-center gap-1.5 rounded-2xl border bg-white px-2.5 py-2 text-center shadow-sm transition ${
      active ? "border-orange-500 text-orange-600 ring-1 ring-orange-100" : "border-gray-100 text-gray-950 hover:border-orange-200"
    }`}
  >
    {label === "All" ? (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={gridIconPath} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <span className="flex h-8 w-12 items-center justify-center">
        {product ? (
          <Image src={getProductImage(product)} alt={label} width={72} height={48} className="h-full w-full object-contain" />
        ) : (
          <CategoryGlyph category={label} className="h-5 w-5" />
        )}
      </span>
    )}
    <span className="line-clamp-1 text-[11px] font-extrabold leading-4">{label}</span>
  </button>
);

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

const MobileRailButton = ({ label, category = label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[3.55rem] w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-center transition min-[380px]:min-h-[3.9rem] min-[380px]:px-1.5 ${
      active ? "bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-sm" : "bg-white text-gray-950 hover:bg-orange-50 hover:text-orange-600"
    }`}
  >
    <CategoryGlyph category={category} className="h-4 w-4 min-[380px]:h-[1.05rem] min-[380px]:w-[1.05rem]" />
    <span className="line-clamp-1 text-[8.5px] font-extrabold leading-[10px] min-[380px]:text-[9.5px]">{label}</span>
  </button>
);

const MobileFeatureTile = ({ label, product, tone, onClick }) => (
  <button type="button" onClick={onClick} className={`relative min-h-[6.8rem] overflow-hidden rounded-lg bg-gradient-to-br ${tone} p-3 text-left text-white shadow-sm`}>
    <span className="relative z-10 block max-w-[6.5rem] text-sm font-extrabold leading-5">{label}</span>
    <span className="relative z-10 mt-1 block max-w-[6rem] text-[10px] font-semibold leading-4 text-white/90">Shop now</span>
    <span className="absolute bottom-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-orange-600">›</span>
    {product ? <Image src={getProductImage(product)} alt={label} width={120} height={100} className="absolute bottom-0 right-0 max-h-24 w-[6.2rem] object-contain drop-shadow-lg" /> : null}
  </button>
);

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

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedRating, setSelectedRating] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  }, [searchParams]);

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

  const filteredProducts = filterAndSort();
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
  const selectedTileData = useMemo(() => (
    selectedCategoryTiles.map(([label, tileCategories, keywords]) => ({
      label,
      categories: tileCategories,
      product: label === "All" ? null : findTileProduct(selectedCategoryPool.length ? selectedCategoryPool : products, tileCategories, keywords),
      count: label === "All"
        ? selectedCategoryPool.length
        : products.filter((product) => (
          tileCategories.some((category) => categoryMatchesSelection(product.category, category))
          || keywords.some((keyword) => normalizeProductText(product).includes(normalizeSearchText(keyword)))
        )).length,
    }))
  ), [products, selectedCategoryPool]);
  const categoryPanelData = useMemo(() => (
    mobileRailCategories.map((category) => {
      const meta = getCategoryMeta(category);
      return {
        value: category,
        label: meta.label,
        count: products.filter((product) => categoryMatchesSelection(product.category, category)).length,
      };
    })
  ), [products]);
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
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-800 shadow-sm transition hover:border-orange-300 hover:text-orange-600 [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        {valueLabel ? <span className="max-w-24 truncate rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700">{valueLabel}</span> : null}
        <span className="text-gray-400 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="absolute left-0 top-12 z-40 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-xl">
        {children}
      </div>
    </details>
  );

  const FilterOption = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded px-3 py-2 text-left text-[13px] transition ${
        active ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-lg font-bold text-gray-950">Electronics & Gadgets</p>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-bold text-gray-950">Related categories</p>
        <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                selectedCategory === cat ? "bg-orange-50 font-semibold text-orange-600 shadow-[inset_3px_0_0_0_#f97316]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selectedCategory === cat ? "bg-white text-orange-600" : "bg-white text-gray-700"}`}>
                  <CategoryGlyph category={cat} className="h-4 w-4" />
                </span>
                <span className="truncate">{cat === "All" ? "All Products" : getCategoryMeta(cat).label}</span>
              </span>
              <span className="text-[11px] text-gray-400">{cat === "All" ? formatCount(filteredProducts.length) : formatCount(products.filter((product) => categoryMatchesSelection(product.category, cat)).length)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 border-t border-gray-200 pt-4 text-sm font-bold text-gray-950">Price Range</p>
        <div className="space-y-1.5">
          {priceRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => setSelectedPriceRange(index)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                selectedPriceRange === index ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 border-t border-gray-200 pt-4 text-sm font-bold text-gray-950">Condition</p>
        <div className="space-y-1.5">
          {conditionOptions.map((condition) => (
            <button
              key={condition.value}
              onClick={() => setSelectedCondition(condition.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                selectedCondition === condition.value ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {condition.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 border-t border-gray-200 pt-4 text-sm font-bold text-gray-950">Brand</p>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedBrand("all")}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              selectedBrand === "all" ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All brands
          </button>
          {brandOptions.map((brand) => (
            <button
              key={brand.value}
              onClick={() => setSelectedBrand(brand.value)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                selectedBrand === brand.value ? "bg-orange-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{brand.label}</span>
              <span className="text-xs opacity-70">{brand.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 border-t border-gray-200 pt-4 text-sm font-bold text-gray-950">Rating</p>
        <div className="space-y-1.5">
          {ratingOptions.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
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
        className="w-full rounded-md border border-orange-500 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
      >
        Clear All Filters
      </button>
    </div>
  );

  const SelectedFilterPanel = () => (
    <aside className="hidden w-[15.75rem] shrink-0 lg:block">
      <div className="sticky top-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-2.5">
          <h2 className="text-[13px] font-extrabold text-gray-950">Filters</h2>
          <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-gray-700">Clear all</button>
        </div>

        <section className="border-b border-gray-100 px-3.5 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[12px] font-extrabold text-gray-950">Category</h3>
            <span className="text-gray-400">⌃</span>
          </div>
          <div className="space-y-1.5">
            {selectedTileData.slice(0, 7).map((tile) => (
              <button
                key={`filter-${tile.label}`}
                type="button"
                onClick={() => setSelectedCategory(tile.label === "All" ? selectedCategory : tile.categories[0])}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2 py-[7px] text-left text-[11.5px] transition ${
                  (tile.label === "All" ? selectedCategory === "All" : selectedCategory === tile.categories[0]) ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${tile.label === "All" ? "bg-white text-orange-600" : "bg-white text-gray-700"}`}>
                    <CategoryGlyph category={tile.label === "All" ? "All" : tile.categories[0]} className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{tile.label === "All" ? `All ${selectedCategoryMeta?.label || "Products"}` : tile.label}</span>
                </span>
                <span className="text-[10px] text-gray-500">{formatCount(tile.count)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3.5 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[12px] font-extrabold text-gray-950">Price (UGX)</h3>
            <span className="text-gray-400">⌃</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input value="UGX 10,000" readOnly className="min-w-0 rounded-md border border-gray-200 px-2 py-[7px] text-[10px] text-gray-600 outline-none" />
            <input value="UGX 15,000,000" readOnly className="min-w-0 rounded-md border border-gray-200 px-2 py-[7px] text-[10px] text-gray-600 outline-none" />
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-orange-100">
            <div className="h-full w-full rounded-full bg-orange-600" />
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
            {priceRanges.slice(1).map((range, index) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setSelectedPriceRange(index + 1)}
                className={`rounded-md border px-2 py-1.5 ${selectedPriceRange === index + 1 ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600"}`}
              >
                {range.label.replace("UGX ", "").replace("Under ", "Under ")}
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3.5 py-3.5">
          <h3 className="mb-2.5 text-[12px] font-extrabold text-gray-950">Brands</h3>
          <div className="mb-2.5 flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400">
            <span>⌕</span>
            <span>Search brands</span>
          </div>
          <div className="space-y-1.5">
            {brandOptions.slice(0, 5).map((brand) => (
              <button key={brand.value} type="button" onClick={() => setSelectedBrand(brand.value)} className="flex w-full items-center justify-between text-[11.5px] text-gray-700">
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded border ${selectedBrand === brand.value ? "border-orange-600 bg-orange-600" : "border-gray-300"}`} />
                  {brand.label}
                </span>
                <span className="text-[10px] text-gray-500">{brand.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 px-3.5 py-3.5">
          <h3 className="mb-2.5 text-[12px] font-extrabold text-gray-950">Condition</h3>
          <div className="space-y-1.5">
            {conditionOptions.slice(1, 3).map((condition) => (
              <button key={condition.value} type="button" onClick={() => setSelectedCondition(condition.value)} className="flex w-full items-center justify-between text-[11.5px] text-gray-700">
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded border ${selectedCondition === condition.value ? "border-orange-600 bg-orange-600" : "border-gray-300"}`} />
                  {condition.value === "new" ? "Brand New" : "Used"}
                </span>
                <span className="text-[10px] text-gray-500">{condition.value === "new" ? "3,124" : "1,112"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-3.5 py-3.5">
          <h3 className="mb-2.5 text-[12px] font-extrabold text-gray-950">Ratings</h3>
          <div className="space-y-1.5">
            {ratingOptions.slice(1).map((rating) => (
              <button key={rating.value} type="button" onClick={() => setSelectedRating(rating.value)} className="flex w-full items-center justify-between text-[11.5px] text-gray-700">
                <span className="text-orange-500">★★★★★ <span className="text-gray-500">& up</span></span>
                <span className="text-[10px] text-gray-500">{formatCount(Math.round(rating.value * 900))}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );

  if (selectedCategoryMode) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#f8f9fb] px-2 pb-24 pt-3 min-[380px]:px-3 min-[380px]:pt-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-5 hidden text-xs text-gray-500 lg:block">
              Home <span className="mx-2">›</span> All Categories <span className="mx-2">›</span> <span className="font-extrabold text-gray-950">{selectedCategoryMeta?.label}</span>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden [-webkit-overflow-scrolling:touch]">
              {selectedTileData.map((tile) => (
                <SelectedCategoryTile
                  key={`mobile-top-${tile.label}`}
                  label={tile.label}
                  product={tile.product}
                  active={tile.label === "All" ? selectedCategory === "All" : selectedCategory === tile.categories[0]}
                  onClick={() => {
                    if (tile.label === "All") {
                      setSelectedCategory("All");
                    } else {
                      setSelectedCategory(tile.categories[0]);
                    }
                  }}
                />
              ))}
            </div>

            <div className="grid gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => navigate("/all-products")}
                className="flex min-h-[4.5rem] w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <CategoryGlyph category="All" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-extrabold text-gray-950">All Products</span>
                    <span className="mt-1 block text-[11px] text-gray-500">Explore everything we have to offer</span>
                  </span>
                </span>
                <span className="text-xl text-gray-400">›</span>
              </button>

              {activeRow ? <MobileCategoryCard row={activeRow} navigate={navigate} /> : null}
              {remainingMobileRows.map((row) => (
                <MobileCategoryCard key={row.slug} row={row} navigate={navigate} />
              ))}
            </div>
          </div>

            <div className="hidden gap-6 lg:flex">
              <SelectedFilterPanel />

              <section className="min-w-0 flex-1">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,46rem)] lg:items-center">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 lg:text-4xl">{selectedCategoryMeta?.label || selectedCategory}</h1>
                    <p className="mt-3 text-sm leading-6 text-gray-500">Find the latest phones, laptops, audio, accessories and more.</p>
                  </div>

                  <button type="button" onClick={() => setSelectedCondition("flash")} className="relative hidden min-h-[8rem] overflow-hidden rounded-lg bg-[#060b14] px-8 py-6 text-left text-white shadow-sm lg:block">
                    <span className="relative z-10 inline-flex rounded bg-yellow-500/20 px-2 py-1 text-[10px] font-extrabold text-yellow-400">TECH THAT INSPIRES</span>
                    <span className="relative z-10 mt-3 block max-w-xs text-xl font-extrabold leading-7">Upgrade your world with the latest electronics</span>
                    <span className="absolute bottom-5 right-7 rounded-md bg-white px-5 py-2 text-[12px] font-extrabold text-gray-950">Shop Now</span>
                    <span className="absolute inset-y-0 right-36 flex w-80 items-center justify-end gap-3 opacity-95">
                      {selectedTileData.slice(1, 6).map((tile) => tile.product ? (
                        <Image key={tile.label} src={getProductImage(tile.product)} alt={tile.label} width={92} height={92} className="max-h-24 w-auto object-contain" />
                      ) : null)}
                    </span>
                  </button>
                </div>

                <div className="mt-8 flex gap-5 overflow-x-auto pb-2">
                  {selectedTileData.map((tile) => (
                    <SelectedCategoryTile
                      key={`top-${tile.label}`}
                      label={tile.label}
                      product={tile.product}
                      active={tile.label === "All" ? selectedCategory === "All" : selectedCategory === tile.categories[0]}
                      onClick={() => {
                        if (tile.label === "All") {
                          setSelectedCategory("All");
                        } else {
                          setSelectedCategory(tile.categories[0]);
                        }
                      }}
                    />
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-gray-500">{formatCount(filteredProducts.length)} products found</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                      value={effectiveSortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-10 rounded-md border border-gray-200 bg-white px-4 text-sm outline-none"
                    >
                      {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <span className="hidden h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600 sm:flex">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d={gridIconPath} stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                  </div>
                </div>

                {loadingProducts ? (
                  <ProductsGridSkeleton showHeader={false} />
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                    {filteredProducts.map((product) => (
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

        <section className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                selectedCategory === "All" ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
              }`}
            >
              All categories
            </button>
            {filterCategoryHighlights.map((category) => {
              const meta = getCategoryMeta(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === category ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                  }`}
                >
                  <span><CategoryGlyph /></span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[26px] font-bold text-gray-950">{compactHeading ? resultsLabel : selectedCategoryMeta?.label || "All Products"}</p>
            {!compactHeading ? (
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
                {selectedSeller ? ` from ${sellerFilterLabel}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="hidden text-sm font-medium text-gray-700 sm:block">Sort by:</label>
            <select
              value={effectiveSortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500 sm:w-auto"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm md:hidden"
            >
              Filters
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 border-y border-gray-200 bg-gray-50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
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
                className={`h-10 rounded-full border px-3.5 text-[13px] font-semibold shadow-sm transition ${
                  effectiveSortBy === "relevance" ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                }`}
              >
                Relevance
              </button>
            ) : null}
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={effectiveSortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-500"
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
            {searchQuery && !hasActiveSearch && (
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
              <div className="grid grid-cols-1 gap-5 pb-14 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            )}
            {filteredProducts.length > 0 ? (
              <div className="mb-14 flex items-center justify-center gap-3">
                {["<", "1", "2", "3", "4", "5", ">"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${
                      item === "1" ? "bg-orange-600 text-white" : "border border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
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
