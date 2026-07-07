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
    <footer className="bg-white px-4 pb-24 pt-2 text-white md:hidden">
      <div className="rounded-xl bg-[#101923] px-6 py-7 shadow-lg">
        <div className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-xl font-extrabold text-white">K</div>
          <span className="text-2xl font-extrabold">KawilMart</span>
        </div>
        <p className="mt-4 text-[13px] leading-6 text-slate-300">
          Your one-stop destination for the best fashion, electronics, home and living and more.
        </p>
        <div className="mt-5 flex items-center gap-3">
          {["f", "IG", "X", "YT"].map((item) => (
            <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/90">
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
              className="flex items-center justify-between py-3 text-[13px] font-bold text-white"
            >
              {column.title}
              <span className="text-xl text-white/75">&rsaquo;</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <Link href="/legal#privacy" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-white/90">Privacy</Link>
          <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-white/90">Terms</Link>
          <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-white/90">Shipping</Link>
          <Link href="/legal#terms" onClick={onNavigate} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-white/90">Refunds</Link>
        </div>
        <p className="pt-6 text-center text-xs text-slate-400">(c) {currentYear} KawilMart. All rights reserved.</p>
      </div>
    </footer>

    <footer className="hidden bg-[#101923] text-white md:block">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-9 sm:px-6 md:grid-cols-[1.35fr_1fr_1fr] lg:grid-cols-[1.5fr_repeat(4,1fr)_1.35fr] lg:px-5">
        <div className="max-w-sm">
          <div className="inline-flex rounded-md bg-white px-2.5 py-2">
            <Image className="h-auto w-28" src={assets.logo} alt="KawilMart" />
          </div>
          <p className="mt-4 text-[13px] leading-6 text-slate-300">
            Your one-stop destination for the best fashion, electronics, home and living, and more.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            {["f", "IG", "X", "YT"].map((item) => (
              <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-white/90">
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

        <div className="md:col-span-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white">Newsletter</h2>
          <p className="mt-4 text-[13px] leading-6 text-slate-300">
            Subscribe to get updates on new arrivals and exclusive offers.
          </p>
          <form className="mt-5 flex overflow-hidden rounded-md border border-white/10 bg-white">
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
            <p className="text-xs text-slate-400">Payment</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["VISA", "Mastercard", "MTN", "Airtel"].map((item) => (
                <span key={item} className="rounded border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-5 text-xs text-slate-300 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-5">
          <p>(c) {currentYear} KawilMart. All rights reserved.</p>
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
