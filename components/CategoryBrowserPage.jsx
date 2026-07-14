'use client'

import Image from "next/image";
import { useMemo, useState } from "react";
import MegaStoreHome from "@/components/MegaStoreHome";
import { useAppContext } from "@/context/AppContext";
import { getProductImage } from "@/lib/categoryExperiences";
import { homeCategoryValues, getCategoryMeta, categoryMatchesSelection, buildCategoryHref } from "@/lib/marketplaceCategories";

const categoryHref = (category, subcategory) => {
  if (!subcategory) return buildCategoryHref(category);
  return `/all-products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`;
};

// Finds a real product for this exact category/subcategory pair — no
// keyword guessing, no fallback to an unrelated product. If nothing
// matches yet, the tile just shows its icon instead of a wrong photo.
const findExactProduct = (products, category, subcategory) => (
  products.find((product) => (
    categoryMatchesSelection(product?.category, category)
    && (!subcategory || product?.subcategory === subcategory)
  )) || null
);

const CategoryTile = ({ label, icon, product, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-white text-center ring-1 ring-gray-100/80 transition-all duration-150 hover:shadow-md active:scale-[0.97]"
  >
    <span className="flex w-full items-center justify-center h-[3.2rem] p-1.5">
      {product ? (
        <Image
          src={getProductImage(product)}
          alt={label}
          width={60}
          height={50}
          className="h-full w-full object-contain"
        />
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

const CategoryBrowserPage = ({ siteContent, initialProducts = [] }) => {
  const { products, navigate, customTopCategories, subcategoriesByParent } = useAppContext();
  const storefrontProducts = products.length ? products : initialProducts;

  const departments = useMemo(() => {
    const staticDepartments = homeCategoryValues.map((value) => {
      const meta = getCategoryMeta(value);
      return { value, label: meta.label, icon: meta.icon };
    });
    const customDepartments = customTopCategories.map((category) => ({
      value: category.name,
      label: category.name,
      icon: category.icon || "📦",
    }));
    return [...staticDepartments, ...customDepartments];
  }, [customTopCategories]);

  const [selectedDepartmentValue, setSelectedDepartmentValue] = useState(null);
  const currentDepartment = departments.find((department) => department.value === selectedDepartmentValue) || departments[0];

  const goToCategory = (category, subcategory) => {
    navigate(categoryHref(category, subcategory));
  };

  const currentSubcategories = (subcategoriesByParent.get(currentDepartment?.value) || [])
    .filter((subcategory) => subcategory.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const categoryProductCount = currentDepartment
    ? storefrontProducts.filter((product) => categoryMatchesSelection(product?.category, currentDepartment.value)).length
    : 0;

  return (
    <>
      <div className="hidden lg:block">
        <MegaStoreHome siteContent={siteContent} initialProducts={initialProducts} />
      </div>

      <main className="flex h-[calc(100dvh-4.75rem)] min-h-0 overflow-hidden bg-[#f5f7fb] lg:hidden">
        <aside className="category-rail-scroll h-full w-[5.45rem] shrink-0 overflow-y-auto border-r border-gray-100 bg-white shadow-[4px_0_18px_rgba(15,23,42,0.04)] min-[390px]:w-[5.85rem]">
          <div className="flex flex-col">
            {departments.map((department) => {
              const active = department.value === currentDepartment?.value;
              return (
                <button
                  key={department.value}
                  type="button"
                  onClick={() => setSelectedDepartmentValue(department.value)}
                  className={`relative flex w-full flex-col items-center gap-1 border-b border-gray-100 px-1.5 py-2.5 text-center transition ${
                    active ? "bg-orange-50/70 text-gray-950" : "text-gray-500 active:bg-gray-50"
                  }`}
                >
                  {active ? <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-orange-600" /> : null}
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${active ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}>
                    {department.icon}
                  </span>
                  <span className={`leading-tight ${active ? "font-semibold text-gray-950" : "font-medium text-gray-500"} text-[8px] min-[390px]:text-[9px]`}>
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
                    {currentSubcategories.map((subcategory) => {
                      const product = findExactProduct(storefrontProducts, currentDepartment.value, subcategory.name);
                      return (
                        <CategoryTile
                          key={subcategory._id}
                          label={subcategory.name}
                          icon={subcategory.icon}
                          product={product}
                          onClick={() => goToCategory(currentDepartment.value, subcategory.name)}
                        />
                      );
                    })}
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
