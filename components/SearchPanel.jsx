'use client'
import CategoryLineIcon from "@/components/CategoryLineIcon";

// Every interactive row here uses onMouseDown + preventDefault instead of
// onClick alone. That stops the search <input> from blurring (and this
// panel from unmounting) before the click actually registers — the same
// trick the old inline suggestions dropdown relied on.
const stopBlur = (handler) => (event) => {
  event.preventDefault();
  handler();
};

const HistoryIcon = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="h-3.5 w-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m3 17 6-6 4 4 8-8M15 7h6v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = () => (
  <svg className="h-3.5 w-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchGlyph = ({ className = "h-4 w-4" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
  </svg>
);

const getResultImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  return typeof image === "string" && image.trim() ? image.trim() : null;
};

const SectionLabel = ({ children }) => (
  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-gray-400">{children}</p>
);

const RecentSearchesList = ({ recentSearches, onPickTerm, onRemoveRecent, onClearRecent }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <SectionLabel>Recent Searches</SectionLabel>
      <button type="button" onMouseDown={stopBlur(onClearRecent)} className="mb-2 text-[11px] font-semibold text-orange-600 hover:text-orange-700">
        Clear all
      </button>
    </div>
    <div className="space-y-0.5">
      {recentSearches.map((term) => (
        <div key={term} className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-50">
          <button type="button" onMouseDown={stopBlur(() => onPickTerm(term))} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <span className="text-gray-400"><HistoryIcon /></span>
            <span className="truncate text-[13px] text-gray-800">{term}</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${term} from recent searches`}
            onMouseDown={stopBlur(() => onRemoveRecent(term))}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const TrendingChips = ({ trendingTerms, onPickTerm }) => (
  <div>
    <SectionLabel>Trending Searches</SectionLabel>
    <div className="flex flex-wrap gap-1.5">
      {trendingTerms.map((term) => (
        <button
          key={term}
          type="button"
          onMouseDown={stopBlur(() => onPickTerm(term))}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[12px] font-medium text-orange-700 transition hover:bg-orange-100"
        >
          <TrendingIcon />
          {term}
        </button>
      ))}
    </div>
  </div>
);

const PopularCategoryGrid = ({ popularCategories, onPickCategory, compact = false }) => (
  <div>
    <SectionLabel>Popular Categories</SectionLabel>
    <div className={`grid gap-1.5 ${compact ? "grid-cols-4" : "grid-cols-3"}`}>
      {popularCategories.map((category) => (
        <button
          key={category.value}
          type="button"
          onMouseDown={stopBlur(() => onPickCategory(category.value))}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 px-2 py-2.5 text-center transition hover:bg-orange-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm">
            <CategoryLineIcon category={category.value} className="h-4 w-4" />
          </span>
          <span className="line-clamp-1 text-[10.5px] font-semibold text-gray-700">{category.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const PopularBrandGrid = ({ brands, onPickBrand }) => (
  <div>
    <SectionLabel>Popular Brands</SectionLabel>
    <div className="grid grid-cols-3 gap-1.5">
      {brands.map((brand) => (
        <button
          key={brand.slug || brand.name}
          type="button"
          onMouseDown={stopBlur(() => onPickBrand(brand))}
          className="flex items-center justify-center rounded-lg bg-gray-50 px-2 py-2.5 transition hover:bg-orange-50"
        >
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="h-5 max-w-full object-contain" />
          ) : (
            <span className="truncate text-[11px] font-bold text-gray-700">{brand.name}</span>
          )}
        </button>
      ))}
    </div>
  </div>
);

const ProductResultRow = ({ product, onPickProduct, formatCurrency }) => {
  const image = getResultImage(product);
  return (
    <button
      type="button"
      onMouseDown={stopBlur(() => onPickProduct(product))}
      className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />
        ) : (
          <SearchGlyph className="h-4 w-4 text-gray-300" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 block text-[12.5px] font-medium text-gray-900">{product.name}</span>
        <span className="text-[11px] text-gray-400">{product.category}</span>
      </span>
      <span className="shrink-0 text-[12px] font-bold text-gray-950">
        {formatCurrency(product.offerPrice || product.price)}
      </span>
    </button>
  );
};

const BrandResultRow = ({ brand, onPickBrand }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickBrand(brand))}
    className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-[11px] font-bold text-gray-500">{brand.name?.slice(0, 2)}</span>
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 block text-[12.5px] font-medium text-gray-900">{brand.name}</span>
      <span className="text-[11px] text-gray-400">Brand</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const CategoryResultRow = ({ category, onPickCategory }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickCategory(category.value))}
    className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-orange-600">
      <CategoryLineIcon category={category.value} className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 block text-[12.5px] font-medium text-gray-900">{category.label}</span>
      <span className="text-[11px] text-gray-400">Category</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const EmptyState = ({
  layout,
  recentSearches,
  trendingTerms,
  popularCategories,
  featuredBrands,
  onPickTerm,
  onRemoveRecent,
  onClearRecent,
  onPickCategory,
  onPickBrand,
}) => {
  const hasRecent = recentSearches.length > 0;
  const hasTrending = trendingTerms.length > 0;
  const hasBrands = featuredBrands.length > 0;

  if (layout === "desktop") {
    return (
      <div className="grid grid-cols-[1fr_1.1fr_1fr] gap-6 p-5">
        <div>
          {hasRecent ? (
            <RecentSearchesList recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
          ) : (
            <p className="text-[12px] text-gray-400">Your recent searches will show up here.</p>
          )}
        </div>
        <div className="space-y-5 border-x border-gray-50 px-6">
          <PopularCategoryGrid popularCategories={popularCategories} onPickCategory={onPickCategory} />
          {hasTrending ? <TrendingChips trendingTerms={trendingTerms} onPickTerm={onPickTerm} /> : null}
        </div>
        <div>
          {hasBrands ? <PopularBrandGrid brands={featuredBrands} onPickBrand={onPickBrand} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {hasRecent ? (
        <RecentSearchesList recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
      ) : null}
      {hasTrending ? <TrendingChips trendingTerms={trendingTerms} onPickTerm={onPickTerm} /> : null}
      <PopularCategoryGrid popularCategories={popularCategories} onPickCategory={onPickCategory} compact />
    </div>
  );
};

const PredictiveResults = ({
  layout,
  query,
  productMatches,
  brandMatches,
  categoryMatches,
  onPickProduct,
  onPickBrand,
  onPickCategory,
  onSubmit,
  formatCurrency,
}) => {
  const hasAnyMatch = productMatches.length || brandMatches.length || categoryMatches.length;

  if (!hasAnyMatch) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[13px] font-medium text-gray-600">No matches for &ldquo;{query}&rdquo;</p>
        <p className="mt-1 text-[11.5px] text-gray-400">Try a different keyword, or search the full catalog.</p>
        <button
          type="button"
          onMouseDown={stopBlur(onSubmit)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-orange-700"
        >
          <SearchGlyph className="h-3.5 w-3.5" />
          Search all products
        </button>
      </div>
    );
  }

  const sideMatches = (
    <>
      {brandMatches.length ? (
        <div>
          <SectionLabel>Brands</SectionLabel>
          <div className="space-y-0.5">
            {brandMatches.map((brand) => <BrandResultRow key={brand.slug || brand.name} brand={brand} onPickBrand={onPickBrand} />)}
          </div>
        </div>
      ) : null}
      {categoryMatches.length ? (
        <div>
          <SectionLabel>Categories</SectionLabel>
          <div className="space-y-0.5">
            {categoryMatches.map((category) => <CategoryResultRow key={category.value} category={category} onPickCategory={onPickCategory} />)}
          </div>
        </div>
      ) : null}
    </>
  );

  if (layout === "desktop") {
    return (
      <div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-6 p-5">
          <div>
            {productMatches.length ? (
              <div>
                <SectionLabel>Products</SectionLabel>
                <div className="space-y-0.5">
                  {productMatches.map((product) => (
                    <ProductResultRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-5 border-l border-gray-50 pl-6">{sideMatches}</div>
        </div>
        <button
          type="button"
          onMouseDown={stopBlur(onSubmit)}
          className="flex w-full items-center justify-center gap-2 border-t border-gray-50 py-3 text-[12.5px] font-semibold text-orange-600 transition hover:bg-orange-50/60"
        >
          <SearchGlyph className="h-3.5 w-3.5" />
          See all results for &ldquo;{query}&rdquo;
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-5 p-4">
        {productMatches.length ? (
          <div>
            <SectionLabel>Products</SectionLabel>
            <div className="space-y-0.5">
              {productMatches.map((product) => (
                <ProductResultRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} />
              ))}
            </div>
          </div>
        ) : null}
        {sideMatches}
      </div>
      <button
        type="button"
        onMouseDown={stopBlur(onSubmit)}
        className="flex w-full items-center justify-center gap-2 border-t border-gray-50 py-3 text-[12.5px] font-semibold text-orange-600 transition hover:bg-orange-50/60"
      >
        <SearchGlyph className="h-3.5 w-3.5" />
        See all results for &ldquo;{query}&rdquo;
      </button>
    </div>
  );
};

// Unified search focus panel: empty-state (recent/trending/categories/brands)
// when the query is blank, predictive grouped results once the shopper
// starts typing. `variant` swaps between the mobile single-column layout and
// the desktop mega-panel.
const SearchPanel = ({
  variant = "mobile",
  query,
  recentSearches,
  trendingTerms,
  popularCategories,
  featuredBrands,
  productMatches,
  brandMatches,
  categoryMatches,
  onPickTerm,
  onRemoveRecent,
  onClearRecent,
  onPickProduct,
  onPickBrand,
  onPickCategory,
  onSubmit,
  formatCurrency,
}) => {
  const hasQuery = query.trim().length > 0;
  const containerClass = variant === "desktop"
    ? "absolute inset-x-0 top-full z-50 mt-2 max-h-[32rem] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
    : "absolute inset-x-0 top-full z-50 mt-1 max-h-[75vh] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]";

  return (
    <div className={containerClass}>
      {hasQuery ? (
        <PredictiveResults
          layout={variant}
          query={query.trim()}
          productMatches={productMatches}
          brandMatches={brandMatches}
          categoryMatches={categoryMatches}
          onPickProduct={onPickProduct}
          onPickBrand={onPickBrand}
          onPickCategory={onPickCategory}
          onSubmit={onSubmit}
          formatCurrency={formatCurrency}
        />
      ) : (
        <EmptyState
          layout={variant}
          recentSearches={recentSearches}
          trendingTerms={trendingTerms}
          popularCategories={popularCategories}
          featuredBrands={featuredBrands}
          onPickTerm={onPickTerm}
          onRemoveRecent={onRemoveRecent}
          onClearRecent={onClearRecent}
          onPickCategory={onPickCategory}
          onPickBrand={onPickBrand}
        />
      )}
    </div>
  );
};

export default SearchPanel;
