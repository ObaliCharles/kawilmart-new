'use client'

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { buildCategoryHref, homeCategoryValues } from "@/lib/marketplaceCategories";

// One icon set on a single 24x24 grid at 1.7 stroke keeps the footer reading as
// one system instead of a pile of mismatched glyphs. Every entry below is used
// exactly once, so no two rows in the footer share a glyph: a repeated icon
// stops being a label and turns into decoration.
const Icon = ({ type, className = "h-4 w-4" }) => {
  const paths = {
    // Section headers
    service: "M20 12.5a7.5 7.5 0 0 1-10.9 6.7L4.5 20.5l1.4-4.6A7.5 7.5 0 1 1 20 12.5ZM9 12.5h.01M12 12.5h.01M15 12.5h.01",
    company: "M4 21V6l7-3v18M11 21h9V10h-9M7 9h.01M7 13h.01M7 17h.01M15 13h.01M15 17h.01",
    account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    vendor: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    categories: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    payment: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",

    // Customer service
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-1.6-11.2a1.7 1.7 0 1 1 2.4 1.5c-.5.3-.8.8-.8 1.4v.6m0 2.7h.01",
    buy: "M6 8h12l-1 11H7L6 8Zm3 0V6.5a3 3 0 0 1 6 0V8",
    shipping: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm10 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    contact: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    track: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",

    // Company
    about: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9.2V16m0-7.8h.01",
    careers: "M3.5 8.5h17v10h-17v-10Zm5.5 0V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8v1.7M3.5 13h17",
    press: "M5 10h3l6-4v12l-6-4H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm12-.4a4 4 0 0 1 0 6.8M8 14.5V19",
    affiliates: "M10.5 13.5a3.5 3.5 0 0 0 5 .3l2.2-2.2a3.5 3.5 0 0 0-5-5l-1.2 1.2M13.5 10.5a3.5 3.5 0 0 0-5-.3l-2.2 2.2a3.5 3.5 0 0 0 5 5l1.2-1.2",
    guides: "M12 7.6C10.5 6.1 8.3 5.6 4.5 5.6v11c3.8 0 6 .5 7.5 2 1.5-1.5 3.7-2 7.5-2v-11c-3.8 0-6 .5-7.5 2Zm0 0V18.6",
    terms: "M6 3.5h7l5 5v12H6v-17Zm7 0v5h5M9 13h6M9 16.5h6",

    // Account
    profile: "M3.5 6h17v12h-17V6Zm5.5 5.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 4.9a3.4 3.4 0 0 1 6 0M14.5 10h4M14.5 13.5h4",
    orders: "M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5v-17Zm3 5h6M9 12h6M9 15.5h3",
    wishlist: "M12 20s-7-4.3-7-9.1A3.8 3.8 0 0 1 12 8.1a3.8 3.8 0 0 1 7 2.8c0 4.8-7 9.1-7 9.1Z",
    saved: "M6.5 4h11v16l-5.5-4-5.5 4V4Z",
    cart: "M3 4.5h2.3l2.3 10.4h9.5L19 7.9H6.6M9.6 19.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm7 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z",
    alerts: "M12 3.5A5.5 5.5 0 0 0 6.5 9c0 4-1.5 5.6-1.5 5.6h14S17.5 13 17.5 9A5.5 5.5 0 0 0 12 3.5ZM10 18a2 2 0 0 0 4 0",

    // Vendor
    sell: "M4 11.6V4.6h7l8.4 8.4-7 7L4 11.6Zm3.6-3.6h.01",
    dashboard: "M4.5 19.5h15M7 19.5v-5.5M11.5 19.5V8M16 19.5v-8.5",
    vendorHelp: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm2.5-6 3.1-3.1m-9.2 9.2-3.1 3.1m9.2 0 3.1 3.1m-9.2-9.2L5.4 5.4",
    joinVendor: "M10 12.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM3.8 20a6.2 6.2 0 0 1 12.4 0M18.5 8.5v5M16 11h5",

    // Categories
    fashion: "M8.6 4 5 6.2 3.6 10.4 6.2 11.3V20h11.6v-8.7l2.6-.9L19 6.2 15.4 4a3.4 3.4 0 0 1-6.8 0Z",
    beauty: "M9 10.4h6V20H9v-9.6Zm1-6.4 4-.5v6.9h-4V4Z",
    health: "M9.2 4.5h5.6v4.7h4.7v5.6h-4.7v4.7H9.2v-4.7H4.5V9.2h4.7V4.5Z",
    home: "M4 10.4 12 4l8 6.4V20H4v-9.6Zm5.5 9.6v-6h5v6",
    phones: "M7 3.5h10v17H7v-17Zm4.4 14h1.2",
    computers: "M4 5.5h16v10H4v-10Zm-1.6 13h19.2M9.6 15.5h4.8",
    allCategories: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.6-9h7.2m0 0-2.6-2.6M15.6 12 13 14.6",

    // Trust strip
    secure: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4",
    fastDelivery: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-8V9.6M9.5 2.5h5M19 4.6 20.4 6",
    quality: "M12 4.2 14.4 9l5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 9.8 9.6 9 12 4.2Z",
    support: "M4 13a8 8 0 0 1 16 0m0 0v3a2 2 0 0 1-2 2h-1v-5h3ZM4 13v5h3v-5H4Z",

    chevron: "m6 9 6 6 6-6",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Social marks stay filled and true to each brand rather than being redrawn as
// hairline outlines. They are logos, not UI icons, and only stay recognisable
// at 18px in their real shape.
const SocialMark = ({ type, className = "h-[18px] w-[18px]" }) => {
  const paths = {
    facebook: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z",
    instagram: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.98A3.86 3.86 0 1 0 12 15.86 3.86 3.86 0 0 0 12 8.14Zm0 6.37A2.51 2.51 0 1 1 12 9.49a2.51 2.51 0 0 1 0 5.02Zm4.91-6.54a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z",
    twitter: "M17.53 3h3.05l-6.66 7.62L21.75 21h-6.13l-4.81-6.29L5.3 21H2.25l7.13-8.15L2.55 3h6.29l4.35 5.75L17.53 3Zm-1.07 16.18h1.69L7.62 4.74H5.8l10.66 14.44Z",
    youtube: "M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78C2 8.76 2 12 2 12s0 3.24.42 4.81a2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78C22 15.24 22 12 22 12s0-3.24-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
};

// The Categories column is generated from the live category list, so its icons
// are matched by name here. Anything without a match falls back to the generic
// grid tile rather than borrowing another category's glyph.
const categoryIcons = {
  "Fashion": "fashion",
  "Beauty & Cosmetics": "beauty",
  "Health & Personal Care": "health",
  "Home & Living": "home",
  "Phones & Tablets": "phones",
  "Computers & Electronics": "computers",
};

const footerColumns = [
  {
    title: "Customer Service",
    icon: "service",
    links: [
      ["Help Center", "/help", "help"],
      ["How to Buy", "/help/shopping", "buy"],
      ["Shipping & Delivery", "/legal#terms", "shipping"],
      ["Returns & Refunds", "/legal#terms", "returns"],
      ["Contact Us", "mailto:kawilmart@gmail.com", "contact"],
      ["Track Order", "/track-order", "track"],
    ],
  },
  {
    title: "Company",
    icon: "company",
    links: [
      ["About Us", "/about", "about"],
      ["Careers", "/careers", "careers"],
      ["Press & Media", "/press", "press"],
      ["Affiliates", "/affiliates", "affiliates"],
      ["Shopping Guides", "/guides", "guides"],
      ["Terms of Service", "/legal#terms", "terms"],
    ],
  },
  {
    title: "Account",
    icon: "account",
    links: [
      ["My Account", "/my-orders", "profile"],
      ["Orders", "/my-orders", "orders"],
      ["Wishlist", "/wishlist", "wishlist"],
      ["Saved Items", "/wishlist", "saved"],
      ["My Cart", "/cart", "cart"],
      ["Alerts", "/notifications", "alerts"],
    ],
  },
  {
    title: "Vendor",
    icon: "vendor",
    links: [
      ["Sell on Wilwa", "/seller", "sell"],
      ["Vendor Dashboard", "/seller", "dashboard"],
      ["Vendor Support", "/help", "vendorHelp"],
      ["Become a Vendor", "/become-a-vendor", "joinVendor"],
    ],
  },
  {
    title: "Categories",
    icon: "categories",
    links: [
      ...homeCategoryValues
        .slice(0, 6)
        .map((category) => [category, buildCategoryHref(category), categoryIcons[category] || "categories"]),
      ["View All Categories", "/categories", "allCategories"],
    ],
  },
];

const trustPoints = [
  { icon: "secure", title: "Secure Payment", detail: "100% secure payment" },
  { icon: "fastDelivery", title: "Fast Delivery", detail: "Across Uganda" },
  { icon: "quality", title: "Best Quality", detail: "Top quality products" },
  { icon: "support", title: "24/7 Support", detail: "We're here to help" },
];

const socialLinks = [
  { key: "facebook", label: "Facebook", href: "#", hover: "hover:text-[#1877F2]" },
  { key: "instagram", label: "Instagram", href: "#", hover: "hover:text-[#E1306C]" },
  { key: "twitter", label: "X (Twitter)", href: "#", hover: "hover:text-white" },
  { key: "youtube", label: "YouTube", href: "#", hover: "hover:text-[#FF0000]" },
];

const legalLinks = [
  ["Privacy Policy", "/legal#privacy"],
  ["Terms of Service", "/legal#terms"],
  ["Cookie Policy", "/legal#privacy"],
];

const BrandMark = () => (
  <Link
    href="/"
    className="inline-flex shrink-0 items-center"
    aria-label="Wilwa home"
  >
    <Image src={assets.logo_dark_theme} alt="Wilwa" width={132} height={40} className="h-9 w-auto object-contain" priority={false} />
  </Link>
);

const SocialIconRow = ({ className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {socialLinks.map(({ key, label, href, hover }) => (
      <a
        key={key}
        href={href}
        aria-label={label}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/25 hover:bg-white/10 ${hover}`}
      >
        <SocialMark type={key} />
      </a>
    ))}
  </div>
);

// Only the methods actually accepted today. Card marks were removed because
// showing Visa/Mastercard we cannot process misleads shoppers at checkout.
const PaymentMarks = ({ className = "" }) => {
  const marks = [
    { key: "mtn", node: <span className="rounded-[3px] bg-[#FFCC00] px-1.5 py-1 text-[10px] font-black leading-none text-black">MTN</span> },
    { key: "airtel", node: <span className="text-[12px] font-black lowercase tracking-tight text-[#E40000]">airtel</span> },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {marks.map(({ key, node }) => (
        <span key={key} className="flex h-9 min-w-[3.4rem] items-center justify-center rounded-md bg-white px-2.5 shadow-sm">
          {node}
        </span>
      ))}
    </div>
  );
};

const NewsletterForm = ({ idPrefix = "" }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !email.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/newsletter", { email: email.trim() });
      if (data.success) {
        toast.success(data.message || "Subscribed successfully");
        setEmail("");
      } else {
        toast.error(data.message || "Could not subscribe right now");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not subscribe right now");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <label htmlFor={`${idPrefix}newsletter-email`} className="sr-only">Email address</label>
      <input
        id={`${idPrefix}newsletter-email`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="shrink-0 bg-orange-600 px-4 text-[13px] font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "..." : "Subscribe"}
      </button>
    </form>
  );
};

// items-start rather than items-center: the longer category names wrap on to a
// second line in the narrow lg columns, and a centred icon would drift into the
// gap between the two lines instead of sitting against the first word.
const FooterLink = ({ href, icon, children }) => {
  const className = "group inline-flex items-start gap-2 text-[13px] leading-5 text-slate-300 transition hover:text-white";
  const content = (
    <>
      {icon ? <span className="mt-[2px] shrink-0 text-slate-500 transition group-hover:text-orange-500"><Icon type={icon} className="h-[15px] w-[15px]" /></span> : null}
      <span className="min-w-0">{children}</span>
    </>
  );

  if (href.startsWith("mailto:")) {
    return <a className={className} href={href}>{content}</a>;
  }

  return <Link className={className} href={href}>{content}</Link>;
};

// Below lg the five link columns collapse into accordions. Six stacked lists
// of six links each is otherwise an unusable amount of footer to scroll past.
const FooterAccordion = ({ title, icon, open, onToggle, children }) => (
  <div className="border-b border-white/10">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-3 py-3.5 text-left"
    >
      <span className="shrink-0 text-slate-400"><Icon type={icon} className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-white">{title}</span>
      <span className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
        <Icon type="chevron" className="h-4 w-4" />
      </span>
    </button>
    {/* Grid-rows animates to the list's natural height without a max-height
        guess that would clip the longer columns. */}
    <div className={`grid transition-all duration-300 ease-snappy ${open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        <div className="pl-[30px]">{children}</div>
      </div>
    </div>
  </div>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState("");

  const toggleSection = (key) => setOpenSection((current) => (current === key ? "" : key));

  return (
    /* Bottom padding clears the fixed mobile dock; tied to the dock's own height
       variable so the copyright row can't slip back underneath it. */
    <footer className="bg-[#0f172a] pb-[calc(var(--app-dock-h)+0.5rem)] text-slate-300 md:pb-0">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,3.2fr)_minmax(0,1.15fr)] lg:gap-10">
          {/* Brand ------------------------------------------------------- */}
          <div className="min-w-0">
            {/* Socials sit beside the logo only from sm to lg. On a 320px
                phone the mark plus four 36px buttons overflows the row, and
                the desktop column is too narrow for them side by side. */}
            <div className="flex items-start justify-between gap-4">
              <BrandMark />
              <SocialIconRow className="hidden sm:flex lg:hidden" />
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-400">
              Uganda&apos;s marketplace for everyday essentials. Shop top brands with convenience and trust.
            </p>
            <SocialIconRow className="mt-5 flex sm:hidden lg:flex" />
          </div>

          {/* Link columns ------------------------------------------------- */}
          <div className="min-w-0">
            <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
              {footerColumns.map((column) => (
                <div key={column.title} className="min-w-0">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">{column.title}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {column.links.map(([label, href, icon]) => (
                      <li key={label} className="min-w-0">
                        <FooterLink href={href} icon={icon}>{label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid border-t border-white/10 sm:grid-cols-2 sm:gap-x-8 lg:hidden">
              {footerColumns.map((column) => (
                <FooterAccordion
                  key={column.title}
                  title={column.title}
                  icon={column.icon}
                  open={openSection === column.title}
                  onToggle={() => toggleSection(column.title)}
                >
                  <ul className="space-y-2.5">
                    {column.links.map(([label, href, icon]) => (
                      <li key={label} className="min-w-0">
                        <FooterLink href={href} icon={icon}>{label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </FooterAccordion>
              ))}

              <FooterAccordion
                title="Payment Methods"
                icon="payment"
                open={openSection === "Payment Methods"}
                onToggle={() => toggleSection("Payment Methods")}
              >
                <PaymentMarks />
              </FooterAccordion>
            </div>
          </div>

          {/* Newsletter + payment ----------------------------------------- */}
          <div className="min-w-0">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">Newsletter</h2>
            <p className="mt-3 text-[13px] leading-6 text-slate-400">
              Subscribe to get updates on new arrivals and exclusive offers.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>

            <div className="mt-7 hidden lg:block">
              <h2 className="inline-block border-b-2 border-orange-500 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Payment Methods
              </h2>
              <PaymentMarks className="mt-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip + legal ---------------------------------------------- */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-4">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-500">
                    <Icon type={point.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-white">{point.title}</span>
                    <span className="block truncate text-[11px] text-slate-400">{point.detail}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[12px] text-slate-400 lg:text-right">
              <p>&copy; {currentYear} Wilwa. All rights reserved.</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 lg:justify-end">
                {legalLinks.map(([label, href], index) => (
                  <React.Fragment key={label}>
                    {index > 0 ? <span className="text-white/20" aria-hidden="true">|</span> : null}
                    <Link href={href} className="transition hover:text-white">{label}</Link>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
