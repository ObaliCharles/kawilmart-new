'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "@/context/AppContext";
import { buildTopCategoryRail, buildCategoryHref } from "@/lib/marketplaceCategories";

const subcategoryHref = (category, subcategory) =>
  `/all-products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`;

// Tile glyph precedence matches the mobile browser: admin-uploaded PNG, then
// the record's emoji, then a neutral placeholder. Never a product photo.
// Purely decorative — the tile's visible caption already names it, so this
// stays out of the accessibility tree rather than announcing the label twice.
const TileGlyph = ({ icon, imageUrl }) => (
  <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-50 ring-1 ring-gray-100 transition group-hover:ring-orange-200">
    {imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-full w-full object-contain p-2" />
    ) : (
      <span className="text-xl">{icon || "🏷️"}</span>
    )}
  </span>
);

// Full category browser shown as an overlay on top of the marketplace, opened
// from the hero sidebar's "View more". Deliberately not a route: the shopper
// keeps their place on the page and closing returns them to it untouched.
const CategoryMegaMenu = ({ open, onClose }) => {
  const { navigate, customTopCategories, subcategoriesByParent } = useAppContext();
  const departments = useMemo(() => buildTopCategoryRail(customTopCategories), [customTopCategories]);
  const [activeValue, setActiveValue] = useState(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => setMounted(true), []);

  const activeDepartment =
    departments.find((department) => department.value === activeValue) || departments[0] || null;

  const subcategories = (subcategoriesByParent.get(activeDepartment?.value) || [])
    .filter((subcategory) => subcategory.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Close on Escape, lock background scroll, and hand focus to the panel so
  // keyboard users land inside it rather than behind it.
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  // Reset to the first department each time it reopens, so the panel never
  // opens showing a department the shopper last skimmed past.
  useEffect(() => {
    if (open) setActiveValue(null);
  }, [open]);

  if (!open || !mounted) return null;

  const go = (href) => {
    onClose();
    navigate(href);
  };

  // Portalled to <body>: rendered in place, the sticky navbar painted over the
  // panel and the backdrop stopped short of it, because an ancestor's transform
  // makes `fixed` resolve against that ancestor instead of the viewport.
  // No breakpoint gate here: the only trigger is the hero sidebar, which itself
  // only exists from md up. Gating this at lg left the md–lg range with a
  // "View more" button that opened nothing.
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close categories"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-gray-950/40 backdrop-blur-[2px]"
      />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="All categories"
          tabIndex={-1}
          className="animate-slide-up pointer-events-auto relative mt-10 flex h-[min(34rem,calc(100vh-8rem))] w-full max-w-[68rem] overflow-hidden rounded-2xl bg-white shadow-[0_32px_90px_rgba(15,23,42,0.28)] focus:outline-none"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Left rail: every department. Hover or focus previews it on the
              right; clicking opens the department itself. */}
          <nav
            aria-label="Departments"
            className="category-rail-scroll min-h-0 w-[16rem] shrink-0 overflow-y-auto overscroll-contain border-r border-gray-100 py-2"
          >
            {departments.map((department) => {
              const isActive = department.value === activeDepartment?.value;
              return (
                <button
                  key={department.value}
                  type="button"
                  onMouseEnter={() => setActiveValue(department.value)}
                  onFocus={() => setActiveValue(department.value)}
                  onClick={() => go(buildCategoryHref(department.value))}
                  className={`group flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 ${
                    isActive ? "bg-orange-50/70 font-bold text-gray-950" : "font-medium text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden">
                      {department.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={department.imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-sm" aria-hidden="true">{department.icon || "🏷️"}</span>
                      )}
                    </span>
                    <span className="truncate">{department.label}</span>
                  </span>
                  <span className={`shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${isActive ? "text-orange-600" : "text-gray-300"}`}>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right pane: the selected department's shelves. */}
          <section className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="mb-4 flex items-center justify-between gap-4 pr-10">
              <h2 className="truncate text-lg font-black text-gray-950">{activeDepartment?.label}</h2>
              <button
                type="button"
                onClick={() => go(buildCategoryHref(activeDepartment.value))}
                className="shrink-0 text-[12px] font-bold text-orange-600 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                Browse all {activeDepartment?.label} →
              </button>
            </div>

            {subcategories.length ? (
              <div className="grid grid-cols-4 gap-x-4 gap-y-5 xl:grid-cols-6">
                {subcategories.map((subcategory) => (
                  <button
                    key={subcategory._id}
                    type="button"
                    onClick={() => go(subcategoryHref(activeDepartment.value, subcategory.name))}
                    className="group flex min-w-0 flex-col items-center gap-2 rounded-lg p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <TileGlyph icon={subcategory.icon} imageUrl={subcategory.imageUrl} />
                    <span className="line-clamp-2 text-[11.5px] font-medium leading-4 text-gray-700 transition-colors group-hover:text-orange-600">
                      {subcategory.name}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => go(buildCategoryHref(activeDepartment.value))}
                  className="group flex min-w-0 flex-col items-center gap-2 rounded-lg p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100 transition group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-200">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[11.5px] font-semibold leading-4 text-gray-700 transition-colors group-hover:text-orange-600">
                    View all
                  </span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-800">
                  No shelves set up for {activeDepartment?.label} yet
                </p>
                <button
                  type="button"
                  onClick={() => go(buildCategoryHref(activeDepartment.value))}
                  className="mt-3 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Browse {activeDepartment?.label}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategoryMegaMenu;
