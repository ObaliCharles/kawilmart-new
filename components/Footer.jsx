'use client'

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { buildCategoryHref, marketplaceFilterCategories } from "@/lib/marketplaceCategories";

// One icon set at a single 1.7 stroke weight keeps the footer reading as one
// system instead of a pile of mismatched glyphs.
const Icon = ({ type, className = "h-4 w-4" }) => {
  const paths = {
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-1.6-11.2a1.7 1.7 0 1 1 2.4 1.5c-.5.3-.8.8-.8 1.4v.6m0 2.7h.01",
    buy: "M6 8h12l-1 11H7L6 8Zm3 0V6.5a3 3 0 0 1 6 0V8",
    shipping: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm10 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    contact: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    track: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    support: "M4 13a8 8 0 0 1 16 0m0 0v3a2 2 0 0 1-2 2h-1v-5h3ZM4 13v5h3v-5H4Z",
    company: "M4 21V6l7-3v18M11 21h9V10h-9M7 9h.01M7 13h.01M7 17h.01M15 13h.01M15 17h.01",
    account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    vendor: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    categories: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    payment: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    secure: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4",
    quality: "M12 4.2 14.4 9l5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 9.8 9.6 9 12 4.2Z",
    chevron: "m6 9 6 6 6-6",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const footerColumns = [
  {
    title: "Customer Service",
    icon: "support",
    links: [
      ["Help Center", "/help", "help"],
      ["How to Buy", "/all-products", "buy"],
      ["Shipping & Delivery", "/legal#terms", "shipping"],
      ["Returns & Refunds", "/legal#terms", "returns"],
      ["Contact Us", "mailto:kawilmart@gmail.com", "contact"],
      ["Track Order", "/my-orders", "track"],
    ],
  },
  {
    title: "Company",
    icon: "company",
    links: [
      ["About Us", "/about"],
      ["Careers", "/about"],
      ["Press & Media", "/about"],
      ["Affiliates", "/about"],
      ["Blog", "/about"],
      ["Terms of Service", "/legal#terms"],
    ],
  },
  {
    title: "Account",
    icon: "account",
    links: [
      ["My Account", "/my-orders"],
      ["Orders", "/my-orders"],
      ["Wishlist", "/wishlist"],
      ["Saved Items", "/wishlist"],
      ["My Cart", "/cart"],
      ["Alerts", "/notifications"],
    ],
  },
  {
    title: "Vendor",
    icon: "vendor",
    links: [
      ["Sell on KawilMart", "/seller"],
      ["Vendor Dashboard", "/seller"],
      ["Vendor Support", "/help"],
      ["Become a Vendor", "/seller"],
    ],
  },
  {
    title: "Categories",
    icon: "categories",
    links: [
      ...marketplaceFilterCategories.slice(0, 6).map((category) => [category, buildCategoryHref(category)]),
      ["View All Categories", "/categories"],
    ],
  },
];

const trustPoints = [
  { icon: "secure", title: "Secure Payment", detail: "100% secure payment" },
  { icon: "shipping", title: "Fast Delivery", detail: "Across Uganda" },
  { icon: "quality", title: "Best Quality", detail: "Top quality products" },
  { icon: "support", title: "24/7 Support", detail: "We're here to help" },
];

const socialLinks = [
  { key: "facebook", icon: "facebook_icon", label: "Facebook", href: "#" },
  { key: "instagram", icon: "instagram_icon", label: "Instagram", href: "#" },
  { key: "twitter", icon: "twitter_icon", label: "X (Twitter)", href: "#" },
  { key: "youtube", icon: "youtube_icon", label: "YouTube", href: "#" },
];

const legalLinks = [
  ["Privacy Policy", "/legal#privacy"],
  ["Terms of Service", "/legal#terms"],
  ["Cookie Policy", "/legal#privacy"],
];

// Composed from the standalone bag mark plus live text, so the wordmark sits
// directly on the dark panel instead of needing a white chip behind it.
const BrandMark = () => (
  <Link href="/" className="inline-flex items-center gap-2.5" aria-label="KawilMart home">
    <Image src={assets.kbag_logo} alt="" width={34} height={39} className="h-8 w-auto object-contain" />
    <span className="text-[22px] font-extrabold leading-none tracking-tight">
      <span className="text-white">Kawil</span>
      <span className="text-orange-500">Mart</span>
    </span>
  </Link>
);

const SocialIconRow = ({ className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {socialLinks.map(({ key, icon, label, href }) => (
      <a
        key={key}
        href={href}
        aria-label={label}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-orange-400/40 hover:bg-white/10"
      >
        <Image src={assets[icon]} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
      </a>
    ))}
  </div>
);

// Brand-styled payment marks on white chips so they read as the real Visa /
// Mastercard / MTN / Airtel logos rather than plain text pills.
const PaymentMarks = ({ className = "" }) => {
  const marks = [
    { key: "visa", node: <span className="text-[13px] font-black italic tracking-tight text-[#1A1F71]">VISA</span> },
    {
      key: "mastercard",
      node: (
        <span className="flex items-center">
          <span className="h-[18px] w-[18px] rounded-full bg-[#EB001B]" />
          <span className="-ml-2 h-[18px] w-[18px] rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      ),
    },
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

const FooterLink = ({ href, icon, children }) => {
  const className = "group inline-flex items-center gap-2 text-[13px] text-slate-300 transition hover:text-white";
  const content = (
    <>
      {icon ? <span className="shrink-0 text-slate-500 transition group-hover:text-orange-500"><Icon type={icon} className="h-[15px] w-[15px]" /></span> : null}
      <span className="min-w-0">{children}</span>
    </>
  );

  if (href.startsWith("mailto:")) {
    return <a className={className} href={href}>{content}</a>;
  }

  return <Link className={className} href={href}>{content}</Link>;
};

// Below lg the five link columns collapse into accordions — six stacked lists
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,3.2fr)_minmax(0,1.15fr)] lg:gap-10">
          {/* Brand ------------------------------------------------------- */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <BrandMark />
              <SocialIconRow className="sm:hidden" />
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-400">
              Uganda&apos;s marketplace for everyday essentials. Shop top brands with convenience and trust.
            </p>
            <SocialIconRow className="mt-5 hidden sm:flex" />
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
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
              <p>&copy; {currentYear} KawilMart. All rights reserved.</p>
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
