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
  <svg className="h-[18px] w-[18px]" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchGlyph = ({ className = "h-4 w-4" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-3.5 w-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const getResultImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  return typeof image === "string" && image.trim() ? image.trim() : null;
};

/* ---------- shared building blocks (mockup design language) ---------- */

const SectionTitle = ({ children, action, onAction }) => (
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-[13.5px] font-bold text-gray-950">{children}</h3>
    {action ? (
      <button type="button" onMouseDown={stopBlur(onAction)} className="text-[12px] font-medium text-gray-400 transition hover:text-orange-600">
        {action}
      </button>
    ) : null}
  </div>
);

const RecentSearchesSection = ({ recentSearches, onPickTerm, onRemoveRecent, onClearRecent }) => (
  <div>
    <SectionTitle action="Clear all" onAction={onClearRecent}>Recent Searches</SectionTitle>
    <div className="space-y-1">
      {recentSearches.map((term) => (
        <div key={term} className="flex items-center gap-3 rounded-lg py-1.5 transition hover:bg-gray-50">
          <button type="button" onMouseDown={stopBlur(() => onPickTerm(term))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="text-gray-400"><HistoryIcon /></span>
            <span className="truncate text-[13px] font-medium text-gray-800">{term}</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${term} from recent searches`}
            onMouseDown={stopBlur(() => onRemoveRecent(term))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-600"
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
    <div className="flex flex-wrap gap-2">
      {trendingTerms.map((term) => (
        <button
          key={term}
          type="button"
          onMouseDown={stopBlur(() => onPickTerm(term))}
          className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
        >
          {term}
        </button>
      ))}
    </div>
  </div>
);

// Compact visual category cards — icon tile on top, label under (mockup style).
const PopularCategoriesCards = ({ popularCategories, onPickCategory, columns = "grid-cols-4" }) => (
  <div>
    <SectionTitle>Popular Categories</SectionTitle>
    <div className={`grid gap-2 ${columns}`}>
      {popularCategories.map((category) => (
        <button
          key={category.value}
          type="button"
          onMouseDown={stopBlur(() => onPickCategory(category.value))}
          className="group flex flex-col items-center gap-1.5"
        >
          <span className="flex h-14 w-full items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-orange-50 group-hover:text-orange-600">
            <CategoryLineIcon category={category.value} className="h-6 w-6" />
          </span>
          <span className="line-clamp-1 text-[10.5px] font-semibold text-gray-700">{category.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// Desktop-only vertical category list with a "View all" link (mockup style).
const PopularCategoriesList = ({ popularCategories, onPickCategory, onViewAllCategories }) => (
  <div>
    <SectionTitle>Popular Categories</SectionTitle>
    <div className="space-y-1">
      {popularCategories.slice(0, 5).map((category) => (
        <button
          key={category.value}
          type="button"
          onMouseDown={stopBlur(() => onPickCategory(category.value))}
          className="flex w-full items-center gap-3 rounded-lg py-1.5 text-left transition hover:bg-gray-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <CategoryLineIcon category={category.value} className="h-4.5 w-4.5" />
          </span>
          <span className="truncate text-[13px] font-medium text-gray-800">{category.label}</span>
        </button>
      ))}
    </div>
    <button
      type="button"
      onMouseDown={stopBlur(onViewAllCategories)}
      className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-orange-600 transition hover:text-orange-700"
    >
      View all categories
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  </div>
);

const PopularBrandsSection = ({ brands, onPickBrand, columns = "grid-cols-3" }) => (
  <div>
    <SectionTitle>Popular Brands</SectionTitle>
    <div className={`grid gap-2 ${columns}`}>
      {brands.map((brand) => (
        <button
          key={brand.slug || brand.name}
          type="button"
          onMouseDown={stopBlur(() => onPickBrand(brand))}
          className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 shadow-sm transition hover:border-orange-300"
        >
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="max-h-6 max-w-full object-contain" />
          ) : (
            <span className="truncate text-[12px] font-bold text-gray-800">{brand.name}</span>
          )}
        </button>
      ))}
    </div>
  </div>
);

// Product row: thumbnail + bold name + category subtitle, price right-aligned.
const ProductRow = ({ product, onPickProduct, formatCurrency, showPrice = true }) => {
  const image = getResultImage(product);
  return (
    <button
      type="button"
      onMouseDown={stopBlur(() => onPickProduct(product))}
      className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-gray-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <SearchGlyph className="h-4 w-4 text-gray-300" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 block text-[13px] font-bold text-gray-950">{product.name}</span>
        <span className="text-[11.5px] text-gray-500">{product.category}</span>
      </span>
      {showPrice ? (
        <span className="shrink-0 text-[12.5px] font-bold text-gray-950">
          {formatCurrency(product.offerPrice || product.price)}
        </span>
      ) : (
        <span className="shrink-0 text-gray-300"><ChevronRightIcon /></span>
      )}
    </button>
  );
};

const BrandRow = ({ brand, onPickBrand }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickBrand(brand))}
    className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-[12px] font-black text-gray-700">{brand.name?.slice(0, 2)}</span>
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 block text-[13px] font-bold text-gray-950">{brand.name}</span>
      <span className="text-[11.5px] text-gray-500">Brand</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const CategoryRow = ({ category, onPickCategory }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickCategory(category.value))}
    className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
      <CategoryLineIcon category={category.value} className="h-4.5 w-4.5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 block text-[13px] font-bold text-gray-950">{category.label}</span>
      <span className="text-[11.5px] text-gray-500">Category</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const StoreRow = ({ store, onPickStore }) => (
  <button
    type="button"
    onMouseDown={stopBlur(() => onPickStore(store))}
    className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-[13px] font-black text-orange-700">
      {store.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        (store.name || "S").slice(0, 1)
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-1 block text-[13px] font-bold text-gray-950">{store.name}</span>
      <span className="text-[11.5px] text-gray-500">Store</span>
    </span>
    <span className="shrink-0 text-gray-300"><ArrowUpRight /></span>
  </button>
);

const SeeAllResultsBar = ({ query, onSubmit }) => (
  <button
    type="button"
    onMouseDown={stopBlur(onSubmit)}
    className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-3.5 text-[13px] font-semibold text-orange-600 transition hover:bg-orange-50/60"
  >
    <SearchGlyph className="h-4 w-4" />
    See all results for &ldquo;{query}&rdquo;
  </button>
);

const NoMatches = ({ query, onSubmit }) => (
  <div className="px-5 py-10 text-center">
    <p className="text-[13.5px] font-bold text-gray-900">No matches for &ldquo;{query}&rdquo;</p>
    <p className="mt-1 text-[12px] text-gray-500">Check the spelling, or search the full catalog.</p>
    <button
      type="button"
      onMouseDown={stopBlur(onSubmit)}
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-orange-700"
    >
      <SearchGlyph className="h-3.5 w-3.5" />
      Search all products
    </button>
  </div>
);

/* ---------- mobile: full-screen discovery / predictive body ---------- */

// Rendered inside the mobile full-screen search overlay (not a dropdown).
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
        <div className="space-y-6 px-4 py-4">
          {productMatches.length ? (
            <div>
              <SectionTitle>Top Suggestions</SectionTitle>
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
        </div>
        <SeeAllResultsBar query={trimmedQuery} onSubmit={onSubmit} />
      </div>
    );
  }

  return (
    <div className="space-y-7 px-4 py-4">
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

    return (
      <div>
        {hasAnyMatch ? (
          <div className="grid grid-cols-[1fr_1.7fr_1.3fr] divide-x divide-gray-100">
            <div className="p-5">
              {recentSearches.length ? (
                <RecentSearchesSection recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
              ) : (
                <TrendingSection trendingTerms={trendingTerms} onPickTerm={onPickTerm} />
              )}
            </div>
            <div className="p-5">
              <SectionTitle>Top Suggestions</SectionTitle>
              <div className="space-y-0.5">
                {productMatches.map((product) => (
                  <ProductRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} />
                ))}
              </div>
            </div>
            <div className="space-y-6 p-5">
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
            </div>
          </div>
        ) : (
          <NoMatches query={trimmedQuery} onSubmit={onSubmit} />
        )}
        {hasAnyMatch ? <SeeAllResultsBar query={trimmedQuery} onSubmit={onSubmit} /> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_1.5fr_1.2fr_1.3fr] divide-x divide-gray-100">
      <div className="p-5">
        {recentSearches.length ? (
          <RecentSearchesSection recentSearches={recentSearches} onPickTerm={onPickTerm} onRemoveRecent={onRemoveRecent} onClearRecent={onClearRecent} />
        ) : (
          <div>
            <SectionTitle>Recent Searches</SectionTitle>
            <p className="text-[12px] leading-5 text-gray-400">Your recent searches will show up here.</p>
          </div>
        )}
      </div>
      <div className="p-5">
        <SectionTitle>Top Suggestions</SectionTitle>
        <div className="space-y-0.5">
          {recommendedProducts.map((product) => (
            <ProductRow key={product._id} product={product} onPickProduct={onPickProduct} formatCurrency={formatCurrency} showPrice={false} />
          ))}
        </div>
      </div>
      <div className="p-5">
        <PopularCategoriesList popularCategories={popularCategories} onPickCategory={onPickCategory} onViewAllCategories={onViewAllCategories} />
      </div>
      <div className="space-y-6 p-5">
        {trendingTerms.length ? <TrendingSection trendingTerms={trendingTerms} onPickTerm={onPickTerm} /> : null}
        {featuredBrands.length ? <PopularBrandsSection brands={featuredBrands} onPickBrand={onPickBrand} columns="grid-cols-3" /> : null}
      </div>
    </div>
  );
};

// Desktop mega-search dropdown wrapper: wide premium panel centered under the
// search bar (900–1200px, per the reference design), soft shadow, rounded.
const SearchPanel = (props) => (
  <div className="absolute left-1/2 top-full z-50 mt-2 w-[min(1100px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
    <div className="max-h-[34rem] overflow-y-auto">
      <DesktopSearchPanel {...props} />
    </div>
  </div>
);

export default SearchPanel;
