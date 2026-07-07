'use client'

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Skeleton from "@/components/Skeleton";
import { buildCategoryHref, categoryMatchesSelection, getCategoryMeta } from "@/lib/marketplaceCategories";
import { useSearchParams } from "next/navigation";

const normalizeText = (value = "") => (
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const iconPaths = {
  electronics: "M5 7h14v9H5V7Zm-2 12h18M9 19l1-3m4 3-1-3M8 4h8",
  "mobiles-tablets": "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  laptops: "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
  tv: "M4 7h16v9H4V7Zm4 12h8m-4-3v3",
  cameras: "M5 7h3l1.5-2h5L16 7h3v12H5V7Zm7 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  audio: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
  gaming: "M6 10h12l1.2 6.2a2 2 0 0 1-1.9 2.4H6.7a2 2 0 0 1-1.9-2.4L6 10Zm3 3h.01M15 13h.01M9 7l1-2h4l1 2",
  wearables: "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
  accessories: "M7 7V5a2 2 0 0 1 4 0v2m4 0V5a2 2 0 0 1 4 0v2M7 7h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V7Zm-3 5h3",
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  appliances: "M7 4h10v16H7V4Zm2 3h6m-5 10h4m-5-6h6v4H9v-4Z",
  beauty: "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
  fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
  health: "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
  sports: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  automotive: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9",
  tools: "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
  books: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
  groceries: "M6 6h13l-1.4 9.4a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L5 4H3M8 19a1 1 0 1 0 0 .1m9 0a1 1 0 1 0 0 .1",
  vendor: "M6 3h12v18H6V3Zm3 4h6m-6 4h6m-6 4h3",
  back: "M15 5 8 12l7 7",
  search: "m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  cart: "M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2M10 20h.01M17 20h.01",
  orders: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
  account: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};

const DepartmentGlyph = ({ type, className = "h-5 w-5" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d={iconPaths[type] || iconPaths.electronics} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const departmentConfigs = [
  {
    slug: "electronics",
    label: "Electronics",
    shortLabel: "Electronics",
    description: "Discover the latest gadgets and electronics from top brands.",
    heroTitle: "Latest Electronics",
    heroSubtitle: "Up to 40% off on top products",
    heroCta: "Shop Now",
    sidebarIcon: "electronics",
    matchCategories: ["Phones & Tablets", "Computers & Electronics", "Audio", "Watches & Wearables", "Accessories"],
    heroTone: "from-[#0f1115] via-[#171a21] to-[#2a2d35]",
  },
  {
    slug: "mobiles-tablets",
    label: "Mobiles & Tablets",
    shortLabel: "Mobiles",
    description: "Phones, tablets, and everyday mobile accessories.",
    heroTitle: "Mobile Deals",
    heroSubtitle: "Phones and tablets from trusted sellers",
    heroCta: "Shop Now",
    sidebarIcon: "mobiles-tablets",
    matchCategories: ["Phones & Tablets", "Smartphone"],
    heroTone: "from-[#111827] via-[#1f2937] to-[#374151]",
  },
  {
    slug: "laptops-computers",
    label: "Computers & Laptops",
    shortLabel: "Computers",
    description: "Laptops, desktop accessories, and creator-ready machines.",
    heroTitle: "Computing Essentials",
    heroSubtitle: "Work, study, and gaming setups in one place",
    heroCta: "Shop Now",
    sidebarIcon: "laptops",
    matchCategories: ["Computers & Electronics", "Laptop"],
    heroTone: "from-[#111827] via-[#1e293b] to-[#334155]",
  },
  {
    slug: "tv-audio-video",
    label: "TV, Audio & Video",
    shortLabel: "TV & Audio",
    description: "Televisions, projectors, speakers, and sound gear.",
    heroTitle: "TV and Audio",
    heroSubtitle: "Sound, display, and home entertainment deals",
    heroCta: "Shop Now",
    sidebarIcon: "audio",
    matchCategories: ["Audio", "Computers & Electronics", "Appliances"],
    heroTone: "from-[#101115] via-[#181818] to-[#292929]",
  },
  {
    slug: "cameras-accessories",
    label: "Cameras & Accessories",
    shortLabel: "Cameras",
    description: "Photography, recording, and content-creation gear.",
    heroTitle: "Camera Picks",
    heroSubtitle: "Capture sharper moments with better gear",
    heroCta: "Shop Now",
    sidebarIcon: "cameras",
    matchCategories: ["Computers & Electronics", "Camera"],
    heroTone: "from-[#101827] via-[#18243a] to-[#2a3b59]",
  },
  {
    slug: "headphones-speakers",
    label: "Headphones & Speakers",
    shortLabel: "Audio",
    description: "Earbuds, headphones, and portable speakers.",
    heroTitle: "Headphones and Speakers",
    heroSubtitle: "Bass-heavy audio picks and everyday wearables",
    heroCta: "Shop Now",
    sidebarIcon: "audio",
    matchCategories: ["Audio", "Headphone", "Earphone"],
    heroTone: "from-[#170f1c] via-[#211627] to-[#30203d]",
  },
  {
    slug: "gaming",
    label: "Gaming",
    shortLabel: "Gaming",
    description: "Consoles, controllers, and gaming accessories.",
    heroTitle: "Gaming Zone",
    heroSubtitle: "Consoles and accessories for play nights",
    heroCta: "Shop Now",
    sidebarIcon: "gaming",
    matchCategories: ["Accessories"],
    heroTone: "from-[#0f172a] via-[#111827] to-[#1f2937]",
  },
  {
    slug: "smart-home",
    label: "Smart Home",
    shortLabel: "Smart Home",
    description: "Connected devices and home tech essentials.",
    heroTitle: "Smart Home",
    heroSubtitle: "Connected living made easy",
    heroCta: "Shop Now",
    sidebarIcon: "home",
    matchCategories: ["Appliances", "Home & Living"],
    heroTone: "from-[#0f172a] via-[#1e293b] to-[#334155]",
  },
  {
    slug: "accessories",
    label: "Accessories",
    shortLabel: "Accessories",
    description: "Chargers, cables, adapters, and easy add-ons.",
    heroTitle: "Useful Accessories",
    heroSubtitle: "The add-ons people always need",
    heroCta: "Shop Now",
    sidebarIcon: "accessories",
    matchCategories: ["Accessories"],
    heroTone: "from-[#221b12] via-[#2c2418] to-[#44351f]",
  },
  {
    slug: "home-appliances",
    label: "Home Appliances",
    shortLabel: "Home",
    description: "Appliances for cooking, cleaning, and daily routines.",
    heroTitle: "Home Appliances",
    heroSubtitle: "Practical items for everyday living",
    heroCta: "Shop Now",
    sidebarIcon: "appliances",
    matchCategories: ["Appliances", "Home & Living"],
    heroTone: "from-[#111827] via-[#1f2937] to-[#374151]",
  },
  {
    slug: "kitchen-appliances",
    label: "Kitchen Appliances",
    shortLabel: "Kitchen",
    description: "Cooking, prep, and kitchen convenience gear.",
    heroTitle: "Kitchen Appliances",
    heroSubtitle: "Tools that make meal prep easier",
    heroCta: "Shop Now",
    sidebarIcon: "appliances",
    matchCategories: ["Appliances", "Home & Living"],
    heroTone: "from-[#1f130d] via-[#2d1b11] to-[#402614]",
  },
  {
    slug: "beauty-personal",
    label: "Beauty & Personal Care",
    shortLabel: "Beauty",
    description: "Skincare, makeup, and self-care essentials.",
    heroTitle: "Beauty Essentials",
    heroSubtitle: "Fresh picks for skincare and grooming",
    heroCta: "Shop Now",
    sidebarIcon: "beauty",
    matchCategories: ["Beauty & Cosmetics", "Health & Personal Care"],
    heroTone: "from-[#1d0f17] via-[#2c1320] to-[#401928]",
  },
  {
    slug: "fashion",
    label: "Fashion",
    shortLabel: "Fashion",
    description: "Style, clothing, shoes, and wearable accessories.",
    heroTitle: "Fashion Finds",
    heroSubtitle: "New arrivals from local style sellers",
    heroCta: "Shop Now",
    sidebarIcon: "fashion",
    matchCategories: ["Fashion"],
    heroTone: "from-[#1d1621] via-[#2a2031] to-[#3a2f46]",
  },
  {
    slug: "health-medicines",
    label: "Health & Medicines",
    shortLabel: "Health",
    description: "Wellness, health, and personal care products.",
    heroTitle: "Health and Wellness",
    heroSubtitle: "Everyday health essentials and care items",
    heroCta: "Shop Now",
    sidebarIcon: "health",
    matchCategories: ["Health & Personal Care"],
    heroTone: "from-[#0f1b16] via-[#13211b] to-[#1f2f28]",
  },
  {
    slug: "sports-outdoors",
    label: "Sports & Outdoors",
    shortLabel: "Sports",
    description: "Fitness, travel, camping, and active lifestyle gear.",
    heroTitle: "Sports and Outdoors",
    heroSubtitle: "Gear for movement and outdoor fun",
    heroCta: "Shop Now",
    sidebarIcon: "sports",
    matchCategories: ["Sports & Outdoors"],
    heroTone: "from-[#0f1a12] via-[#132316] to-[#203022]",
  },
  {
    slug: "toys-games",
    label: "Toys & Games",
    shortLabel: "Toys",
    description: "Fun picks for family, kids, and game time.",
    heroTitle: "Toys and Games",
    heroSubtitle: "Playful picks for all ages",
    heroCta: "Shop Now",
    sidebarIcon: "gaming",
    matchCategories: ["Sports & Outdoors"],
    heroTone: "from-[#1b1627] via-[#261f38] to-[#362c4b]",
  },
  {
    slug: "automotive",
    label: "Automotive",
    shortLabel: "Auto",
    description: "Car accessories, tools, and maintenance products.",
    heroTitle: "Automotive Essentials",
    heroSubtitle: "Accessories and tools for your ride",
    heroCta: "Shop Now",
    sidebarIcon: "automotive",
    matchCategories: ["Automotive"],
    heroTone: "from-[#1f1010] via-[#2f1515] to-[#431f1f]",
  },
  {
    slug: "tools-equipment",
    label: "Tools & Equipment",
    shortLabel: "Tools",
    description: "Hardware, repair, and building essentials.",
    heroTitle: "Tools and Equipment",
    heroSubtitle: "Work-ready items for builders and DIY",
    heroCta: "Shop Now",
    sidebarIcon: "tools",
    matchCategories: ["Construction & Tools"],
    heroTone: "from-[#141414] via-[#1f1f1f] to-[#303030]",
  },
  {
    slug: "books-stationery",
    label: "Books & Stationery",
    shortLabel: "Books",
    description: "Learning materials, books, and stationery.",
    heroTitle: "Books and Stationery",
    heroSubtitle: "Useful picks for school and work",
    heroCta: "Shop Now",
    sidebarIcon: "books",
    matchCategories: ["Books & Learning", "Office & Stationery"],
    heroTone: "from-[#17131f] via-[#22192b] to-[#33213d]",
  },
  {
    slug: "groceries-pets",
    label: "Groceries & Pets",
    shortLabel: "Groceries",
    description: "Daily essentials and pet-friendly products.",
    heroTitle: "Groceries and Pets",
    heroSubtitle: "Everyday items and pet care basics",
    heroCta: "Shop Now",
    sidebarIcon: "groceries",
    matchCategories: ["Home & Living"],
    heroTone: "from-[#132012] via-[#1b2b18] to-[#253626]",
  },
];

const electronicsTiles = [
  {
    label: "Mobiles & Tablets",
    matchCategories: ["Phones & Tablets", "Smartphone"],
    keywords: ["phone", "tablet", "mobile"],
    icon: "mobiles-tablets",
    tone: "from-sky-50 to-white",
  },
  {
    label: "Laptops",
    matchCategories: ["Computers & Electronics", "Laptop"],
    keywords: ["laptop", "macbook", "asus"],
    icon: "laptops",
    tone: "from-indigo-50 to-white",
  },
  {
    label: "TV & Video",
    matchCategories: ["Computers & Electronics", "Appliances"],
    keywords: ["tv", "television", "projector"],
    icon: "tv",
    tone: "from-slate-50 to-white",
  },
  {
    label: "Audio",
    matchCategories: ["Audio", "Headphone", "Earphone"],
    keywords: ["speaker", "headphone", "earbud"],
    icon: "audio",
    tone: "from-violet-50 to-white",
  },
  {
    label: "Cameras",
    matchCategories: ["Computers & Electronics", "Camera"],
    keywords: ["camera", "canon", "lens"],
    icon: "cameras",
    tone: "from-amber-50 to-white",
  },
  {
    label: "Gaming",
    matchCategories: ["Accessories"],
    keywords: ["gaming", "playstation", "controller"],
    icon: "gaming",
    tone: "from-orange-50 to-white",
  },
  {
    label: "Wearables",
    matchCategories: ["Watches & Wearables", "Watch"],
    keywords: ["watch", "smartwatch", "wearable"],
    icon: "wearables",
    tone: "from-emerald-50 to-white",
  },
  {
    label: "Accessories",
    matchCategories: ["Accessories"],
    keywords: ["charger", "cable", "adapter"],
    icon: "accessories",
    tone: "from-orange-50 to-white",
  },
  {
    label: "Smart Home",
    matchCategories: ["Appliances", "Home & Living"],
    keywords: ["smart", "home", "assistant"],
    icon: "home",
    tone: "from-lime-50 to-white",
  },
  {
    label: "Storage",
    matchCategories: ["Computers & Electronics"],
    keywords: ["storage", "ssd", "disk", "drive"],
    icon: "laptops",
    tone: "from-cyan-50 to-white",
  },
  {
    label: "Printers",
    matchCategories: ["Office & Stationery", "Computers & Electronics"],
    keywords: ["printer", "scanner"],
    icon: "books",
    tone: "from-fuchsia-50 to-white",
  },
  {
    label: "Networking",
    matchCategories: ["Computers & Electronics"],
    keywords: ["router", "wifi", "network"],
    icon: "electronics",
    tone: "from-blue-50 to-white",
  },
  {
    label: "Power & Cables",
    matchCategories: ["Accessories"],
    keywords: ["cable", "charger", "adapter"],
    icon: "accessories",
    tone: "from-yellow-50 to-white",
  },
  {
    label: "Office Electronics",
    matchCategories: ["Office & Stationery", "Computers & Electronics"],
    keywords: ["office", "keyboard", "mouse"],
    icon: "books",
    tone: "from-stone-50 to-white",
  },
];

const brandFallbacks = ["Samsung", "Apple", "HP", "Dell", "Sony", "JBL", "Canon", "Lenovo"];

const brandLogoSources = {
  Samsung: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/samsung.svg",
  Apple: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/apple.svg",
  HP: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/hp.svg",
  Dell: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/dell.svg",
  Sony: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/sony.svg",
  JBL: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/jbl.svg",
  Canon: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/canon.svg",
  Lenovo: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/lenovo.svg",
};

const formatCount = (count) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(count) || 0));

const getImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  if (typeof image === "string" && image.trim()) {
    return image.trim();
  }

  if (image && typeof image === "object" && typeof image.src === "string") {
    return image.src;
  }

  return assets.upload_area;
};

const getBrandLabel = (product) => {
  const explicit = product?.brand || product?.manufacturer || product?.sellerProfile?.name;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim();
  }

  const firstToken = normalizeText(product?.name).split(" ").find((token) => token.length > 2);
  return firstToken ? firstToken[0].toUpperCase() + firstToken.slice(1) : "Store";
};

const getContentTargetHref = (item) => {
  if (item?.linkType === "category" && item.category) {
    return `/all-products?category=${encodeURIComponent(item.category)}`;
  }

  if (item?.linkType === "store" && item.storeId) {
    return `/store/${encodeURIComponent(item.storeId)}`;
  }

  if (item?.productId) {
    return `/product/${item.productId}`;
  }

  return item?.href || "/all-products";
};

const findPlacementBanner = (banners, selectedDepartment) => {
  const departmentCategories = selectedDepartment?.matchCategories || [];
  const normalizedDepartmentLabel = normalizeText(selectedDepartment?.label);

  return banners.find((banner) => (
    departmentCategories.some((category) => categoryMatchesSelection(banner.placementCategory || banner.category, category))
    || normalizeText(banner.placementCategory || banner.category).includes(normalizedDepartmentLabel)
  )) || banners[0] || null;
};

const getDepartmentProducts = (products, department) => (
  products.filter((product) => (
    department.matchCategories.some((category) => categoryMatchesSelection(product.category, category))
    || (department.keywords || []).some((keyword) => normalizeText(product.name).includes(keyword) || normalizeText(product.description).includes(keyword))
  ))
);

const findProductByTile = (products, tile) => {
  const byCategory = products.find((product) => tile.matchCategories.some((category) => categoryMatchesSelection(product.category, category)));
  if (byCategory) return byCategory;

  const byKeyword = products.find((product) => {
    const haystack = `${normalizeText(product.name)} ${normalizeText(product.description)}`;
    return tile.keywords.some((keyword) => haystack.includes(keyword));
  });

  return byKeyword || products[0] || null;
};

const buildGenericTiles = (products) => {
  const uniqueCategories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  return uniqueCategories.slice(0, 8).map((category) => ({
    label: getCategoryMeta(category).label,
    matchCategories: [category],
    keywords: [],
    icon: "electronics",
    tone: "from-white to-white",
  }));
};

const CategoryBanner = ({ banner, navigate, prefetchRoute, fallbackTitle }) => {
  const href = getContentTargetHref(banner);

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      onMouseEnter={() => prefetchRoute(href)}
      onFocus={() => prefetchRoute(href)}
      className="group relative block w-full overflow-hidden rounded-[1.35rem] border border-gray-200 bg-gray-950 text-left shadow-sm transition hover:shadow-md min-h-[185px] sm:min-h-[220px]"
    >
      {banner?.imageUrl ? (
        <span className="absolute inset-0">
          <Image
            src={banner.imageUrl}
            alt={banner?.title || fallbackTitle || "Category banner"}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 72vw"
            priority={false}
          />
          <span className="sr-only">{banner?.title || fallbackTitle || "Category banner"}</span>
        </span>
      ) : (
        <div className="flex min-h-[185px] items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-6 py-8 sm:min-h-[220px]">
          <div className="h-full w-full rounded-[1.15rem] border border-white/10 bg-white/5" />
        </div>
      )}
    </button>
  );
};

const CategoryBubble = ({ tile, product, onClick, count, bare = false, compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex min-w-0 flex-col items-center gap-3 rounded-[1.15rem] p-3 text-center transition ${
      bare ? "border border-transparent bg-transparent shadow-none hover:border-transparent hover:shadow-none" : "border border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:shadow-md"
    }`}
  >
    <div className={`flex ${compact ? "h-16 w-16" : "h-24 w-24"} items-center justify-center rounded-full bg-gradient-to-br ${tile.tone} p-2.5 sm:h-28 sm:w-28`}>
      {product ? (
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
          <Image
            src={getImage(product)}
            alt={tile.label}
            width={128}
            height={128}
            className="h-full w-full object-cover p-2.5 transition duration-300 group-hover:scale-105"
          />
        </span>
      ) : (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
          <DepartmentGlyph type={tile.icon} className="h-6 w-6" />
        </span>
      )}
    </div>
    <div className="space-y-0.5">
      <p className="truncate text-[12.5px] font-semibold text-gray-900">{tile.label}</p>
      <p className="text-[11px] text-gray-500">{formatCount(count)} items</p>
    </div>
  </button>
);

const TopCategoryCard = ({ tile, product, onClick, count, bare = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative overflow-hidden rounded-[1.15rem] p-3 text-left transition ${
      bare ? "border border-transparent bg-transparent shadow-none hover:border-transparent hover:shadow-none" : `border border-gray-100 bg-gradient-to-br ${tile.tone} shadow-sm hover:shadow-md`
    }`}
  >
    <div className="flex min-h-[108px] items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-gray-900">{tile.label}</p>
        <p className="mt-1 text-[11px] text-gray-500">Up to 35% off</p>
        <p className="mt-5 text-[11px] font-semibold text-orange-600">Explore →</p>
      </div>
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
        {product ? (
          <Image src={getImage(product)} alt={tile.label} width={104} height={104} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm">
            <DepartmentGlyph type={tile.icon} className="h-7 w-7" />
          </span>
        )}
      </div>
    </div>
    <p className="mt-2 text-[11px] text-gray-500">{formatCount(count)} items</p>
  </button>
);

const BrandLogoCard = ({ label, count, onClick, imageUrl, href, description }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-w-0 flex-col items-center gap-3 rounded-[1.15rem] border border-gray-100 bg-white p-3.5 text-center shadow-sm transition hover:border-orange-300 hover:shadow-md sm:p-4"
  >
    <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white transition group-hover:scale-105 sm:h-20 sm:w-20">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          width={88}
          height={88}
          className="h-full w-full object-contain p-2.5"
        />
      ) : brandLogoSources[label] ? (
        <Image
          src={brandLogoSources[label]}
          alt={label}
          width={88}
          height={88}
          className="h-full w-full object-contain p-2.5"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 text-base font-black tracking-[0.16em] text-orange-600">
          {label.slice(0, 1)}
        </span>
      )}
    </span>
    <span className="text-[12px] font-semibold text-gray-900">{label}</span>
    {description ? <span className="max-h-10 overflow-hidden text-[11px] leading-5 text-gray-500">{description}</span> : null}
    <span className="text-[11px] text-gray-500">{formatCount(count)} items</span>
  </button>
);

const StoreCard = ({ store, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
  >
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700">
      {store.avatarUrl ? (
        <Image
          src={store.avatarUrl}
          alt={store.name}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{store.name.slice(0, 1)}</span>
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-gray-950">{store.name}</span>
      <span className="block truncate text-[11px] text-gray-500">{store.location || "Storefront"}</span>
      <span className="mt-1 block text-[11px] text-orange-600">{formatCount(store.count)} items</span>
    </span>
  </button>
);

const SidebarItem = ({ item, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
      active ? "bg-orange-50 text-orange-600 ring-1 ring-orange-100" : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${
      active ? "border-orange-200 bg-white text-orange-600" : "border-gray-200 bg-white text-gray-700"
    }`}>
      <DepartmentGlyph type={item.sidebarIcon} className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[12.5px] font-semibold">{item.label}</span>
      <span className="block text-[10px] text-gray-400">{formatCount(count)} items</span>
    </span>
    <span className="text-gray-300">›</span>
  </button>
);

const CategoryLandingPage = ({ initialProducts = [], initialSiteContent = null }) => {
  const { products, loadingProducts, navigate, prefetchRoute } = useAppContext();
  const searchParams = useSearchParams();
  const storefrontProducts = products.length ? products : initialProducts;
  const resolvedContent = initialSiteContent || { categoryBanners: [] };
  const [categorySearch, setCategorySearch] = useState("");
  const [showMobileCategoryMenu, setShowMobileCategoryMenu] = useState(false);

  const categoryParam = searchParams.get("category") || "";
  const selectedDepartment = useMemo(() => {
    const normalizedCategory = normalizeText(categoryParam);
    const matchedDepartment = departmentConfigs.find((department) => (
      department.slug === categoryParam
      || department.matchCategories.some((category) => categoryMatchesSelection(category, categoryParam))
      || normalizeText(department.label).includes(normalizedCategory)
      || normalizedCategory.includes(normalizeText(department.label))
    ));

    return matchedDepartment || departmentConfigs[0];
  }, [categoryParam]);

  const selectedProducts = useMemo(() => (
    getDepartmentProducts(storefrontProducts, selectedDepartment)
  ), [storefrontProducts, selectedDepartment]);

  const sidebarProducts = useMemo(() => (
    departmentConfigs.map((department) => ({
      ...department,
      count: getDepartmentProducts(storefrontProducts, department).length,
    }))
  ), [storefrontProducts]);

  const visibleSidebarProducts = useMemo(() => {
    const q = normalizeText(categorySearch);
    if (!q) return sidebarProducts;

    return sidebarProducts.filter((item) => (
      normalizeText(item.label).includes(q)
      || normalizeText(item.description).includes(q)
      || normalizeText(getCategoryMeta(item.matchCategories[0]).label).includes(q)
    ));
  }, [categorySearch, sidebarProducts]);

  const categoryTiles = useMemo(() => (
    selectedDepartment.slug === "electronics"
      ? electronicsTiles
      : buildGenericTiles(selectedProducts)
  ), [selectedDepartment.slug, selectedProducts]);

  const selectDepartment = (department) => {
    navigate(`/categories?category=${encodeURIComponent(department.slug)}`);
  };

  const selectedBanner = useMemo(() => (
    findPlacementBanner(resolvedContent.categoryBanners || [], selectedDepartment)
  ), [resolvedContent.categoryBanners, selectedDepartment]);

  const showcaseBrandCards = useMemo(() => {
    const cards = Array.isArray(resolvedContent.brandShowcases) ? resolvedContent.brandShowcases : [];
    const departmentLabel = normalizeText(selectedDepartment.label);
    const departmentCategories = selectedDepartment.matchCategories || [];

    return cards.filter((item) => (
      !item.placementCategory
      || categoryMatchesSelection(item.placementCategory, selectedDepartment.label)
      || normalizeText(item.placementCategory).includes(departmentLabel)
      || departmentCategories.some((category) => categoryMatchesSelection(item.placementCategory, category))
    ));
  }, [resolvedContent.brandShowcases, selectedDepartment]);

  const tileCounts = useMemo(() => (
    categoryTiles.map((tile) => ({
      ...tile,
      count: selectedProducts.filter((product) => (
        tile.matchCategories.some((category) => categoryMatchesSelection(product.category, category))
        || tile.keywords?.some((keyword) => {
          const haystack = `${normalizeText(product.name)} ${normalizeText(product.description)}`;
          return haystack.includes(keyword);
        })
      )).length,
      product: findProductByTile(selectedProducts, tile),
    }))
  ), [categoryTiles, selectedProducts]);

  const topCategoryCards = useMemo(() => tileCounts.slice(0, 8), [tileCounts]);
  const brandCards = useMemo(() => {
    const counts = selectedProducts.reduce((acc, product) => {
      const label = getBrandLabel(product);
      const entry = acc.get(label) || { label, count: 0 };
      entry.count += 1;
      acc.set(label, entry);
      return acc;
    }, new Map());

    return [...counts.values()]
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 8);
  }, [selectedProducts]);

  const storeCards = useMemo(() => {
    const stores = selectedProducts.reduce((acc, product) => {
      const storeId = product.userId || product.sellerProfile?.id || product.sellerProfile?._id;
      if (!storeId) {
        return acc;
      }

      const existing = acc.get(storeId) || {
        id: storeId,
        name: product.sellerProfile?.name || product.sellerProfile?.storeName || `Store ${String(storeId).slice(-6)}`,
        avatarUrl: product.sellerProfile?.avatarUrl || product.sellerProfile?.image || "",
        location: product.sellerProfile?.location || product.sellerLocation || product.location || "",
        count: 0,
      };

      existing.count += 1;
      acc.set(storeId, existing);
      return acc;
    }, new Map());

    return [...stores.values()]
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 6);
  }, [selectedProducts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedDepartment.slug]);

  const isHydrating = loadingProducts && !storefrontProducts.length;

  if (isHydrating) {
    return <CategoryPageSkeleton />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-4 lg:flex lg:gap-6 lg:px-6 xl:px-8">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-950">All Categories</p>
              <div className="mt-2 space-y-1">
                {visibleSidebarProducts.map((item) => (
                  <SidebarItem
                    key={item.slug}
                    item={item}
                    active={selectedDepartment.slug === item.slug}
                    count={item.count}
                    onClick={() => selectDepartment(item)}
                  />
                ))}
              </div>
            </div>

            <button type="button" onClick={() => navigate("/seller")} className="rounded-lg border border-orange-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-300">
              <p className="text-base font-semibold text-orange-600">Become a Vendor</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">Sell your products with us and grow your business.</p>
              <span className="mt-4 inline-flex rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600">Get Started</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="hidden lg:block">
            <div className="mb-4">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-950">{selectedDepartment.label}</h1>
              <p className="mt-1 text-sm text-gray-500">{selectedDepartment.description}</p>
            </div>

            <CategoryBanner
              banner={selectedBanner}
              fallbackTitle={selectedDepartment.heroTitle}
              navigate={navigate}
              prefetchRoute={prefetchRoute}
            />

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-950">Shop by category</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                {tileCounts.map((tile) => (
                  <CategoryBubble
                    key={tile.label}
                    tile={tile}
                    product={tile.product}
                    count={tile.count}
                    onClick={() => navigate(buildCategoryHref(tile.matchCategories[0] || selectedDepartment.matchCategories[0]))}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-950">Top categories</h2>
                <button type="button" onClick={() => navigate("/all-products")} className="text-sm font-semibold text-orange-600">View all</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {topCategoryCards.map((tile) => (
                  <TopCategoryCard
                    key={tile.label}
                    tile={tile}
                    product={tile.product}
                    count={tile.count}
                    onClick={() => navigate(buildCategoryHref(tile.matchCategories[0] || selectedDepartment.matchCategories[0]))}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-950">Popular brands</h2>
                <button type="button" onClick={() => navigate("/all-products?sort=popular")} className="text-sm font-semibold text-orange-600">View all brands →</button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {(showcaseBrandCards.length
                  ? showcaseBrandCards
                  : (brandCards.length ? brandCards : brandFallbacks.map((label) => ({ label, count: 0 })))
                ).map((brand) => (
                  <BrandLogoCard
                    key={brand._id || brand.label}
                    label={brand.brand || brand.label}
                    count={brand.count || 0}
                    imageUrl={brand.imageUrl || ""}
                    description={brand.description || ""}
                    href={brand.href || `/all-products?brand=${encodeURIComponent(brand.brand || brand.label)}`}
                    onClick={() => navigate(brand.href || `/all-products?brand=${encodeURIComponent(brand.brand || brand.label)}`)}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-950">Shops</h2>
                <button type="button" onClick={() => navigate("/all-products")} className="text-sm font-semibold text-orange-600">View all stores →</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {storeCards.length ? storeCards.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    onClick={() => navigate(`/store/${encodeURIComponent(store.id)}`)}
                  />
                )) : (
                  <div className="rounded-[1.15rem] border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                    No stores found for this category yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:hidden">
            <div className="px-1 pb-4">
              <div className="rounded-[1.35rem] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileCategoryMenu(true)}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm"
                  >
                    <span className="text-base">☰</span>
                    Menu
                  </button>
                  <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <p className="truncate text-sm font-semibold text-gray-950">{selectedDepartment.label}</p>
                    <p className="truncate text-[11px] text-gray-500">{selectedDepartment.description}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <DepartmentGlyph type="search" className="h-5 w-5 text-gray-500" />
                  <input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    placeholder="Search categories"
                    className="min-w-0 flex-1 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <section className="mt-6 px-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-950">Shop by category</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {tileCounts.map((tile) => (
                  <div key={tile.label} className="min-w-0">
                    <CategoryBubble
                      tile={tile}
                      product={tile.product}
                      count={tile.count}
                      bare
                      compact
                      onClick={() => navigate(buildCategoryHref(tile.matchCategories[0] || selectedDepartment.matchCategories[0]))}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 px-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-950">Top categories</h2>
                <button type="button" onClick={() => navigate("/all-products")} className="text-sm font-semibold text-orange-600">View all</button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {topCategoryCards.map((tile) => (
                  <div key={tile.label} className="min-w-0">
                    <TopCategoryCard
                      tile={tile}
                      product={tile.product}
                      count={tile.count}
                      onClick={() => navigate(buildCategoryHref(tile.matchCategories[0] || selectedDepartment.matchCategories[0]))}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 px-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-950">Brands</h2>
                <button type="button" onClick={() => navigate("/all-products")} className="text-sm font-semibold text-orange-600">View all</button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(showcaseBrandCards.length
                  ? showcaseBrandCards
                  : (brandCards.length ? brandCards : brandFallbacks.map((label) => ({ label, count: 0 })))
                ).map((brand) => (
                  <div key={brand._id || brand.brand || brand.label} className="w-[8.75rem] shrink-0">
                    <BrandLogoCard
                      label={brand.brand || brand.label}
                      count={brand.count || 0}
                      imageUrl={brand.imageUrl || ""}
                      description={brand.description || ""}
                      href={brand.href || `/all-products?brand=${encodeURIComponent(brand.brand || brand.label)}`}
                      onClick={() => navigate(brand.href || `/all-products?brand=${encodeURIComponent(brand.brand || brand.label)}`)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 px-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-950">Shops</h2>
                <button type="button" onClick={() => navigate("/all-products")} className="text-sm font-semibold text-orange-600">View all</button>
              </div>
              <div className="space-y-3">
                {storeCards.length ? storeCards.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    onClick={() => navigate(`/store/${encodeURIComponent(store.id)}`)}
                  />
                )) : (
                  <div className="rounded-[1.15rem] border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                    No stores found for this category yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          {showMobileCategoryMenu ? (
            <div className="fixed inset-0 z-50 bg-black/40 p-4 lg:hidden" onClick={() => setShowMobileCategoryMenu(false)}>
              <div
                className="mx-auto mt-16 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[1.35rem] bg-white p-4 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-950">Categories</p>
                    <p className="text-[11px] text-gray-500">Pick a department to browse.</p>
                  </div>
                  <button type="button" onClick={() => setShowMobileCategoryMenu(false)} className="text-xl text-gray-400">×</button>
                </div>
                <div className="space-y-2">
                  {visibleSidebarProducts.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        selectDepartment(item);
                        setShowMobileCategoryMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                        selectedDepartment.slug === item.slug ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          selectedDepartment.slug === item.slug ? "bg-white text-orange-600" : "bg-gray-50 text-gray-700"
                        }`}>
                          <DepartmentGlyph type={item.sidebarIcon} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-950">{item.label}</span>
                          <span className="block text-xs text-gray-500">{formatCount(item.count)} items</span>
                        </span>
                      </div>
                      <span className="text-gray-300">›</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

const CategoryPageSkeleton = () => (
  <div className="min-h-screen bg-[#faf8f5] px-4 py-4">
    <div className="mx-auto max-w-[1600px] lg:flex lg:gap-6">
      <Skeleton className="hidden h-[42rem] w-[280px] rounded-[1.6rem] lg:block" />
      <div className="min-w-0 flex-1 space-y-4">
        <Skeleton className="h-16 rounded-[1.5rem]" />
        <Skeleton className="h-72 rounded-[1.5rem]" />
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CategoryLandingPage;
