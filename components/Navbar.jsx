"use client"

import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton, useUser, useAuth } from "@clerk/nextjs";
import { NavbarUserSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { usePathname } from "next/navigation";
import { buildCategoryHref, homeCategoryValues, getCategoryMeta } from "@/lib/marketplaceCategories";
import CategoryLineIcon from "@/components/CategoryLineIcon";
import SearchPanel, { MobileSearchBody } from "@/components/SearchPanel";
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/recentSearches";

// Tolerates a single typo (one insertion, deletion, or substitution) so
// searches like "nkie" still find "nike".
const isWithinOneEdit = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else { i += 1; j += 1; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

// Ranking per marketplace convention: exact > prefix > word-boundary >
// substring > fuzzy (typo-tolerant). -1 means no match.
const getTextMatchScore = (rawText, query) => {
  const text = String(rawText || "").toLowerCase();
  if (!text) return -1;
  if (text === query) return 0;
  if (text.startsWith(query)) return 1;
  if (text.includes(` ${query}`)) return 2;
  if (text.includes(query)) return 3;
  if (query.length >= 4) {
    for (const token of text.split(/\s+/)) {
      if (isWithinOneEdit(token, query)) return 4;
    }
  }
  return -1;
};

const userButtonAppearance = {
  elements: {
    avatarBox: "h-9 w-9 rounded-full ring-1 ring-gray-200 shadow-sm overflow-hidden",
    userButtonTrigger: "focus:shadow-none",
  },
};

const formatBadgeCount = (count) => {
  if (count > 99) return "99+";
  return String(count);
};

const NotificationIcon = () => (
  <svg className="h-5 w-5 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 5a4 4 0 0 0-4 4v2.9c0 .5-.2 1-.5 1.4L6 15h12l-1.5-1.7c-.3-.4-.5-.9-.5-1.4V9a4 4 0 0 0-4-4Zm0 14a2.5 2.5 0 0 0 2.4-2H9.6A2.5 2.5 0 0 0 12 19Z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
  </svg>
);

const UserLineIcon = () => (
  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const AccountMenuIcon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    profile: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    address: "M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    payment: "M4 7h16v10H4V7Zm0 3h16M7 15h3",
    admin: "M12 3 19 6v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Zm0 6v4m0 3h.01",
    seller: "M5 8h14l-1 11H6L5 8Zm2-4h10l2 4H5l2-4Zm2 8h.01M15 12h.01",
    vendor: "M6 3h12v18H6V3Zm3 4h6m-6 4h6m-6 4h3",
    orders: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
    track: "M4 7h10v9H4V7Zm10 3h3l3 3v3h-6v-6ZM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    delivery: "M4 7 12 3l8 4-8 4-8-4Zm0 0v10l8 4 8-4V7m-8 4v10",
    returns: "M4 7v5h5M20 17v-5h-5M6.4 9A7 7 0 0 1 18 7.8M17.6 15A7 7 0 0 1 6 16.2",
    wishlist: "M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z",
    help: "M12 18h.01M9.2 9a3 3 0 1 1 4.5 2.6c-1 .6-1.7 1.2-1.7 2.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    chat: "M4 5h16v11H8l-4 4V5Zm5 5h.01M12 10h.01M15 10h.01",
    bell: "M12 5a4 4 0 0 0-4 4v2.9c0 .5-.2 1-.5 1.4L6 15h12l-1.5-1.7c-.3-.4-.5-.9-.5-1.4V9a4 4 0 0 0-4-4Zm0 14a2.5 2.5 0 0 0 2.4-2H9.6A2.5 2.5 0 0 0 12 19Z",
    globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18",
    settings: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    logout: "M10 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2M3 12h12m0 0-3-3m3 3-3 3",
    account: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    cart: "M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2M10 20h.01M17 20h.01",
    plus: "M12 5v14M5 12h14",
  };

  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[type] || paths.profile} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const SearchIcon = () => (
  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
  </svg>
);

// Animated placeholder overlay: shows "Search "<product name>"" where the
// name rotates and each new name rolls up + fades in (via .animate-search-hint,
// re-mounted by the `key`). Owns its own 2.6s ticker so the rotation only
// re-renders this tiny overlay — not the entire Navbar.
const AnimatedSearchHint = ({ visible, words = [], textSize = "text-[13px]" }) => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [words]);

  const word = words.length ? words[wordIndex % words.length] : "";
  if (!visible || !word) return null;
  return (
    <span className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-gray-400 ${textSize}`} aria-hidden="true">
      <span className="shrink-0">Search </span>
      <span key={word} className="animate-search-hint ml-1 inline-block min-w-0 truncate font-medium text-gray-500">&ldquo;{word}&rdquo;</span>
    </span>
  );
};

const ChevronDown = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = () => (
  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UgandaFlag = ({ className = "h-6 w-6" }) => (
  <span className={`inline-flex shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm ${className}`} aria-hidden="true">
    <span className="grid h-full w-full grid-rows-6">
      <span className="bg-black" />
      <span className="bg-[#fcd116]" />
      <span className="bg-[#d21034]" />
      <span className="bg-black" />
      <span className="bg-[#fcd116]" />
      <span className="bg-[#d21034]" />
    </span>
  </span>
);

const CategoryGlyph = ({ category, className = "h-5 w-5" }) => {
  const iconPaths = {
    Fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
    "Beauty & Cosmetics": "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
    "Health & Personal Care": "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
    "Home & Living": "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
    "Phones & Tablets": "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
    "Computers & Electronics": "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
    Audio: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
    "Watches & Wearables": "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
    Accessories: "M8 7V5a2 2 0 0 1 4 0v2m4 0V5a2 2 0 0 1 4 0v2M7 7h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V7ZM4 12h3",
    Appliances: "M7 4h10v16H7V4Zm2 3h6m-5 10h4m-5-6h6v4H9v-4Z",
    "Baby Products": "M8 10a4 4 0 0 1 8 0v2h1.5A2.5 2.5 0 0 1 20 14.5V19H4v-4.5A2.5 2.5 0 0 1 6.5 12H8v-2Zm2 7h.1M14 17h.1M10 9h4",
    "Office & Stationery": "M5 19l4-1 10-10-3-3L6 15l-1 4Zm10-13 3 3M5 5h6M5 9h3",
    "Sports & Outdoors": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
    Automotive: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9",
    "Books & Learning": "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
    "Construction & Tools": "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
  };

  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={iconPaths[category] || iconPaths.Accessories} stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const getCategoryChildren = (category) => ([
  ["Top deals", `${buildCategoryHref(category)}&filter=flash`],
  ["New arrivals", `${buildCategoryHref(category)}&sort=newest`],
  ["Best sellers", `${buildCategoryHref(category)}&sort=popular`],
]);

// Category thumb inside the desktop hover dropdown: the admin-uploaded
// product PNG when one exists (same image as the homepage rail), line icon
// only as a fallback.
const DropdownCategoryThumb = ({ category, imageUrl, boxClassName, iconClassName }) => (
  <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md ${boxClassName}`}>
    {imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />
    ) : (
      <CategoryLineIcon category={category} className={iconClassName} />
    )}
  </span>
);

const CategoryDropdown = ({ categories, activeCategory, setActiveCategory, goTo, imagesByName, className = "" }) => {
  const selectedCategory = activeCategory || categories[0];
  const selectedMeta = getCategoryMeta(selectedCategory);
  const getCategoryImage = (category) => imagesByName?.get(category) || "";

  return (
    <div className={`grid overflow-hidden rounded-xl border border-gray-100 bg-white text-sm font-medium shadow-[0_20px_50px_rgba(15,23,42,0.14)] ${className}`}>
      <div className="max-h-[24rem] overflow-y-auto border-r border-gray-100 p-1.5">
        {categories.map((category) => {
          const meta = getCategoryMeta(category);
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              type="button"
              onMouseEnter={() => setActiveCategory(category)}
              onFocus={() => setActiveCategory(category)}
              onClick={() => goTo(buildCategoryHref(category))}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${isActive ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"}`}
            >
              <DropdownCategoryThumb
                category={category}
                imageUrl={getCategoryImage(category)}
                boxClassName="h-7 w-7 bg-gray-50 text-orange-600"
                iconClassName="h-3.5 w-3.5"
              />
              <span className="min-w-0 flex-1 truncate text-[12px]">{meta.label}</span>
              <span className="shrink-0 text-gray-300"><ChevronRight /></span>
            </button>
          );
        })}
      </div>
      <div className="min-w-0 p-2.5">
        <div className="mb-1.5 flex items-center gap-2.5 rounded-lg bg-gray-50 px-2.5 py-2.5">
          <DropdownCategoryThumb
            category={selectedCategory}
            imageUrl={getCategoryImage(selectedCategory)}
            boxClassName="h-9 w-9 bg-white text-orange-600 shadow-sm"
            iconClassName="h-4 w-4"
          />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-gray-950">{selectedMeta.label}</p>
            <p className="line-clamp-2 text-[11px] font-normal leading-4 text-gray-500">{selectedMeta.description}</p>
          </div>
        </div>
        <div className="grid gap-0.5">
          {getCategoryChildren(selectedCategory).map(([label, href]) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(href)}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-gray-700 transition hover:bg-orange-50 hover:text-orange-600"
            >
              {label}
              <span className="shrink-0 text-gray-300"><ChevronRight /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StoreLogo = () => (
  <Image className="h-auto w-28 md:w-32" src={assets.logo} alt="KawilMart" priority />
);

const MobileStoreMark = () => (
  <span className="flex h-8 items-center" aria-label="KawilMart">
    <Image src={assets.logo} alt="KawilMart" width={142} height={42} className="h-[26px] w-auto object-contain" priority />
  </span>
);

const DockIcon = ({ type, className = "h-6 w-6" }) => {
  const paths = {
    home: "m4 12 8-8 8 8M6 10.5V20h4v-4h4v4h4v-9.5",
    categories: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    cart: "M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2M10 20h.01M17 20h.01",
    orders: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
    account: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  };

  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const NavAction = ({ children, label, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex min-w-[4.25rem] flex-col items-center gap-1 text-xs font-medium text-gray-900 transition hover:text-orange-600"
  >
    <span className="relative">
      {children}
      {badge > 0 && (
        <span className="absolute -right-2.5 -top-2.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {formatBadgeCount(badge)}
        </span>
      )}
    </span>
    {label}
  </button>
);

const NotificationPopover = ({ unreadCount, notifications, onNavigate, onMarkAllRead }) => {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  return (
    <div className="relative" onMouseEnter={handleOpen} onMouseLeave={handleClose}>
      <NavAction label="Alerts" onClick={() => onNavigate('/inbox')} badge={unreadCount}>
        <NotificationIcon />
      </NavAction>

      {open ? (
        <div className="absolute right-0 top-[4.05rem] z-50 w-[21rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.15)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-gray-950">Notifications</p>
              <p className="text-[11px] text-gray-500">{unreadCount > 0 ? `${unreadCount} unread updates` : "You're all caught up"}</p>
            </div>
            <button type="button" onClick={() => onNavigate('/inbox')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>

          <div className="max-h-[18rem] overflow-y-auto">
            {notifications.length ? notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => onNavigate('/inbox')}
                className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-gray-300" : "bg-blue-500"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-gray-950">{notification.title}</span>
                  <span className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{notification.message}</span>
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {notification.date ? new Date(notification.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                </span>
              </button>
            )) : (
              <div className="px-4 py-8 text-center text-[12px] text-gray-500">No notifications yet.</div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button type="button" onClick={onMarkAllRead} className="text-[11px] font-semibold text-gray-700 hover:text-gray-950">
              Mark all as read
            </button>
            <button type="button" onClick={() => onNavigate('/inbox')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
              Open inbox
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const AccountMenuSection = ({ title, items, onNavigate }) => (
  <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
    <h2 className="border-b border-gray-100 px-3.5 py-2 text-[12px] font-bold text-gray-500">{title}</h2>
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onNavigate(item.href)}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-950">
            <AccountMenuIcon type={item.icon} className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-gray-950">{item.label}</span>
          {item.badge ? (
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">{item.badge}</span>
          ) : null}
          <ChevronRight />
        </button>
      ))}
    </div>
  </section>
);

const MobilePageHeader = ({ title, showSearch, onSearch }) => (
  <div className="sticky top-0 z-40 border-b border-gray-200/80 bg-[#f8fafc]/95 px-3 pb-1.5 pt-2.5 backdrop-blur-sm md:hidden">
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center gap-2">
      <button type="button" onClick={() => window.history.back()} aria-label="Go back" className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700">
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <h1 className="truncate text-center text-[13px] font-bold text-gray-950">{title}</h1>
      {showSearch ? (
        <button type="button" onClick={onSearch} aria-label="Open search" className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700">
          <SearchIcon />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  </div>
);

const Navbar = ({ hideMobileHeader = false, mobilePageTitle = "", showMobilePageSearch = true }) => {
  const appContext = useAppContext();
  if (!appContext) {
    return null;
  }

  const {
    isSeller,
    isAdmin,
    isRider,
    navigate,
    prefetchRoute,
    resolvedRole,
    setIsRouteLoading,
    getCartCount,
    unreadNotificationsCount,
    recentNotifications,
    markAllNotificationsAsRead,
    products,
    formatCurrency,
    cartIconRef,
    cartBumpTick,
    brands,
    customTopCategories,
  } = appContext;
  const headerRef = useRef(null);
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { openSignIn, openUserProfile, signOut } = useClerk();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeCategory, setActiveCategory] = useState(homeCategoryValues[0]);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const clerkReady = isUserLoaded && isAuthLoaded;
  const cartCount = getCartCount();
  const isAuthenticated = Boolean(user);
  const userRole = resolvedRole || user?.publicMetadata?.role;
  const showAdmin = isAdmin || userRole === 'admin';
  const showRider = isRider || userRole === 'rider';
  const showSeller = isSeller || userRole === 'seller' || userRole === 'admin';

  // Smart search placeholder — cycles through real product names instead of
  // static text, so the search bar hints at what's actually in the catalog.
  const searchPlaceholderNames = useMemo(() => {
    const names = products.map((product) => product?.name).filter(Boolean);
    return [...new Set(names)].slice(0, 15);
  }, [products]);
  const hasPlaceholderWords = searchPlaceholderNames.length > 0;

  // Predictive results while typing, grouped and ranked like a real
  // marketplace search (exact > prefix > keyword > fuzzy typo-match), with
  // matching brands, categories, and seller stores alongside products.
  const predictiveMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { products: [], brands: [], categories: [], stores: [] };

    const scoredProducts = [];
    for (const product of products) {
      const score = getTextMatchScore(product?.name, query);
      if (score >= 0) scoredProducts.push({ product, score });
    }
    const productMatches = scoredProducts
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((entry) => entry.product);

    const brandMatches = (brands || [])
      .map((brand) => ({ brand, score: getTextMatchScore(brand?.name, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((entry) => entry.brand);

    // Admin-added top-level categories can share names with the static
    // defaults (e.g. a "Fashion" record created just to hold an uploaded
    // icon) — de-duplicate case-insensitively so search never lists a
    // category twice (also keeps React keys unique).
    const seenCategoryValues = new Set();
    const categoryOptions = [
      ...homeCategoryValues.map((value) => ({ value, label: getCategoryMeta(value).label })),
      ...(customTopCategories || []).map((category) => ({ value: category.name, label: category.name })),
    ].filter((category) => {
      const dedupeKey = String(category.value || "").toLowerCase();
      if (!dedupeKey || seenCategoryValues.has(dedupeKey)) return false;
      seenCategoryValues.add(dedupeKey);
      return true;
    });
    const imageByCategoryName = new Map(
      (customTopCategories || []).map((category) => [category.name, category.imageUrl || ""])
    );
    const categoryMatches = categoryOptions
      .map((category) => ({ category, score: getTextMatchScore(category.label, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((entry) => ({ ...entry.category, imageUrl: imageByCategoryName.get(entry.category.value) || "" }));

    const storesByName = new Map();
    for (const product of products) {
      const storeName = product?.sellerProfile?.name;
      const sellerId = product?.userId;
      if (!storeName || !sellerId || storesByName.has(storeName)) continue;
      storesByName.set(storeName, { id: String(sellerId), name: storeName, avatarUrl: product?.sellerProfile?.avatarUrl || "" });
    }
    const storeMatches = [...storesByName.values()]
      .map((store) => ({ store, score: getTextMatchScore(store.name, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((entry) => entry.store);

    return { products: productMatches, brands: brandMatches, categories: categoryMatches, stores: storeMatches };
  }, [products, brands, customTopCategories, searchQuery]);

  // Empty-state recommendations for the desktop panel's Top Suggestions
  // column: proven sellers first.
  const recommendedProducts = useMemo(
    () => [...products].sort((a, b) => (Number(b?.soldCount) || 0) - (Number(a?.soldCount) || 0)).slice(0, 5),
    [products]
  );

  // Trending searches derived from the real catalog (top categories + top
  // brands by listing count) — never hardcoded, so it can't drift from what
  // actually exists in the store.
  const trendingSearchTerms = useMemo(() => {
    const categoryCounts = new Map();
    products.forEach((product) => {
      const category = product?.category;
      if (!category) return;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value]) => getCategoryMeta(value).label);
    const topBrands = (brands || []).slice(0, 3).map((brand) => brand.name).filter(Boolean);
    return [...new Set([...topCategories, ...topBrands])].slice(0, 6);
  }, [products, brands]);

  // Admin-uploaded category PNGs by category name (same images the homepage
  // rail uses) — shared by the search panel and the hover category dropdowns.
  const categoryImagesByName = useMemo(
    () => new Map((customTopCategories || []).map((category) => [category.name, category.imageUrl || ""])),
    [customTopCategories]
  );

  // Popular category tiles show the admin-uploaded PNG whenever one exists;
  // the line icon is only a fallback.
  const popularCategoryTiles = useMemo(
    () => homeCategoryValues.slice(0, 8).map((value) => ({
      value,
      label: getCategoryMeta(value).label,
      imageUrl: categoryImagesByName.get(value) || "",
    })),
    [categoryImagesByName]
  );

  const featuredBrandTiles = useMemo(() => (brands || []).slice(0, 6), [brands]);

  const [recentSearches, setRecentSearches] = useState([]);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const recordSearchTerm = (term) => {
    if (!term?.trim()) return;
    setRecentSearches(addRecentSearch(term));
  };

  const closeSearchPanel = () => {
    setSearchFocused(false);
    setIsMobileSearchActive(false);
    if (typeof document !== 'undefined') document.activeElement?.blur?.();
  };

  const pickSuggestedProduct = (product) => {
    setSearchQuery('');
    closeSearchPanel();
    navigate(`/product/${product._id}`);
  };

  const submitSearchQuery = () => {
    if (!searchQuery.trim()) return;
    recordSearchTerm(searchQuery);
    navigate(`/all-products?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    closeSearchPanel();
  };

  const pickSearchTerm = (term) => {
    recordSearchTerm(term);
    navigate(`/all-products?search=${encodeURIComponent(term)}`);
    setSearchQuery('');
    closeSearchPanel();
  };

  const removeSearchTerm = (term) => setRecentSearches(removeRecentSearch(term));
  const clearSearchTerms = () => setRecentSearches(clearRecentSearches());

  const pickSearchCategory = (categoryValue) => {
    setSearchQuery('');
    closeSearchPanel();
    navigate(buildCategoryHref(categoryValue));
  };

  const pickSearchBrand = (brand) => {
    setSearchQuery('');
    closeSearchPanel();
    navigate(`/all-products?brand=${encodeURIComponent(brand.name)}`);
  };

  const pickSearchStore = (store) => {
    setSearchQuery('');
    closeSearchPanel();
    navigate(`/store/${encodeURIComponent(store.id)}`);
  };

  const goToAllCategories = () => {
    setSearchQuery('');
    closeSearchPanel();
    navigate('/categories');
  };

  // Shared prop bundle for the desktop mega panel + mobile overlay body.
  const searchPanelProps = {
    query: searchQuery,
    recentSearches,
    trendingTerms: trendingSearchTerms,
    popularCategories: popularCategoryTiles,
    featuredBrands: featuredBrandTiles,
    recommendedProducts,
    productMatches: predictiveMatches.products,
    brandMatches: predictiveMatches.brands,
    categoryMatches: predictiveMatches.categories,
    storeMatches: predictiveMatches.stores,
    onPickTerm: pickSearchTerm,
    onRemoveRecent: removeSearchTerm,
    onClearRecent: clearSearchTerms,
    onPickProduct: pickSuggestedProduct,
    onPickBrand: pickSearchBrand,
    onPickCategory: pickSearchCategory,
    onPickStore: pickSearchStore,
    onViewAllCategories: goToAllCategories,
    onSubmit: submitSearchQuery,
    formatCurrency,
  };
  const showSearchHint = !searchQuery && !searchFocused && hasPlaceholderWords;
  // Static fallback placeholder kept on the input for accessibility; the
  // animated overlay covers it when visible.
  const searchInputPlaceholder = showSearchHint ? "" : "Search for products, brands...";

  const handleSearch = (e) => {
    e.preventDefault();
    closeDropdown();
    if (searchQuery.trim()) {
      recordSearchTerm(searchQuery);
      navigate(`/all-products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      closeSearchPanel();
    }
  };

  const closeDropdown = () => setOpenDropdown(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((current) => current === name ? null : name);
  };

  const goTo = (href) => {
    closeDropdown();
    setIsMobileAccountOpen(false);
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  const requireAuthNavigation = (href) => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }

    goTo(href);
  };

  const openMobileAccount = () => {
    if (!user) {
      openSignIn();
      return;
    }

    closeDropdown();
    setIsMobileMenuOpen(false);
    setIsMobileAccountOpen(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('search') || '');
    setIsMobileAccountOpen(false);
    setIsMobileSearchActive(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.style.overflow = (isMobileAccountOpen || isMobileSearchActive || isMobileMenuOpen) ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileAccountOpen, isMobileMenuOpen, isMobileSearchActive]);

  // Publishes the sticky header's real height as --app-header-h so pages that
  // pin their own bars beneath it (the legal center's tab rail, for one) can
  // offset off a live measurement instead of a magic number that silently
  // breaks every time the navbar's padding changes.
  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const publishHeight = () => {
      const height = node.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty('--app-header-h', `${Math.round(height)}px`);
      }
    };

    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(node);

    return () => observer.disconnect();
  }, [hideMobileHeader]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncViewport = (event) => setIsDesktopViewport(event.matches);
    setIsDesktopViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    const routes = ['/', '/categories', '/all-products', '/cart', '/my-orders', '/inbox'];
    if (showSeller) routes.push('/seller');
    if (showAdmin) routes.push('/admin');
    if (showRider) routes.push('/dashboard/rider');
    routes.forEach((route) => prefetchRoute(route));
  }, [prefetchRoute, showAdmin, showRider, showSeller]);

  const beginLinkNavigation = (href) => {
    if (href !== pathname) setIsRouteLoading(true);
  };

  const isDockActive = (item) => {
    if (item.key === "home") return pathname === "/";
    if (item.key === "categories") return pathname === "/categories";
    if (item.key === "cart") return pathname === "/cart";
    if (item.key === "orders") return pathname === "/my-orders";
    return false;
  };

  const renderUserButton = ({ showName = false, includeMobileLinks = false, badgeClassName }) => (
    <div className="relative inline-flex items-center justify-center pr-1 pt-1">
      {unreadNotificationsCount > 0 && (
        <span className={badgeClassName}>
          {formatBadgeCount(unreadNotificationsCount)}
        </span>
      )}
      <UserButton showName={showName} userProfileMode="modal" appearance={userButtonAppearance}>
        <UserButton.MenuItems>
          {includeMobileLinks ? <UserButton.Link label="Home" labelIcon={<HomeIcon />} href="/" /> : null}
          {includeMobileLinks ? <UserButton.Link label="Products" labelIcon={<BoxIcon />} href="/all-products" /> : null}
          <UserButton.Link label="Cart" labelIcon={<CartIcon />} href="/cart" />
          <UserButton.Link label="My Orders" labelIcon={<BagIcon />} href="/my-orders" />
          <UserButton.Link label="Inbox" labelIcon={<NotificationIcon />} href="/inbox" />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );

  const accountSections = [
    {
      title: "Account & Management",
      items: [
        { label: "My Profile", href: "profile", icon: "profile" },
        { label: "Address Book", href: "/address-book", icon: "address" },
        { label: "My Payment Methods", href: "/payment-methods", icon: "payment" },
        showAdmin ? { label: "Admin Dashboard", href: "/admin", icon: "admin", badge: "Admin" } : null,
        showSeller ? { label: "Seller Dashboard", href: "/seller", icon: "seller", badge: "Seller" } : null,
        showRider ? { label: "Delivery Dashboard", href: "/dashboard/rider", icon: "delivery", badge: "Rider" } : null,
      ].filter(Boolean),
    },
    {
      title: "Orders & Services",
      items: [
        { label: "My Orders", href: "/my-orders", icon: "orders" },
        { label: "Track Order", href: "/my-orders", icon: "track" },
        // Riders get their own dashboard here; for everyone else this pointed
        // at /my-orders and was a straight duplicate of the row above it.
        showRider ? { label: "Deliveries", href: "/dashboard/rider", icon: "delivery" } : null,
        { label: "Returns & Refunds", href: "/legal#terms", icon: "returns" },
        { label: "Wishlist", href: "/wishlist", icon: "wishlist" },
      ].filter(Boolean),
    },
    {
      title: "Support & More",
      items: [
        { label: "Help Center", href: "/help", icon: "help" },
        { label: "Become a Vendor", href: "/become-a-vendor", icon: "seller" },
        { label: "Chat with Us", href: "/inbox?tab=support", icon: "chat" },
        { label: "Notifications", href: "/inbox", icon: "bell" },
        // "Language & Currency" lived here but pointed at /about. The app has
        // no i18n and prices are UGX-only, so a switcher would be a control
        // that changes nothing. Re-add it when there is a second locale.
        { label: "Shopping Help", href: "/help/shopping", icon: "help" },
      ],
    },
  ];

  const handleAccountNavigate = (href) => {
    if (href === "profile") {
      setIsMobileAccountOpen(false);
      openUserProfile?.();
      return;
    }

    goTo(href);
  };

  const handleMobileLogout = async () => {
    setIsMobileAccountOpen(false);
    await signOut?.();
    startTransition(() => {
      navigate('/');
    });
  };

  return (
    <>
      {isMobileAccountOpen && user ? (
        <div className="fixed inset-x-0 top-0 bottom-[var(--app-dock-h)] z-[47] overflow-y-auto bg-white md:hidden">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-3.5 pb-2.5 pt-7 backdrop-blur">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setIsMobileAccountOpen(false)} aria-label="Close account menu" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-950">
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-base font-extrabold text-gray-950">My Account</h1>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleAccountNavigate("/inbox")} aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-950">
                  <AccountMenuIcon type="bell" className="h-5 w-5" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute right-0 top-0 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-1 text-[11px] font-extrabold leading-none text-white">
                      {formatBadgeCount(unreadNotificationsCount)}
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={() => openUserProfile?.()} aria-label="Account settings" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-950">
                  <AccountMenuIcon type="settings" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-3.5 pb-5 pt-3">
            <section className="flex items-center gap-2.5">
              <Image
                src={user.imageUrl || assets.user_icon}
                alt={user.fullName || "Account avatar"}
                width={60}
                height={60}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-extrabold text-gray-950">{user.fullName || user.username || "KawilMart shopper"}</h2>
                <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{user.primaryEmailAddress?.emailAddress || "No email added"}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600"><UgandaFlag className="h-4 w-4" />Uganda, UGX</p>
              </div>
              <button type="button" onClick={() => openUserProfile?.()} className="shrink-0 rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-extrabold text-orange-600">
                View Profile
              </button>
            </section>

            <div className="mt-4 space-y-3">
              {accountSections.map((section) => (
                <AccountMenuSection key={section.title} title={section.title} items={section.items} onNavigate={handleAccountNavigate} />
              ))}

              <button
                type="button"
                onClick={() => void handleMobileLogout()}
                className="flex w-full items-center justify-between rounded-lg bg-rose-50 px-3.5 py-3 text-left shadow-sm transition hover:bg-rose-100"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center text-rose-600">
                    <AccountMenuIcon type="logout" className="h-5 w-5" />
                  </span>
                  <span className="text-[13px] font-semibold text-rose-700">Logout</span>
                </span>
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMobileSearchActive ? (
        <div className="fixed inset-0 z-[45] flex flex-col bg-white md:hidden">
          <form onSubmit={handleSearch} className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-3 py-2.5">
            <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-gray-200 bg-white px-3 shadow-sm">
              <span className="shrink-0 text-gray-400"><SearchIcon /></span>
              <div className="relative min-w-0 flex-1 px-2">
                <AnimatedSearchHint visible={!searchQuery && hasPlaceholderWords} words={searchPlaceholderNames} textSize="text-xs" />
                <input
                  autoFocus
                  type="text"
                  placeholder={hasPlaceholderWords ? "" : "Search for products, brands..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0 w-full py-2 text-xs outline-none placeholder:text-gray-400"
                />
              </div>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                >
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); closeSearchPanel(); }}
              className="shrink-0 text-[12.5px] font-semibold text-gray-600"
            >
              Cancel
            </button>
          </form>
          {/* pb clears the bottom dock + raised cart FAB, which stay on top */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-20">
            <MobileSearchBody {...searchPanelProps} />
          </div>
        </div>
      ) : null}

      {isMobileMenuOpen ? (
        <div className="fixed inset-x-0 top-0 bottom-[var(--app-dock-h)] z-[47] bg-black/35 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="h-full w-[82vw] max-w-[20rem] overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-gray-100 bg-white px-3.5 py-3">
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-950">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
              <MobileStoreMark />
            </div>
            <div className="divide-y divide-gray-100">
              <section className="px-3.5 py-2">
                <button type="button" onClick={() => goTo('/help')} className="flex w-full items-center justify-between py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Need help?
                  <ChevronRight />
                </button>
                <button type="button" onClick={() => user ? openMobileAccount() : openSignIn()} className="flex w-full items-center justify-between py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  My KawilMart account
                  <ChevronRight />
                </button>
              </section>
              <section className="px-3.5 py-2">
                {[
                  ["Orders", "/my-orders", "orders"],
                  ["Inbox", "/inbox", "bell"],
                  ["Wishlist", "/wishlist", "wishlist"],
                  ["Become a Vendor", "/become-a-vendor", "seller"],
                ].map(([label, href, icon]) => (
                  <button key={label} type="button" onClick={() => requireAuthNavigation(href)} className="flex w-full items-center gap-3 py-2.5 text-left text-sm font-medium text-gray-900">
                    <AccountMenuIcon type={icon} className="h-5 w-5 text-gray-800" />
                    {label}
                  </button>
                ))}
              </section>
              <section className="px-3.5 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Our categories</h2>
                  <button type="button" onClick={() => goTo('/categories')} className="text-xs font-semibold text-orange-600">See All</button>
                </div>
                {popularCategoryTiles.slice(0, 8).map((category) => (
                  <button key={category.value} type="button" onClick={() => goTo(buildCategoryHref(category.value))} className="flex w-full items-center gap-3 py-2.5 text-left text-sm font-medium text-gray-900">
                    <DropdownCategoryThumb
                      category={category.value}
                      imageUrl={category.imageUrl}
                      boxClassName="h-6 w-6 bg-white text-gray-900"
                      iconClassName="h-5 w-5"
                    />
                    {category.label}
                  </button>
                ))}
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {hideMobileHeader && mobilePageTitle ? (
        <MobilePageHeader
          title={mobilePageTitle}
          showSearch={showMobilePageSearch}
          onSearch={() => setIsMobileSearchActive(true)}
        />
      ) : null}

      <header ref={headerRef} className={`sticky top-0 z-40 border-b border-gray-200 bg-white ${hideMobileHeader ? "hidden md:block" : ""}`}>
        <div className="hidden border-b border-gray-100 text-xs text-gray-600 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <span className="font-medium text-gray-700">Uganda's marketplace for everyday essentials</span>
            <div className="flex items-center gap-10">
              <button type="button" onClick={() => goTo('/seller')} className="transition hover:text-orange-600">Sell on KawilMart</button>
              <button type="button" onClick={() => requireAuthNavigation('/my-orders')} className="transition hover:text-orange-600">Track Order</button>
              <button type="button" onClick={() => navigate('/help')} className="transition hover:text-orange-600">Help Center</button>
              <button type="button" onClick={() => navigate('/become-a-vendor')} className="transition hover:text-orange-600">Become a Vendor</button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 md:flex-nowrap md:gap-3 md:px-5 md:py-2.5 lg:gap-5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-950 md:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <Link href="/" prefetch className="shrink-0" onClick={() => beginLinkNavigation("/")}>
            <span className="md:hidden"><MobileStoreMark /></span>
            <span className="hidden md:block"><StoreLogo /></span>
          </Link>

          <form onSubmit={handleSearch} className="relative hidden h-11 min-w-0 flex-1 items-center rounded-full border border-gray-200 bg-white shadow-sm md:flex">
            <div
              className="relative hidden h-full shrink-0 lg:block"
              onMouseLeave={() => openDropdown === 'search-categories' ? closeDropdown() : undefined}
            >
              <button
                type="button"
                onMouseEnter={() => setOpenDropdown('search-categories')}
                onClick={() => toggleDropdown('search-categories')}
                className="flex h-full items-center gap-1.5 border-r border-gray-200 pl-4 pr-3 text-[12.5px] font-semibold text-gray-900 transition hover:text-orange-600"
              >
                All Categories
                <span className="text-gray-500"><ChevronDown /></span>
              </button>
              {openDropdown === 'search-categories' ? (
                <CategoryDropdown
                  categories={homeCategoryValues.slice(0, 12)}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  goTo={goTo}
                  imagesByName={categoryImagesByName}
                  className="absolute left-0 top-full z-50 w-[min(30rem,calc(100vw-4rem))] grid-cols-[13rem_minmax(0,1fr)]"
                />
              ) : null}
            </div>
            <div className="flex h-full min-w-0 flex-1 items-center gap-2 px-4">
              <span className="text-gray-400"><SearchIcon /></span>
              <div className="relative min-w-0 flex-1">
                <AnimatedSearchHint visible={showSearchHint} words={searchPlaceholderNames} textSize="text-[13px]" />
                <input
                  type="text"
                  placeholder={searchInputPlaceholder}
                  value={searchQuery}
                  onFocus={() => { setSearchFocused(true); if (openDropdown === 'search-categories') closeDropdown(); }}
                  onBlur={() => setSearchFocused(false)}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="min-w-0 w-full py-2 text-[12.5px] outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            <button type="submit" className="m-1 flex h-9 shrink-0 items-center rounded-full bg-orange-600 px-5 text-[12.5px] font-semibold text-white transition hover:bg-orange-700">
              Search
            </button>
            {searchFocused ? <SearchPanel {...searchPanelProps} /> : null}
          </form>

          <div className="ml-auto hidden items-center gap-4 md:flex">
            {isAuthenticated ? (
              <>
                <NavAction label="Orders" onClick={() => navigate('/my-orders')}><BagIcon /></NavAction>
                <NavAction label="Saved" onClick={() => navigate('/wishlist')}><HeartIcon /></NavAction>
                <NotificationPopover
                  unreadCount={unreadNotificationsCount}
                  notifications={recentNotifications}
                  onNavigate={navigate}
                  onMarkAllRead={() => void markAllNotificationsAsRead()}
                />
              </>
            ) : null}
            <NavAction label="My Cart" onClick={() => navigate('/cart')} badge={cartCount}><CartIcon /></NavAction>
            {!clerkReady || isDesktopViewport === null ? (
              <NavbarUserSkeleton showName />
            ) : user ? (
              renderUserButton({
                showName: true,
                badgeClassName: "pointer-events-none absolute right-0 top-0 z-20 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm",
              })
            ) : (
              <NavAction label="Sign In" onClick={openSignIn}><UserLineIcon /></NavAction>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSearchActive(true)}
            className="relative order-last flex h-9 w-full min-w-0 items-center rounded-full border border-gray-200 bg-white px-3 text-left shadow-sm md:hidden"
            aria-label="Open search"
          >
            <span className="shrink-0 text-gray-400"><SearchIcon /></span>
            <span className="relative min-w-0 flex-1 px-2">
              <AnimatedSearchHint visible={!searchQuery && hasPlaceholderWords} words={searchPlaceholderNames} textSize="text-[11.5px]" />
              <span className={`block truncate py-1.5 text-[11.5px] ${searchQuery ? "text-gray-900" : hasPlaceholderWords ? "text-transparent" : "text-gray-400"}`}>
                {searchQuery || (hasPlaceholderWords ? "." : "Search for products, brands...")}
              </span>
            </span>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <button type="button" onClick={() => navigate('/inbox')} aria-label="Open notifications" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-900">
                <NotificationIcon />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                    {formatBadgeCount(unreadNotificationsCount)}
                  </span>
                )}
              </button>
            ) : null}
            <button type="button" onClick={() => navigate('/cart')} aria-label="Open cart" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-900">
              <AccountMenuIcon type="cart" className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                  {formatBadgeCount(cartCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="hidden border-t border-gray-100 lg:block">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-2">
            <div className="relative flex items-center gap-7 text-[13px] font-semibold text-gray-950">
              <div
                className="relative"
                onMouseLeave={() => openDropdown === 'nav-categories' ? closeDropdown() : undefined}
              >
                <button type="button" onMouseEnter={() => setOpenDropdown('nav-categories')} onClick={() => navigate('/categories')} className="flex items-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 text-white transition hover:bg-orange-700">
                  <MenuIcon />
                  All category
                </button>
                {openDropdown === 'nav-categories' ? (
                  <CategoryDropdown
                    categories={homeCategoryValues.slice(0, 12)}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    goTo={goTo}
                    imagesByName={categoryImagesByName}
                    className="absolute left-0 top-full z-50 w-[min(30rem,calc(100vw-4rem))] grid-cols-[13rem_minmax(0,1fr)]"
                  />
                ) : null}
              </div>
              <button type="button" onClick={() => navigate('/all-products?filter=flash')} className="transition hover:text-orange-600">Hot offers</button>
              <button type="button" onClick={() => navigate('/all-products')} className="transition hover:text-orange-600">Recommendations</button>
              <button type="button" onClick={() => navigate('/all-products?tags=new-arrival')} className="transition hover:text-orange-600">New Arrivals</button>
              <button type="button" onClick={() => navigate('/all-products?tags=trending')} className="transition hover:text-orange-600">Bestsellers</button>
              <button type="button" onClick={() => navigate('/all-products')} className="transition hover:text-orange-600">Gift boxes</button>
              <div className="relative" onMouseLeave={() => openDropdown === 'help' ? closeDropdown() : undefined}>
                <button type="button" onMouseEnter={() => setOpenDropdown('help')} onClick={() => toggleDropdown('help')} className="inline-flex items-center gap-1 transition hover:text-orange-600">Help <ChevronDown /></button>
                {openDropdown === 'help' ? (
                  <div className="absolute left-0 top-full z-50 w-52 rounded-lg border border-gray-200 bg-white p-2 text-sm font-medium shadow-xl">
                    {[
                      ['Help Center', '/about'],
                      ['Track Order', '/my-orders'],
                      ['Returns & Refunds', '/legal#terms'],
                      ['Contact Us', '/about'],
                    ].map(([label, href]) => (
                      <button key={label} type="button" onClick={() => goTo(href)} className="block w-full rounded-md px-3 py-2 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {[
                showSeller ? { href: '/seller', label: 'Seller' } : null,
                showAdmin ? { href: '/admin', label: 'Admin' } : null,
                showRider ? { href: '/dashboard/rider', label: 'Deliveries' } : null,
              ].filter(Boolean).map((link) => (
                <button key={link.href} type="button" onClick={() => navigate(link.href)} className="rounded-md border border-orange-200 px-3 py-2 text-xs text-orange-700 transition hover:bg-orange-50">
                  {link.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-900 shadow-sm">
              <UgandaFlag />
              <span>Uganda, UGX</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-[48] bg-white/95 px-4 pb-1.5 pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
        <div className="relative mx-auto grid max-w-sm grid-cols-5 rounded-[1.25rem] border border-gray-100 bg-white px-1 py-1 text-[10px] font-semibold text-gray-500 shadow-sm">
          {[
            { key: "home", label: "Home", href: "/", icon: <DockIcon type="home" /> },
            { key: "categories", label: "Categories", href: "/categories", icon: <DockIcon type="categories" /> },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.href ? navigate(item.href) : openSignIn()}
              className={`relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl transition ${isDockActive(item) ? "bg-orange-50 text-orange-600" : "text-gray-500"}`}
            >
              {React.cloneElement(item.icon, { className: "h-5 w-5" })}
              {item.label}
            </button>
          ))}

          {/* Cart: raised circular FAB — the centerpiece of the dock and the
              landing target for the fly-to-cart animation. */}
          <div className="relative flex min-h-10 flex-col items-center justify-end gap-0.5">
            <button
              ref={cartIconRef}
              type="button"
              onClick={() => navigate('/cart')}
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_9px_20px_rgba(234,88,12,0.42)] ring-[4px] ring-white transition-transform active:scale-95"
            >
              {cartBumpTick > 0 ? (
                <span key={`burst-${cartBumpTick}`} className="pointer-events-none absolute inset-0 rounded-full animate-cart-burst" />
              ) : null}
              <span key={`icon-${cartBumpTick}`} className={cartBumpTick > 0 ? "animate-cart-bump" : ""}>
                <DockIcon type="cart" className="h-5 w-5" />
              </span>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {formatBadgeCount(cartCount)}
                </span>
              )}
            </button>
            <span className={`mt-7 transition ${pathname === "/cart" ? "text-orange-600" : "text-gray-500"}`}>Cart</span>
          </div>

          {[
            { key: "orders", label: "Orders", href: "/my-orders", icon: <DockIcon type="orders" /> },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.href ? navigate(item.href) : openSignIn()}
              className={`relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl transition ${isDockActive(item) ? "bg-orange-50 text-orange-600" : "text-gray-500"}`}
            >
              {React.cloneElement(item.icon, { className: "h-5 w-5" })}
              {item.label}
            </button>
          ))}
          {!clerkReady ? (
            <div className="flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl text-gray-500">
              <NavbarUserSkeleton />
              <span>Account</span>
            </div>
          ) : user ? (
            <div className={`relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl transition ${isMobileAccountOpen ? "text-orange-600" : "text-gray-500"}`}>
              <button type="button" onClick={openMobileAccount} aria-label="Open account menu" className="relative flex flex-col items-center gap-0.5">
                <DockIcon type="account" className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white shadow-sm">
                    {formatBadgeCount(unreadNotificationsCount)}
                  </span>
                )}
              </button>
              <span>Account</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl text-gray-500 transition hover:text-orange-600"
            >
              <UserLineIcon />
              Account
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
