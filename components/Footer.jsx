'use client'

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

const footerColumns = [
  {
    title: "Customer Service",
    links: [
      ["Help Center", "/about"],
      ["How to Buy", "/all-products"],
      ["Shipping & Delivery", "/legal#terms"],
      ["Returns & Refunds", "/legal#terms"],
      ["Contact Us", "mailto:kawilmart@gmail.com"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/about"],
      ["Careers", "/about"],
      ["Press & Media", "/about"],
      ["Affiliates", "/about"],
      ["Blog", "/about"],
    ],
  },
  {
    title: "Account",
    links: [
      ["My Account", "/my-orders"],
      ["Orders", "/my-orders"],
      ["Wishlist", "/all-products"],
      ["Track Order", "/my-orders"],
      ["Saved Items", "/all-products"],
    ],
  },
  {
    title: "Vendor",
    links: [
      ["Sell on KawilMart", "/seller"],
      ["Vendor Dashboard", "/seller"],
      ["Vendor Support", "/about"],
    ],
  },
];

const FooterLink = ({ href, children, onNavigate }) => {
  const isExternal = href.startsWith("mailto:");

  if (isExternal) {
    return <a className="transition hover:text-white" href={href}>{children}</a>;
  }

  return (
    <Link className="transition hover:text-white" href={href} onClick={onNavigate}>
      {children}
    </Link>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { setIsRouteLoading } = useAppContext();
  const onNavigate = () => setIsRouteLoading(true);

  return (
    <>
      <footer className="bg-white px-3 pb-24 pt-2 text-slate-300 md:hidden">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_100%)] shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
          <div className="px-5 py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15">
                  <Image className="h-full w-full object-contain" src={assets.logo} alt="KawilMart" width={44} height={44} />
                </div>
                <div>
                  <p className="text-base font-extrabold text-white">KawilMart</p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-orange-400">Marketplace</p>
                </div>
              </div>
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-300">
                Trusted deals
              </span>
            </div>

            <p className="mt-4 text-[13px] leading-6 text-slate-300">
              Discover verified shopping, fast delivery, and everyday value across fashion, electronics, home essentials, and more.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              {['f', 'IG', 'X', 'YT'].map((item) => (
                <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white/90">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {footerColumns.map((column) => (
                <Link
                  key={column.title}
                  href={column.links[0][1]}
                  onClick={onNavigate}
                  className="flex items-center justify-between py-3 text-[13px] font-semibold text-white"
                >
                  {column.title}
                  <span className="text-lg text-white/70">›</span>
                </Link>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <Link href="/legal#privacy" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center font-medium text-white/90">Privacy</Link>
              <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center font-medium text-white/90">Terms</Link>
              <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center font-medium text-white/90">Shipping</Link>
              <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center font-medium text-white/90">Refunds</Link>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-slate-400">
            © {currentYear} KawilMart. All rights reserved.
          </div>
        </div>
      </footer>

      <footer className="hidden bg-[linear-gradient(135deg,#0f172a_0%,#111827_100%)] text-slate-300 md:block">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.35fr_repeat(4,1fr)_1.2fr] lg:px-5">
          <div className="max-w-sm">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 p-1.5">
                <Image className="h-full w-full object-contain" src={assets.logo} alt="KawilMart" width={44} height={44} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">KawilMart</p>
                <p className="text-[11px] uppercase tracking-[0.25em] text-orange-400">Marketplace</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-slate-300">
              Your trusted place for modern shopping, top brands, and everyday convenience.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {['f', 'IG', 'X', 'YT'].map((item) => (
                <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white/90">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-2 text-[13px] text-slate-300">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink href={href} onNavigate={onNavigate}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-sm font-semibold text-white">Newsletter</h2>
            <p className="mt-4 text-[13px] leading-6 text-slate-300">
              Subscribe to get updates on new arrivals and exclusive offers.
            </p>
            <form className="mt-5 flex overflow-hidden rounded-full border border-white/10 bg-white shadow-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 px-4 py-2.5 text-[13px] text-gray-700 outline-none"
              />
              <button type="submit" className="bg-orange-600 px-4 text-[13px] font-semibold text-white transition hover:bg-orange-700">
                Subscribe
              </button>
            </form>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payment</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['VISA', 'Mastercard', 'MTN', 'Airtel'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-5 text-xs text-slate-300 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-5">
            <p>© {currentYear} KawilMart. All rights reserved.</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/legal#privacy" onClick={onNavigate} className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/legal#terms" onClick={onNavigate} className="transition hover:text-white">Terms of Service</Link>
              <Link href="/legal#privacy" onClick={onNavigate} className="transition hover:text-white">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
