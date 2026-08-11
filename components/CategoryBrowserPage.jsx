'use client'

import { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { buildTopCategoryRail, categoryMatchesSelection, buildCategoryHref } from "@/lib/marketplaceCategories";

const categoryHref = (category, subcategory) => {
  if (!subcategory) return buildCategoryHref(category);
  return `/all-products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`;
};

// Subcategory tile: shows the admin-uploaded PNG, then emoji, then a generic
// glyph. Never a product photo. That caused the "one product's image shows on
// every tile" repetition.
const CategoryTile = ({ label, icon, imageUrl, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-white text-center ring-1 ring-gray-100/80 transition-all duration-150 hover:shadow-md active:scale-[0.97]"
  >
    <span className="flex w-full items-center justify-center h-[3.2rem] p-1.5">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={label} className="h-full w-full object-contain" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-base text-gray-400">
          {icon || "🏷️"}
        </span>
      )}
    </span>
    <span className="line-clamp-2 min-h-[18px] px-1 pb-1.5 text-center font-medium text-gray-800 text-[9px] leading-[11px]">
      {label}
    </span>
  </button>
);

// Department glyph for the desktop directory: admin-uploaded PNG first, then
// the category emoji, then a neutral placeholder — same precedence as the
// mobile tiles, so both views stay visually in sync.
const DepartmentIcon = ({ label, icon, imageUrl }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100">
    {imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-full w-full object-contain p-1.5" />
    ) : (
      <span className="text-lg" aria-hidden="true">{icon || "🏷️"}</span>
    )}
    <span className="sr-only">{label}</span>
  </span>
);

const CategoryBrowserPage = ({ initialProducts = [] }) => {
  const { products, navigate, customTopCategories, subcategoriesByParent } = useAppContext();
  const storefrontProducts = products.length ? products : initialProducts;

  const departments = useMemo(() => buildTopCategoryRail(customTopCategories), [customTopCategories]);

  const [selectedDepartmentValue, setSelectedDepartmentValue] = useState(null);
  const currentDepartment = departments.find((department) => department.value === selectedDepartmentValue) || departments[0];

  const goToCategory = (category, subcategory) => {
    navigate(categoryHref(category, subcategory));
  };

  const subcategoriesFor = (departmentValue) => (subcategoriesByParent.get(departmentValue) || [])
    .filter((subcategory) => subcategory.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const currentSubcategories = subcategoriesFor(currentDepartment?.value);

  // One pass over the catalogue instead of a filter per department.
  const countsByDepartment = useMemo(() => {
    const counts = new Map(departments.map((department) => [department.value, 0]));
    storefrontProducts.forEach((product) => {
      departments.forEach((department) => {
        if (categoryMatchesSelection(product?.category, department.value)) {
          counts.set(department.value, (counts.get(department.value) || 0) + 1);
        }
      });
    });
    return counts;
  }, [departments, storefrontProducts]);

  const categoryProductCount = countsByDepartment.get(currentDepartment?.value) || 0;

  return (
    <>
      {/* Desktop/tablet: the full category directory reached from the hero
          sidebar's "View more". Mobile keeps its own rail experience below. */}
      <main className="hidden bg-[#f8fafc] px-4 pb-16 pt-5 lg:block">
        <div className="mx-auto max-w-[1420px]">
          <nav aria-label="Breadcrumb" className="text-[12px] font-medium text-gray-500">
            <button type="button" onClick={() => navigate("/")} className="rounded transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
              Home
            </button>
            <span className="px-1.5 text-gray-300">/</span>
            <span className="font-semibold text-gray-900">All Categories</span>
          </nav>

          <header className="mt-3 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-gray-950">All Categories</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse every department and jump straight to the shelf you need.
              </p>
            </div>
            <p className="shrink-0 text-[12px] font-semibold text-gray-500">
              {departments.length} department{departments.length === 1 ? "" : "s"}
            </p>
          </header>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {departments.map((department) => {
              const subcategories = subcategoriesFor(department.value);
              const count = countsByDepartment.get(department.value) || 0;

              return (
                <section
                  key={department.value}
                  className="flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <DepartmentIcon label={department.label} icon={department.icon} imageUrl={department.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-black text-gray-950">{department.label}</h2>
                      <p className="text-[11px] font-medium text-gray-500">
                        {count} item{count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToCategory(department.value)}
                      className="group shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-orange-600 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      See all
                      <span className="ml-0.5 inline-block transition-transform duration-150 group-hover:translate-x-0.5">›</span>
                    </button>
                  </div>

                  {subcategories.length ? (
                    <ul className="mt-2 grid grid-cols-2 gap-x-3">
                      {subcategories.slice(0, 10).map((subcategory) => (
                        <li key={subcategory._id} className="min-w-0">
                          <button
                            type="button"
                            onClick={() => goToCategory(department.value, subcategory.name)}
                            className="block w-full truncate rounded px-1 py-1.5 text-left text-[12.5px] text-gray-600 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          >
                            {subcategory.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 flex-1 text-[12.5px] text-gray-500">
                      No subcategories yet — browse the full department.
                    </p>
                  )}

                  {subcategories.length > 10 ? (
                    <button
                      type="button"
                      onClick={() => goToCategory(department.value)}
                      className="mt-1 self-start rounded px-1 py-1 text-[11.5px] font-bold text-orange-600 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      +{subcategories.length - 10} more in {department.label}
                    </button>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </main>

      {/* Fills exactly the space above the fixed bottom dock, so the rail's
          bottom edge meets the dock with no gap. Driven by --app-dock-h rather
          than a hardcoded height, which is what drifted when the dock shrank. */}
      <main className="flex h-[calc(100dvh-var(--app-dock-h))] min-h-0 overflow-hidden bg-[#f5f7fb] lg:hidden">
        <aside className="category-rail-scroll h-full w-[5.45rem] shrink-0 overflow-y-auto border-r border-gray-100 bg-white shadow-[4px_0_18px_rgba(15,23,42,0.04)] min-[390px]:w-[5.85rem]">
          <div className="flex flex-col">
            {departments.map((department) => {
              const active = department.value === currentDepartment?.value;
              return (
                <button
                  key={department.value}
                  type="button"
                  onClick={() => setSelectedDepartmentValue(department.value)}
                  className={`relative flex h-[4.6rem] w-full items-center justify-center border-b border-gray-100 px-1.5 text-center transition ${
                    active ? "bg-orange-50/70" : "active:bg-gray-50"
                  }`}
                >
                  {active ? <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-orange-600" /> : null}
                  <span className={`line-clamp-2 leading-tight ${active ? "font-bold text-gray-950" : "font-medium text-gray-500"} text-[9px] min-[390px]:text-[10px]`}>
                    {department.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="scrollbar-none h-full min-w-0 flex-1 overflow-y-auto px-2.5 py-3 min-[390px]:px-3">
          <div className="sticky top-0 z-10 -mx-2.5 mb-3 bg-[#f5f7fb]/95 px-2.5 pb-2 backdrop-blur min-[390px]:-mx-3 min-[390px]:px-3">
            <h1 className="text-base font-black text-gray-950">{currentDepartment?.label}</h1>
            <p className="text-[11px] font-medium text-gray-500">{categoryProductCount} item{categoryProductCount === 1 ? "" : "s"} in this category</p>
          </div>

          <div className="space-y-2.5">
            {currentSubcategories.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <h2 className="text-[12px] font-bold text-gray-800">Browse {currentDepartment?.label}</h2>
                  <button type="button" onClick={() => goToCategory(currentDepartment.value)} className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600">
                    See All
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
                  <div className="grid grid-cols-3 gap-2">
                    {currentSubcategories.map((subcategory) => (
                      <CategoryTile
                        key={subcategory._id}
                        label={subcategory.name}
                        icon={subcategory.icon}
                        imageUrl={subcategory.imageUrl}
                        onClick={() => goToCategory(currentDepartment.value, subcategory.name)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100">
                <p className="text-sm font-semibold text-gray-800">No subcategories set up for {currentDepartment?.label} yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  {categoryProductCount > 0
                    ? `There ${categoryProductCount === 1 ? "is" : "are"} ${categoryProductCount} item${categoryProductCount === 1 ? "" : "s"} in this category.`
                    : "No items in this category yet."}
                </p>
                <button
                  type="button"
                  onClick={() => goToCategory(currentDepartment.value)}
                  className="mt-3 rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Browse {currentDepartment?.label}
                </button>
              </section>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default CategoryBrowserPage;
