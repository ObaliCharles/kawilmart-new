'use client'
import CategoryLineIcon from "@/components/CategoryLineIcon";

// Every interactive row uses onMouseDown + preventDefault instead of onClick
// alone, so the search <input> doesn't blur (and the desktop dropdown doesn't
// unmount) before the tap registers. Harmless in the mobile overlay too.
const stopBlur = (handler) => (event) => {
  event.preventDefault();
  handler();
};

/* ---------- icons ---------- */

const HistoryIcon = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = () => (
  <svg className="h-3.5 w-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchGlyph = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-3 w-3" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const getResultImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  return typeof image === "string" && image.trim() ? image.trim() : null;
};

// Category visual: admin-uploaded PNG when one exists, line icon otherwise.
const CategoryVisual = ({ category, iconClassName = "h-4 w-4" }) => (
  category.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={category.imageUrl} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />
  ) : (
    <CategoryLineIcon category={category.value} className={iconClassName} />
  )
);

/* ---------- shared building blocks ---------- */

const SectionTitle = ({ children, action, onAction }) => (
  <div className="mb-2 flex items-center justify-between">
    <h3 className="text-[11.5px] font-bold text-gray-950">{children}</h3>
    {action ? (
      <button type="button" onMouseDown={stopBlur(onAction)} className="text-[10.5px] font-medium text-gray-400 transition hover:text-orange-600">
        {action}
      </button>
    ) : null}
  </div>
);

const RecentSearchesSection = ({ recentSearches, onPickTerm, onRemoveRecent, onClearRecent }) => (
  <div>
    <SectionTitle action="Clear all" onAction={onClearRecent}>Recent Searches</SectionTitle>
    <div className="space-y-0.5">
      {recentSearches.map((term) => (
        <div key={term} className="flex items-center gap-2.5 rounded-lg py-1 transition hover:bg-gray-50">
          <button type="button" onMouseDown={stopBlur(() => onPickTerm(term))} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <span className="shrink-0 text-gray-400"><HistoryIcon /></span>
            <span className="truncate text-[12px] font-medium text-gray-800">{term}</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${term} from recent searches`}
            onMouseDown={stopBlur(() => onRemoveRecent(term))}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const TrendingSection = ({ trendingTerms, onPickTerm }) => (
  <div>
    <SectionTitle>Trending Searches</SectionTitle>
    <div className="flex flex-wrap gap-1.5">
      {trendingTerms.map((term) => (
        <button
          key={term}
          type="button"
          onMouseDown={stopBlur(() => onPickTerm(term))}
          className="max-w-full truncate rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 transition hover:border-orange-300 hover:text-orange-600"
        >
          {term}
        </button>
      ))}
    </div>
  </div>
);

// Compact visual category tiles — uploaded PNG (or icon) on top, label under.
const PopularCategoriesCards = ({ popularCategories, onPickCategory, columns = "grid-cols-4" }) => (
  <div>
    <SectionTitle>Popular Categories</SectionTitle>
    <div className={`grid gap-1.5 ${columns}`}>
      {popularCategories.map((category) => (
        <button
          key={category.value}
          type="button"
          onMouseDown={stopBlur(() => onPickCategory(category.value))}
          className="group flex min-w-0 flex-col items-center gap-1"
        >
          <span className="flex h-11 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700 transition group-hover:bg-orange-50 group-hover:text-orange-600">
            <CategoryVisual category={category} iconClassName="h-5 w-5" />
          </span>
          <span className="w-full truncate text-center text-[9.5px] font-semibold text-gray-700">{category.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// Desktop vertical category list with a "View all" link.
const PopularCategoriesList = ({ popularCategories, onPickCategory, onViewAllCategories }) => (
  <div>
    <SectionTitle>Popular Categories</SectionTitle>
    <div className="space-y-0.5">
      {popularCategories.slice(0, 5).map((category) => (
        <button
          key={category.value}
          type="button"
          onMouseDown={stopBlur(() => onPickCategory(category.value))}
          className="flex w-full items-center gap-2.5 rounded-lg py-1 text-left transition hover:bg-gray-50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700">
            <CategoryVisual category={category} iconClassName="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-[12px] font-medium text-gray-800">{category.label}</span>
        </button>
      ))}
    </div>
    <button
      type="button"
      onMouseDown={stopBlur(onViewAllCategories)}
      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 transition hover:text-orange-700"
    >
      View all categories
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  </div>
);

const PopularBrandsSection = ({ brands, onPickBrand, columns = "grid-cols-3" }) => (
  <div>
    <SectionTitle>Popular Brands</SectionTitle>
    <div className={`grid gap-1.5 ${columns}`}>
      {brands.map((brand) => (
        <button
          key={brand.slug || brand.name}
          type="button"
          onMouseDown={stopBlur(() => onPickBrand(brand))}
          className="flex h-8 min-w-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-1.5 transition hover:border-orange-300"
        >
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="max-h-4.5 max-w-full object-contain" />
          ) : (
            <span className="truncate text-[10.5px] font-bold text-gray-800">{brand.name}</span>
          )}
        </button>
      ))}
    </div>
  </div>
);

// Product row: thumbnail + name (one line, truncated) + category, price right.
const ProductRow = ({ product, onPickProduct, formatCurrency, showPrice = true }) => {
  const image = getResultImage(product);
  return (
    <button
      type="button"
      onMouseDown={stopBlur(() => onPickProduct(product))}
      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-gray-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <SearchGlyph className="h-3.5 w-3.5 text-gray-300" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-[12px] font-semibold text-gray-950">{product.name}</span>
        <span className="block truncate text-[10.5px] text-gray-500">{product.category}</span>
      </span>
      {showPrice ? (
        <span className="shrink-0 text-[11.5px] font-bold text-gray-950">
          {formatCurrency(product.offerPrice || product.price)}
        </span>
      ) : (
        <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
      )}
    </button>
  );
};

const BrandRow = ({ brand, onPickBrand }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickBrand(brand))}
    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-[10.5px] font-black text-gray-700">{brand.name?.slice(0, 2)}</span>
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 text-[12px] font-semibold text-gray-950">{brand.name}</span>
      <span className="block text-[10.5px] text-gray-500">Brand</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const CategoryRow = ({ category, onPickCategory }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickCategory(category.value))}
    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700">
      <CategoryVisual category={category} iconClassName="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 text-[12px] font-semibold text-gray-950">{category.label}</span>
      <span className="block text-[10.5px] text-gray-500">Category</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const StoreRow = ({ store, onPickStore }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickStore(store))}
    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-[11.5px] font-black text-orange-700">
      {store.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        (store.name || "S").slice(0, 1)
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 text-[12px] font-semibold text-gray-950">{store.name}</span>
      <span className="block text-[10.5px] text-gray-500">Store</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const SeeAllResultsBar = ({ query, onSubmit }) => (
  <button
    type="button"
    onMouseDown={stopBlur(onSubmit)}
    className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-2.5 text-[12px] font-semibold text-orange-600 transition hover:bg-orange-50/60"
  >
    <SearchGlyph />
    <span className="truncate">See all results for &ldquo;{query}&rdquo;</span>
  </button>
);

const NoMatches = ({ query, onSubmit }) => (
  <div className="px-4 py-8 text-center">
    <p className="truncate text-[12.5px] font-bold text-gray-900">No matches for &ldquo;{query}&rdquo;</p>
    <p className="mt-0.5 text-[11px] text-gray-500">Check the spelling, or search the full catalog.</p>
    <button
      type="button"
      onMouseDown={stopBlur(onSubmit)}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-[11.5px] font-semibold text-white transition hover:bg-orange-700"
    >
      <SearchGlyph />
      Search all products
    </button>
  </div>
);

const PredictiveSections = ({ productMatches, brandMatches, categoryMatches, storeMatches, onPickProduct, onPickBrand, onPickCategory, onPickStore, formatCurrency, productsTitle = "Top Suggestions" }) => (
  <>
    {productMatches.length ? (
      <div>
        <SectionTitle>{productsTitle}</SectionTitle>
        <div className="space-y-0.5">
          {productMatches.map((product) => (
            <ProductRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} />
          ))}
        </div>
      </div>
    ) : null}
    {brandMatches.length ? (
      <div>
        <SectionTitle>Brands</SectionTitle>
        <div className="space-y-0.5">
          {brandMatches.map((brand) => <BrandRow key={brand.slug || brand.name} brand={brand} onPickBrand={onPickBrand} />)}
        </div>
      </div>
    ) : null}
    {categoryMatches.length ? (
      <div>
        <SectionTitle>Categories</SectionTitle>
        <div className="space-y-0.5">
          {categoryMatches.map((category) => <CategoryRow key={category.value} category={category} onPickCategory={onPickCategory} />)}
        </div>
      </div>
    ) : null}
    {storeMatches.length ? (
      <div>
        <SectionTitle>Stores</SectionTitle>
        <div className="space-y-0.5">
          {storeMatches.map((store) => <StoreRow key={store.id} store={store} onPickStore={onPickStore} />)}
        </div>
      </div>
    ) : null}
  </>
);

/* ---------- mobile: overlay body ---------- */

export const MobileSearchBody = ({
  query,
  recentSearches,
  trendingTerms,
  popularCategories,
  featuredBrands,
  productMatches,
  brandMatches,
  categoryMatches,
  storeMatches,
  onPickTerm,
  onRemoveRecent,
  onClearRecent,
  onPickProduct,
  onPickBrand,
  onPickCategory,
  onPickStore,
  onSubmit,
  formatCurrency,
}) => {
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    const hasAnyMatch = productMatches.length || brandMatches.length || categoryMatches.length || storeMatches.length;
    if (!hasAnyMatch) return <NoMatches query={trimmedQuery} onSubmit={onSubmit} />;

    return (
      <div>
        <div className="space-y-4 px-4 py-3">
          <PredictiveSections
            productMatches={productMatches}
            brandMatches={brandMatches}
            categoryMatches={categoryMatches}
            storeMatches={storeMatches}
            onPickProduct={onPickProduct}
            onPickBrand={onPickBrand}
            onPickCategory={onPickCategory}
            onPickStore={onPickStore}
            formatCurrency={formatCurrency}
          />
        </div>
        <SeeAllResultsBar query={trimmedQuery} onSubmit={onSubmit} />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-3">
      {recentSearches.length ? (
        <RecentSearchesSection recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
      ) : null}
      {trendingTerms.length ? <TrendingSection trendingTerms={trendingTerms} onPickTerm={onPickTerm} /> : null}
      <PopularCategoriesCards popularCategories={popularCategories} onPickCategory={onPickCategory} columns="grid-cols-4" />
      {featuredBrands.length ? <PopularBrandsSection brands={featuredBrands} onPickBrand={onPickBrand} columns="grid-cols-3" /> : null}
    </div>
  );
};

/* ---------- desktop: mega-search dropdown ---------- */

const DesktopSearchPanel = ({
  query,
  recentSearches,
  trendingTerms,
  popularCategories,
  featuredBrands,
  recommendedProducts,
  productMatches,
  brandMatches,
  categoryMatches,
  storeMatches,
  onPickTerm,
  onRemoveRecent,
  onClearRecent,
  onPickProduct,
  onPickBrand,
  onPickCategory,
  onPickStore,
  onViewAllCategories,
  onSubmit,
  formatCurrency,
}) => {
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    const hasAnyMatch = productMatches.length || brandMatches.length || categoryMatches.length || storeMatches.length;
    if (!hasAnyMatch) return <NoMatches query={trimmedQuery} onSubmit={onSubmit} />;

    return (
      <div>
        <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-[1.4fr_1fr] lg:divide-x lg:divide-y-0">
          <div className="p-4">
            {productMatches.length ? (
              <div>
                <SectionTitle>Top Suggestions</SectionTitle>
                <div className="space-y-0.5">
                  {productMatches.map((product) => (
                    <ProductRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11.5px] text-gray-400">No matching products.</p>
            )}
          </div>
          <div className="space-y-4 p-4">
            <PredictiveSections
              productMatches={[]}
              brandMatches={brandMatches}
              categoryMatches={categoryMatches}
              storeMatches={storeMatches}
              onPickProduct={onPickProduct}
              onPickBrand={onPickBrand}
              onPickCategory={onPickCategory}
              onPickStore={onPickStore}
              formatCurrency={formatCurrency}
            />
            {!brandMatches.length && !categoryMatches.length && !storeMatches.length ? (
              <TrendingSection trendingTerms={trendingTerms} onPickTerm={onPickTerm} />
            ) : null}
          </div>
        </div>
        <SeeAllResultsBar query={trimmedQuery} onSubmit={onSubmit} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-[1fr_1.35fr_1.15fr] lg:divide-x lg:divide-y-0">
      <div className="space-y-4 p-4">
        {recentSearches.length ? (
          <RecentSearchesSection recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
        ) : null}
        {trendingTerms.length ? <TrendingSection trendingTerms={trendingTerms} onPickTerm={onPickTerm} /> : null}
      </div>
      <div className="p-4">
        <SectionTitle>Top Suggestions</SectionTitle>
        <div className="space-y-0.5">
          {recommendedProducts.map((product) => (
            <ProductRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} showPrice={false} />
          ))}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <PopularCategoriesList popularCategories={popularCategories} onPickCategory={onPickCategory} onViewAllCategories={onViewAllCategories} />
        {featuredBrands.length ? <PopularBrandsSection brands={featuredBrands} onPickBrand={onPickBrand} columns="grid-cols-3" /> : null}
      </div>
    </div>
  );
};

// Desktop dropdown wrapper: exactly as wide as the search bar (never spills
// past the viewport), soft shadow, internal scroll.
const SearchPanel = (props) => (
  <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
    <div className="max-h-[26rem] overflow-y-auto overscroll-contain">
      <DesktopSearchPanel {...props} />
    </div>
  </div>
);

export default SearchPanel;
