'use client'

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Skeleton from "@/components/Skeleton";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
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

const getDepartmentProducts = (products, department) => (
  products.filter((product) => (
    department.matchCategories.some((category) => categoryMatchesSelection(product.category, category))
    || (department.keywords || []).some((keyword) => normalizeText(product.name).includes(keyword) || normalizeText(product.description).includes(keyword))
  ))
);

const SidebarItem = ({ item, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
      active ? "bg-orange-50 text-orange-600 ring-1 ring-orange-100" : "text-gray-950 hover:bg-gray-50"
    }`}
  >
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
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

const catalogPalettes = [
  {
    panel: "from-blue-50 via-white to-blue-50",
    icon: "from-blue-600 to-sky-500",
    text: "text-blue-700",
    border: "border-blue-100",
  },
  {
    panel: "from-orange-50 via-white to-orange-50",
    icon: "from-orange-600 to-red-500",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    panel: "from-violet-50 via-white to-violet-50",
    icon: "from-violet-600 to-indigo-500",
    text: "text-violet-700",
    border: "border-violet-100",
  },
  {
    panel: "from-cyan-50 via-white to-cyan-50",
    icon: "from-cyan-600 to-teal-500",
    text: "text-cyan-700",
    border: "border-cyan-100",
  },
  {
    panel: "from-slate-50 via-white to-blue-50",
    icon: "from-blue-600 to-indigo-500",
    text: "text-blue-700",
    border: "border-blue-100",
  },
  {
    panel: "from-pink-50 via-white to-rose-50",
    icon: "from-pink-600 to-rose-500",
    text: "text-pink-700",
    border: "border-pink-100",
  },
  {
    panel: "from-purple-50 via-white to-fuchsia-50",
    icon: "from-purple-600 to-fuchsia-500",
    text: "text-purple-700",
    border: "border-purple-100",
  },
];

const catalogSubcategoryMap = {
  electronics: [
    ["Smartphones", ["Phones & Tablets"], ["phone", "smartphone", "iphone", "galaxy"]],
    ["Laptops", ["Computers & Electronics"], ["laptop", "macbook", "thinkpad"]],
    ["Desktops", ["Computers & Electronics"], ["desktop", "pc", "tower"]],
    ["Monitors", ["Computers & Electronics"], ["monitor", "display"]],
    ["Accessories", ["Accessories"], ["charger", "cable", "adapter", "case"]],
    ["Audio", ["Audio"], ["headphone", "speaker", "earbud", "audio"]],
    ["Wearables", ["Watches & Wearables"], ["watch", "wearable"]],
  ],
  "mobiles-tablets": [
    ["Smartphones", ["Phones & Tablets"], ["phone", "smartphone", "iphone"]],
    ["Tablets", ["Phones & Tablets"], ["tablet", "ipad"]],
    ["Phone Accessories", ["Accessories"], ["charger", "cable", "earphone"]],
    ["Power Banks", ["Accessories"], ["power bank", "battery"]],
    ["Cases & Covers", ["Accessories"], ["case", "cover"]],
    ["Screen Protectors", ["Accessories"], ["screen protector", "glass"]],
    ["SIM Devices", ["Phones & Tablets"], ["sim", "router", "mifi"]],
  ],
  "laptops-computers": [
    ["Laptops", ["Computers & Electronics"], ["laptop", "macbook"]],
    ["Desktops", ["Computers & Electronics"], ["desktop", "pc"]],
    ["All-in-Ones", ["Computers & Electronics"], ["all in one"]],
    ["Components", ["Computers & Electronics"], ["ssd", "ram", "gpu", "processor"]],
    ["Printers", ["Office & Stationery", "Computers & Electronics"], ["printer", "scanner"]],
    ["Storage", ["Computers & Electronics"], ["storage", "drive", "ssd"]],
    ["Networking", ["Computers & Electronics"], ["router", "wifi"]],
  ],
  "tv-audio-video": [
    ["Televisions", ["Appliances", "Computers & Electronics"], ["tv", "television"]],
    ["Speakers", ["Audio"], ["speaker"]],
    ["Headphones", ["Audio"], ["headphone"]],
    ["Soundbars", ["Audio"], ["soundbar"]],
    ["Projectors", ["Computers & Electronics"], ["projector"]],
    ["Home Audio", ["Audio"], ["home audio"]],
  ],
  "cameras-accessories": [
    ["Cameras", ["Computers & Electronics"], ["camera", "canon"]],
    ["Lenses", ["Computers & Electronics"], ["lens"]],
    ["Tripods", ["Accessories"], ["tripod"]],
    ["Camera Bags", ["Accessories"], ["camera bag"]],
    ["Flashes", ["Accessories"], ["flash"]],
    ["Drones", ["Computers & Electronics"], ["drone"]],
    ["Memory Cards", ["Accessories"], ["memory card", "sd card"]],
  ],
  "headphones-speakers": [
    ["Headphones", ["Audio"], ["headphone"]],
    ["Speakers", ["Audio"], ["speaker"]],
    ["Earphones", ["Audio"], ["earphone", "earbud"]],
    ["Soundbars", ["Audio"], ["soundbar"]],
    ["Home Audio", ["Audio"], ["home audio"]],
    ["Microphones", ["Audio"], ["microphone", "mic"]],
    ["Car Audio", ["Audio", "Automotive"], ["car audio"]],
  ],
  gaming: [
    ["Consoles", ["Accessories", "Computers & Electronics"], ["console", "playstation", "xbox"]],
    ["Controllers", ["Accessories"], ["controller", "gamepad"]],
    ["Gaming PCs", ["Computers & Electronics"], ["gaming pc"]],
    ["Monitors", ["Computers & Electronics"], ["monitor"]],
    ["Gaming Chairs", ["Home & Living"], ["gaming chair"]],
    ["VR Headsets", ["Accessories"], ["vr"]],
    ["Games", ["Accessories"], ["game"]],
  ],
  fashion: [
    ["Shoes", ["Fashion"], ["shoe", "sneaker"]],
    ["Clothing", ["Fashion"], ["shirt", "dress", "jacket"]],
    ["Watches", ["Watches & Wearables", "Fashion"], ["watch"]],
    ["Bags", ["Accessories", "Fashion"], ["bag"]],
    ["Accessories", ["Accessories", "Fashion"], ["belt", "wallet"]],
  ],
  "home-appliances": [
    ["Televisions", ["Appliances", "Computers & Electronics"], ["tv", "television"]],
    ["Refrigerators", ["Appliances"], ["refrigerator", "fridge"]],
    ["Washing Machines", ["Appliances"], ["washing machine"]],
    ["Air Conditioners", ["Appliances"], ["air conditioner", "ac"]],
    ["Microwaves", ["Appliances"], ["microwave"]],
    ["Vacuum Cleaners", ["Appliances"], ["vacuum"]],
    ["Fans", ["Appliances"], ["fan"]],
  ],
};

const getCatalogSubcategories = (department) => (
  catalogSubcategoryMap[department.slug] || [
    ["Top Picks", department.matchCategories, []],
    ["New Arrivals", department.matchCategories, ["new"]],
    ["Best Sellers", department.matchCategories, ["best"]],
    ["Accessories", ["Accessories", ...department.matchCategories], ["accessory"]],
    ["Deals", department.matchCategories, ["deal", "offer"]],
  ]
);

const productMatchesCatalogTile = (product, categories, keywords) => {
  const categoryMatch = categories.some((category) => categoryMatchesSelection(product.category, category));
  const keywordHaystack = `${normalizeText(product.name)} ${normalizeText(product.description)}`;
  return categoryMatch || keywords.some((keyword) => keywordHaystack.includes(normalizeText(keyword)));
};

const findCatalogProduct = (products, categories, keywords, fallbackProducts) => (
  products.find((product) => productMatchesCatalogTile(product, categories, keywords))
  || fallbackProducts.find((product) => categories.some((category) => categoryMatchesSelection(product.category, category)))
  || fallbackProducts[0]
  || null
);

const CatalogPreviewTile = ({ label, product, onClick, compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex min-w-0 flex-col items-center text-center ${compact ? "gap-1.5" : "gap-2"}`}
  >
    <span className={`flex items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-100 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${
      compact ? "h-[3.15rem] w-[3.15rem] min-[380px]:h-14 min-[380px]:w-14" : "h-[4.25rem] w-[4.25rem] sm:h-[4.6rem] sm:w-[4.6rem] xl:h-20 xl:w-20"
    }`}>
      {product ? (
        <Image src={getImage(product)} alt={label} width={96} height={96} className={`h-full w-full object-contain ${compact ? "p-1.5" : "p-2"}`} />
      ) : (
        <DepartmentGlyph type="electronics" className={`${compact ? "h-5 w-5" : "h-6 w-6"} text-gray-500`} />
      )}
    </span>
    <span className={`line-clamp-2 font-bold text-gray-950 ${
      compact ? "min-h-7 max-w-[4.5rem] text-[9.5px] leading-[13px] min-[380px]:max-w-[5rem] min-[380px]:text-[10px]" : "min-h-8 max-w-[6.25rem] text-[11px] leading-4 sm:text-[12px]"
    }`}>
      {label}
    </span>
  </button>
);

const CatalogRow = ({ row, navigate }) => {
  const href = `/all-products?category=${encodeURIComponent(row.primaryCategory)}`;

  return (
    <section className={`overflow-hidden rounded-lg border ${row.palette.border} bg-gradient-to-r ${row.palette.panel} shadow-sm`}>
      <div className="grid min-h-[7.2rem] grid-cols-[minmax(8.5rem,12rem)_minmax(0,1fr)] sm:grid-cols-[minmax(13.5rem,17rem)_minmax(0,1fr)_7.25rem]">
        <button type="button" onClick={() => navigate(href)} className="flex min-w-0 items-center gap-3 px-4 py-3 text-left">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.palette.icon} text-white shadow-sm sm:h-14 sm:w-14`}>
            <DepartmentGlyph type={row.sidebarIcon} className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className={`block text-sm font-extrabold ${row.palette.text}`}>{row.label}</span>
            <span className="mt-1 block text-[12px] font-semibold text-gray-700">{formatCount(row.count)} products</span>
            <span className="mt-2 hidden text-[11px] leading-4 text-gray-500 sm:block">{row.description}</span>
          </span>
        </button>

        <div className="flex min-w-0 gap-4 overflow-x-auto px-3 py-3 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible lg:grid-cols-5 xl:grid-cols-7">
          {row.tiles.map((tile) => (
            <CatalogPreviewTile
              key={`${row.slug}-${tile.label}`}
              label={tile.label}
              product={tile.product}
              onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories[0] || row.primaryCategory)}`)}
            />
          ))}
        </div>

        <button type="button" onClick={() => navigate(href)} className={`hidden items-center justify-center gap-2 text-sm font-extrabold ${row.palette.text} sm:flex`}>
          View All
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">›</span>
        </button>
      </div>
    </section>
  );
};

const MobileCategoryCard = ({ row, navigate }) => {
  const href = `/all-products?category=${encodeURIComponent(row.primaryCategory)}`;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-2.5 min-[380px]:px-3">
        <h2 className="min-w-0 truncate text-[13.5px] font-extrabold text-gray-950 min-[380px]:text-[14px]">{row.label}</h2>
        <button type="button" onClick={() => navigate(href)} className="flex shrink-0 items-center gap-0.5 text-[11px] font-extrabold text-orange-600 min-[380px]:text-[12px]">
          View all
          <span className="text-base leading-none">›</span>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1 px-1.5 pb-2.5 min-[380px]:gap-1.5 min-[380px]:px-2 min-[380px]:pb-3">
        {row.tiles.slice(0, 4).map((tile) => (
          <CatalogPreviewTile
            key={`${row.slug}-mobile-${tile.label}`}
            label={tile.label}
            product={tile.product}
            compact
            onClick={() => navigate(`/all-products?category=${encodeURIComponent(tile.categories[0] || row.primaryCategory)}`)}
          />
        ))}
      </div>
    </section>
  );
};

const MobileSidebarTab = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-center transition min-[380px]:gap-1.5 min-[380px]:py-3 ${
      active ? "bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-sm" : "bg-white text-gray-950 hover:bg-orange-50 hover:text-orange-600"
    }`}
  >
    <DepartmentGlyph type={item.sidebarIcon} className="h-[1.05rem] w-[1.05rem] min-[380px]:h-5 min-[380px]:w-5" />
    <span className="line-clamp-2 text-[9px] font-extrabold leading-[11px] min-[380px]:text-[10px] min-[380px]:leading-3">{item.shortLabel || item.label}</span>
  </button>
);

const CategoryLandingPage = ({ initialProducts = [] }) => {
  const { products, loadingProducts, navigate } = useAppContext();
  const searchParams = useSearchParams();
  const storefrontProducts = products.length ? products : initialProducts;

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

  const sidebarProducts = useMemo(() => (
    departmentConfigs.map((department) => ({
      ...department,
      count: getDepartmentProducts(storefrontProducts, department).length,
    }))
  ), [storefrontProducts]);

  const visibleSidebarProducts = useMemo(() => sidebarProducts, [sidebarProducts]);

  const selectDepartment = (department) => {
    navigate(`/categories?category=${encodeURIComponent(department.slug)}`);
  };

  const catalogRows = useMemo(() => (
    sidebarProducts.map((department, index) => {
      const departmentProducts = getDepartmentProducts(storefrontProducts, department);
      const subcategories = getCatalogSubcategories(department).slice(0, 7);
      const palette = catalogPalettes[index % catalogPalettes.length];

      return {
        ...department,
        palette,
        primaryCategory: department.matchCategories[0] || department.label,
        tiles: subcategories.map(([label, categories, keywords]) => ({
          label,
          categories,
          product: findCatalogProduct(departmentProducts, categories, keywords, storefrontProducts),
        })),
      };
    })
  ), [sidebarProducts, storefrontProducts]);

  const activeRow = catalogRows.find((row) => row.slug === selectedDepartment.slug) || catalogRows[0];
  const remainingMobileRows = catalogRows.filter((row) => row.slug !== activeRow?.slug);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedDepartment.slug]);

  const isHydrating = loadingProducts && !storefrontProducts.length;

  if (isHydrating) {
    return <CategoryPageSkeleton />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fb]">
      <div className="mx-auto grid max-w-[1600px] gap-4 px-2 pb-24 pt-2 min-[380px]:px-3 min-[380px]:pt-3 md:px-5 md:pb-16 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:px-6 xl:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => navigate("/all-products")}
                className="mb-2 flex w-full items-center gap-3 rounded-lg bg-orange-50 px-3 py-3 text-left text-orange-600"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <DepartmentGlyph type="electronics" className="h-4 w-4" />
                </span>
                <span className="text-sm font-extrabold">All Categories</span>
              </button>
              <div className="space-y-1">
                {visibleSidebarProducts.map((item) => (
                  <SidebarItem
                    key={item.slug}
                    item={item}
                    active={Boolean(categoryParam) && selectedDepartment.slug === item.slug}
                    count={item.count}
                    onClick={() => selectDepartment(item)}
                  />
                ))}
              </div>
            </div>

            <button type="button" onClick={() => navigate("/seller")} className="w-full overflow-hidden rounded-lg bg-[radial-gradient(circle_at_20%_0%,#7c2dff,transparent_34%),linear-gradient(135deg,#240063,#5b0b50_58%,#20104f)] p-5 text-center text-white shadow-sm">
              <p className="text-base font-extrabold">KAWIL CLUB</p>
              <p className="mt-2 text-xs leading-5 text-white/80">Exclusive member discounts & rewards</p>
              <span className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-xs font-extrabold text-[#210062]">Join Now</span>
            </button>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              {[
                ["Secure Payments", "100% protected", "shield"],
                ["Easy Returns", "7-day return policy", "returns"],
                ["Customer Support", "24/7 support", "help"],
              ].map(([title, text, icon]) => (
                <div key={title} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-b-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 text-gray-700">
                    <DepartmentGlyph type={icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold text-gray-950">{title}</span>
                    <span className="block text-[11px] text-gray-500">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 hidden lg:block">
            <h1 className="text-3xl font-extrabold text-gray-950">All Categories</h1>
            <p className="mt-2 text-sm text-gray-500">Browse our wide range of categories and find what you need.</p>
          </div>

          <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-1.5 min-[380px]:grid-cols-[5.35rem_minmax(0,1fr)] min-[380px]:gap-2 lg:hidden">
            <aside className="sticky left-0 top-[4.2rem] z-10 h-[calc(100svh-8.5rem)] touch-pan-y overflow-y-auto overscroll-contain rounded-xl border border-gray-100 bg-white/95 p-1.5 shadow-sm backdrop-blur min-[380px]:top-[4.4rem] min-[380px]:p-2 [-webkit-overflow-scrolling:touch]">
              <div className="space-y-1.5 min-[380px]:space-y-2">
                <MobileSidebarTab
                  item={{ label: "All Categories", shortLabel: "All", sidebarIcon: "electronics" }}
                  active={!categoryParam}
                  onClick={() => navigate("/categories")}
                />
                {visibleSidebarProducts.map((item) => (
                  <MobileSidebarTab
                    key={item.slug}
                    item={item}
                    active={Boolean(categoryParam) && selectedDepartment.slug === item.slug}
                    onClick={() => selectDepartment(item)}
                  />
                ))}
              </div>
            </aside>

            <div className="min-w-0 space-y-2.5 min-[380px]:space-y-3">
              <button
                type="button"
                onClick={() => navigate("/all-products")}
                className="flex min-h-[4.35rem] w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-left shadow-sm min-[380px]:min-h-[4.65rem] min-[380px]:px-4 min-[380px]:py-3"
              >
                <span>
                  <span className="block text-[13px] font-extrabold text-gray-950 min-[380px]:text-sm">All Products</span>
                  <span className="mt-1 block text-[11px] text-gray-500 min-[380px]:text-[12px]">Explore everything we have to offer</span>
                </span>
                <span className="text-xl text-gray-400 min-[380px]:text-2xl">›</span>
              </button>
              {activeRow ? <MobileCategoryCard row={activeRow} navigate={navigate} /> : null}
              {remainingMobileRows.map((row) => (
                <MobileCategoryCard key={row.slug} row={row} navigate={navigate} />
              ))}
            </div>
          </div>

          <div className="hidden space-y-4 lg:block">
            {catalogRows.map((row) => (
              <CatalogRow key={row.slug} row={row} navigate={navigate} />
            ))}
          </div>
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
