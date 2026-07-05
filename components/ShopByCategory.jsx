'use client'
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { buildCategoryHref, getCategoryMeta, homeCategoryValues } from "@/lib/marketplaceCategories";

const ShopByCategory = () => {
  const { setIsRouteLoading } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const categories = useMemo(() => (
    homeCategoryValues.map((categoryValue) => {
      const meta = getCategoryMeta(categoryValue);
      return {
        ...meta,
        href: buildCategoryHref(categoryValue),
      };
    })
  ), []);

  const quickCategories = categories.slice(0, 6);

  return (
    <div className="pattern-category-sketch mt-12 overflow-hidden rounded-[2rem] border border-gray-200">
      <div className="flex flex-col gap-4 border-b border-white/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-2xl font-semibold text-gray-900">Shop by Category</p>
          <p className="mt-1 text-sm text-gray-500">
            Fashion, beauty, home, electronics, and more in one expandable category menu.
          </p>
        </div>

        <div className="grid gap-2 min-[430px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
          {quickCategories.map((cat) => (
            <Link
              key={cat.value}
              href={cat.href}
              onClick={() => setIsRouteLoading(true)}
              className="inline-flex min-w-0 items-center justify-between gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 sm:justify-start"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                {cat.icon}
              </span>
              <span className="truncate">{cat.label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white sm:justify-start"
          >
            {isExpanded ? "Hide categories" : "Browse all categories"}
            <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
          </button>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="pattern-category-sketch-soft grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:px-6">
            {categories.map((cat) => (
              <Link
                key={cat.value}
                href={cat.href}
                onClick={() => setIsRouteLoading(true)}
                className="group rounded-2xl border border-white/90 bg-white/95 p-4 backdrop-blur-[2px] transition hover:border-orange-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5f2ed] text-lg">
                    {cat.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 transition group-hover:text-orange-700">
                      {cat.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopByCategory;
