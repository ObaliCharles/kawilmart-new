"use client"

import React, { useEffect, useRef, useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton, useUser, useAuth } from "@clerk/nextjs";
import { NavbarUserSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { usePathname } from "next/navigation";
import { buildCategoryHref, homeCategoryValues, getCategoryMeta } from "@/lib/marketplaceCategories";

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
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m0-13 1.4 1.4m10.2 10.2 1.4 1.4",
    account: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
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

const CategoryDropdown = ({ categories, activeCategory, setActiveCategory, goTo, className = "" }) => {
  const selectedCategory = activeCategory || categories[0];
  const selectedMeta = getCategoryMeta(selectedCategory);

  return (
    <div className={`grid overflow-hidden rounded-lg border border-gray-200 bg-white text-sm font-medium shadow-xl ${className}`}>
      <div className="max-h-[28rem] overflow-y-auto border-r border-gray-100 p-2">
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
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${isActive ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  <CategoryGlyph category={category} />
                </span>
                <span className="truncate">{meta.label}</span>
              </span>
              <ChevronRight />
            </button>
          );
        })}
      </div>
      <div className="min-w-0 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md bg-gray-50 px-3 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-orange-600 shadow-sm">
            <CategoryGlyph category={selectedCategory} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-950">{selectedMeta.label}</p>
            <p className="line-clamp-2 text-xs font-normal leading-5 text-gray-500">{selectedMeta.description}</p>
          </div>
        </div>
        <div className="grid gap-1">
          {getCategoryChildren(selectedCategory).map(([label, href]) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(href)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-left text-gray-700 transition hover:bg-orange-50 hover:text-orange-600"
            >
              {label}
              <ChevronRight />
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

const AccountMenuSection = ({ title, items, onNavigate }) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-600">{title}</h2>
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onNavigate(item.href)}
          className="flex w-full items-center gap-4 px-4 py-4 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-950">
            <AccountMenuIcon type={item.icon} className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1 text-base font-semibold text-gray-950">{item.label}</span>
          {item.badge ? (
            <span className="rounded-lg border border-orange-200 px-3 py-1 text-sm font-bold text-orange-600">{item.badge}</span>
          ) : null}
          <ChevronRight />
        </button>
      ))}
    </div>
  </section>
);

const Navbar = () => {
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
    refreshUnreadNotifications,
  } = appContext;
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { openSignIn, openUserProfile } = useClerk();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktopViewport, setIsDesktopViewport] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeCategory, setActiveCategory] = useState(homeCategoryValues[0]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const clerkReady = isUserLoaded && isAuthLoaded;
  const cartCount = getCartCount();
  const userRole = resolvedRole || user?.publicMetadata?.role;
  const showAdmin = isAdmin || userRole === 'admin';
  const showRider = isRider || userRole === 'rider';
  const showSeller = isSeller || userRole === 'seller' || userRole === 'admin';

  const roleLinks = [
    showSeller ? { href: '/seller', label: 'Seller' } : null,
    showAdmin ? { href: '/admin', label: 'Admin' } : null,
    showRider ? { href: '/dashboard/rider', label: 'Deliveries' } : null,
  ].filter(Boolean);

  const handleSearch = (e) => {
    e.preventDefault();
    closeDropdown();
    if (searchQuery.trim()) {
      navigate(`/all-products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileSearchOpen(false);
    }
  };

  const closeDropdown = () => setOpenDropdown(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((current) => current === name ? null : name);
  };

  const goTo = (href) => {
    closeDropdown();
    setIsMobileSearchOpen(false);
    setIsMobileAccountOpen(false);
    navigate(href);
  };

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
    setIsMobileAccountOpen(false);
    closeDropdown();
    window.setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
  };

  const openMobileAccount = () => {
    if (!user) {
      openSignIn();
      return;
    }

    closeDropdown();
    setIsMobileSearchOpen(false);
    setIsMobileAccountOpen(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('search') || '');
    setIsMobileSearchOpen(false);
    setIsMobileAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.style.overflow = isMobileAccountOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileAccountOpen]);

  useEffect(() => {
    if (!isMobileSearchOpen || typeof window === 'undefined') return undefined;

    const handlePointerDown = (event) => {
      if (!mobileSearchRef.current?.contains(event.target)) {
        setIsMobileSearchOpen(false);
        closeDropdown();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isMobileSearchOpen]);

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
    if (!clerkReady || !user) return;

    let timeoutId;
    let idleId;
    const scheduleFetch = () => {
      void refreshUnreadNotifications({ silent: true });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(scheduleFetch, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(scheduleFetch, 400);
    }

    return () => {
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [clerkReady, refreshUnreadNotifications, user]);

  useEffect(() => {
    const routes = ['/', '/all-products', '/cart', '/my-orders', '/inbox'];
    if (showSeller) routes.push('/seller');
    if (showAdmin) routes.push('/admin');
    if (showRider) routes.push('/dashboard/rider');
    routes.forEach((route) => prefetchRoute(route));
  }, [prefetchRoute, showAdmin, showRider, showSeller]);

  const beginLinkNavigation = (href) => {
    if (href !== pathname) setIsRouteLoading(true);
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
        { label: "Address Book", href: "/add-address", icon: "address" },
        { label: "My Payment Methods", href: "/cart", icon: "payment" },
        showAdmin ? { label: "Admin Dashboard", href: "/admin", icon: "admin", badge: "Admin" } : null,
        showSeller ? { label: "Seller Dashboard", href: "/seller", icon: "seller", badge: "Seller" } : null,
        { label: "Vendor Center", href: "/seller", icon: "vendor", badge: "Vendor" },
      ].filter(Boolean),
    },
    {
      title: "Orders & Services",
      items: [
        { label: "My Orders", href: "/my-orders", icon: "orders" },
        { label: "Track Order", href: "/my-orders", icon: "track" },
        showRider ? { label: "Deliveries", href: "/dashboard/rider", icon: "delivery" } : { label: "Deliveries", href: "/my-orders", icon: "delivery" },
        { label: "Returns & Refunds", href: "/legal#terms", icon: "returns" },
        { label: "Wishlist", href: "/all-products", icon: "wishlist" },
      ],
    },
    {
      title: "Support & More",
      items: [
        { label: "Help Center", href: "/about", icon: "help" },
        { label: "Become a Vendor", href: "/seller", icon: "seller" },
        { label: "Chat with Us", href: "/inbox?tab=support", icon: "chat" },
        { label: "Notifications", href: "/inbox", icon: "bell" },
        { label: "Language & Currency", href: "/about", icon: "globe" },
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

  return (
    <>
      {isMobileAccountOpen && user ? (
        <div className="fixed inset-x-0 top-0 bottom-[4.75rem] z-50 overflow-y-auto bg-white md:hidden">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-5 pb-4 pt-10 backdrop-blur">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setIsMobileAccountOpen(false)} aria-label="Close account menu" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-950">
                <svg className="h-7 w-7" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-xl font-extrabold text-gray-950">My Account</h1>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleAccountNavigate("/inbox")} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-950">
                  <AccountMenuIcon type="bell" className="h-7 w-7" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute right-0 top-0 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-1 text-[11px] font-extrabold leading-none text-white">
                      {formatBadgeCount(unreadNotificationsCount)}
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={() => openUserProfile?.()} aria-label="Account settings" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-950">
                  <AccountMenuIcon type="settings" className="h-7 w-7" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 pb-6 pt-5">
            <section className="flex items-center gap-4">
              <Image
                src={user.imageUrl || assets.user_icon}
                alt={user.fullName || "Account avatar"}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-gray-200"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-extrabold text-gray-950">{user.fullName || user.username || "KawilMart shopper"}</h2>
                <p className="mt-1 truncate text-base font-medium text-gray-600">{user.primaryEmailAddress?.emailAddress || "No email added"}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-gray-600"><UgandaFlag className="h-6 w-6" />Uganda, UGX</p>
              </div>
              <button type="button" onClick={() => openUserProfile?.()} className="shrink-0 rounded-lg border border-orange-300 px-4 py-3 text-sm font-extrabold text-orange-600">
                View Profile
              </button>
            </section>

            <div className="mt-6 space-y-5">
              {accountSections.map((section) => (
                <AccountMenuSection key={section.title} title={section.title} items={section.items} onNavigate={handleAccountNavigate} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="hidden border-b border-gray-100 text-xs text-gray-600 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <span className="font-medium text-gray-700">Uganda's marketplace for everyday essentials</span>
            <div className="flex items-center gap-10">
              <button type="button" onClick={() => navigate('/seller')} className="transition hover:text-orange-600">Sell on KawilMart</button>
              <button type="button" onClick={() => navigate('/my-orders')} className="transition hover:text-orange-600">Track Order</button>
              <button type="button" onClick={() => navigate('/about')} className="transition hover:text-orange-600">Help Center</button>
              <button type="button" onClick={() => navigate('/seller')} className="transition hover:text-orange-600">Become a Vendor</button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-2.5 lg:gap-5">
          <Link href="/" prefetch className="shrink-0" onClick={() => beginLinkNavigation("/")}>
            <StoreLogo />
          </Link>

          <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 items-center rounded-md border border-orange-200 bg-white md:flex">
            <div
              className="relative hidden shrink-0 lg:block"
              onMouseLeave={() => openDropdown === 'search-categories' ? closeDropdown() : undefined}
            >
              <button
                type="button"
                onMouseEnter={() => setOpenDropdown('search-categories')}
                onClick={() => toggleDropdown('search-categories')}
                className="flex items-center gap-2 border-r border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-900 transition hover:text-orange-600"
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
                  className="absolute left-0 top-full z-50 w-[560px] grid-cols-[260px_minmax(0,1fr)]"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
              <SearchIcon />
              <input
                type="text"
                placeholder="Find product"
                value={searchQuery}
                onFocus={() => openDropdown === 'search-categories' ? closeDropdown() : undefined}
                onChange={e => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 py-2.5 text-[13px] outline-none placeholder:text-gray-400"
              />
            </div>
            <button type="submit" className="self-stretch bg-orange-600 px-6 text-[13px] font-semibold text-white transition hover:bg-orange-700">
              Search
            </button>
          </form>

          <div className="ml-auto hidden items-center gap-4 md:flex">
            <NavAction label="Orders" onClick={() => navigate('/my-orders')}><BagIcon /></NavAction>
            <NavAction label="Saved" onClick={() => navigate('/all-products')}><HeartIcon /></NavAction>
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

          <div className="ml-auto flex items-center gap-3 md:hidden">
            <button type="button" onClick={openMobileSearch} aria-label="Search products" className={`rounded-full p-1 text-gray-900 transition ${isMobileSearchOpen ? "bg-orange-50 text-orange-600" : ""}`}>
              <SearchIcon />
            </button>
            <button type="button" onClick={() => navigate('/all-products')} aria-label="Saved items" className="text-gray-900">
              <HeartIcon />
            </button>
            <button type="button" onClick={() => navigate('/cart')} aria-label="Open cart" className="relative text-gray-900">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-2.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {formatBadgeCount(cartCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        <div ref={mobileSearchRef} className="mx-auto px-4 pb-3 sm:px-6 md:hidden">
          <div className={`grid transition-all duration-300 ease-out ${isMobileSearchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <form onSubmit={handleSearch} className="flex overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <SearchIcon />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Find product"
                    value={searchQuery}
                    onFocus={closeDropdown}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="min-w-0 flex-1 py-3 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
                <button type="button" onClick={() => toggleDropdown('mobile-categories')} className="border-l border-gray-200 px-3 text-xs font-semibold text-gray-900">
                  All category
                </button>
                <button type="submit" className="bg-orange-600 px-4 text-xs font-semibold text-white">
                  Search
                </button>
              </form>
              {openDropdown === 'mobile-categories' ? (
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg">
                  {homeCategoryValues.slice(0, 8).map((category) => {
                    const meta = getCategoryMeta(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => goTo(buildCategoryHref(category))}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                          <CategoryGlyph category={category} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="inline-flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-gray-900">
              <UgandaFlag className="h-5 w-5" />
              <span>Uganda, UGX</span>
              <ChevronDown />
            </div>
            {roleLinks.length ? (
              <div className="flex shrink-0 items-center gap-1.5">
                {roleLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => navigate(link.href)}
                    className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden border-t border-gray-100 lg:block">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-2">
            <div className="relative flex items-center gap-7 text-[13px] font-semibold text-gray-950">
              <div
                className="relative"
                onMouseLeave={() => openDropdown === 'nav-categories' ? closeDropdown() : undefined}
              >
                <button type="button" onMouseEnter={() => setOpenDropdown('nav-categories')} onClick={() => toggleDropdown('nav-categories')} className="flex items-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 text-white transition hover:bg-orange-700">
                  <MenuIcon />
                  All category
                </button>
                {openDropdown === 'nav-categories' ? (
                  <CategoryDropdown
                    categories={homeCategoryValues.slice(0, 12)}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    goTo={goTo}
                    className="absolute left-0 top-full z-50 w-[570px] grid-cols-[270px_minmax(0,1fr)]"
                  />
                ) : null}
              </div>
              <button type="button" onClick={() => navigate('/all-products?filter=flash')} className="transition hover:text-orange-600">Hot offers</button>
              <button type="button" onClick={() => navigate('/all-products')} className="transition hover:text-orange-600">Recommendations</button>
              <button type="button" onClick={() => navigate('/all-products?sort=newest')} className="transition hover:text-orange-600">New Arrivals</button>
              <button type="button" onClick={() => navigate('/all-products?filter=flash')} className="transition hover:text-orange-600">Bestsellers</button>
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
              {roleLinks.map((link) => (
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

      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 pb-2 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-5 rounded-2xl border border-gray-100 bg-white px-1 py-1.5 text-[11px] font-semibold text-gray-500 shadow-sm">
          {[
            { label: "Home", href: "/", icon: <HomeIcon /> },
            { label: "Categories", href: "/all-products", icon: <BoxIcon /> },
            { label: "Deals", href: "/all-products?filter=flash", icon: <NotificationIcon /> },
            { label: "Orders", href: "/my-orders", icon: <BagIcon /> },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.href ? navigate(item.href) : openSignIn()}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl transition ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href?.split("?")[0] || " ")) ? "bg-orange-50 text-orange-600" : "text-gray-500"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {!clerkReady ? (
            <div className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-gray-500">
              <NavbarUserSkeleton />
              <span>Account</span>
            </div>
          ) : user ? (
            <div className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl transition ${isMobileAccountOpen ? "text-orange-600" : "text-gray-500"}`}>
              <button type="button" onClick={openMobileAccount} aria-label="Open account menu" className="relative flex flex-col items-center gap-1">
                <AccountMenuIcon type="account" />
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
              className="relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-gray-500 transition hover:text-orange-600"
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
