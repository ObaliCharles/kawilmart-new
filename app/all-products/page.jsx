'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AllProductsPageSkeleton, ProductsGridSkeleton } from "@/components/PageSkeletons";
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

const filterCategoryHighlights = marketplaceFilterCategories.slice(0, 8);

const CategoryGlyph = ({ className = "h-4 w-4" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
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
  const { products, loadingProducts } = useAppContext();
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
              className={`w-full border-l-2 px-3 py-2 text-left text-sm transition ${
                selectedCategory === cat ? "border-orange-600 bg-orange-50 font-semibold text-orange-600" : "border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat === "All" ? cat : getCategoryMeta(cat).label}
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
