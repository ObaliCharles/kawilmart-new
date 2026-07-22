'use client'

import React, { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import { marketplaceFilterCategories } from "@/lib/marketplaceCategories";

// Every fact below is checked against what the product actually does — payment
// options from lib/orderLifecycle, the per-seller order split from checkout,
// the 7-day return window from the order pages. No press releases are invented
// here: if we have not published one, the page says so.
const PRESS_EMAIL = "support@kawilmart.ug";
const PRESS_PHONE = "+256767934191";
const LOGO_FILE = "/kawilmart-email-logo.png";

const BOILERPLATE =
  "KawilMart is a Ugandan online marketplace for everyday essentials, connecting local sellers with buyers " +
  "across the country. Shoppers browse products from independent vendors in one catalogue and pay the way " +
  "they already do — cash, MTN Mobile Money or Airtel Money, all collected on delivery. Sellers get their " +
  "own storefront and dashboard to list stock, manage orders and track earnings.";

const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    mail: "M3.5 6.5h17v11h-17v-11Zm0 0 8.5 6.5 8.5-6.5",
    phone: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    download: "M12 4v11m0 0 4-4m-4 4-4-4M4 19h16",
    copy: "M9 9h10v10H9V9Zm-4 6V5h10",
    store: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    pay: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    pin: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    split: "M6 4v6a4 4 0 0 0 4 4h8m0 0-3-3m3 3-3 3M6 14v6",
    check: "m5 13 4 4L19 7",
    cross: "m6 6 12 12M18 6 6 18",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const fastFacts = [
  {
    icon: "store",
    label: "What it is",
    value: "A multi-vendor marketplace",
    detail: "Independent Ugandan sellers list in one shared catalogue, each with their own storefront and dashboard.",
  },
  {
    icon: "pin",
    label: "Where it operates",
    value: "Uganda",
    detail: "Same-city deliveries usually land within 24 hours; orders travelling between regions take two to three days.",
  },
  {
    icon: "pay",
    label: "How buyers pay",
    value: "Cash, MTN MoMo, Airtel Money",
    detail: "All three are collected on delivery — nothing is charged at the moment the order is placed.",
  },
  {
    icon: "grid",
    label: "Catalogue",
    value: `${marketplaceFilterCategories.length} categories`,
    detail: "From fashion and beauty to phones, appliances, groceries and office supplies.",
  },
  {
    icon: "split",
    label: "How orders work",
    value: "One cart, one order per seller",
    detail: "A cart holding items from several sellers is split so each is prepared and delivered on its own timeline.",
  },
  {
    icon: "returns",
    label: "Returns",
    value: "7-day window",
    detail: "Buyers can request a return within 7 days of delivery; approved refunds go back through the original method.",
  },
];

const brandColours = [
  { name: "KawilMart Orange", hex: "#EA580C", note: "Primary action colour", swatch: "bg-[#EA580C]" },
  { name: "Deep Navy", hex: "#0F172A", note: "Footer and dark surfaces", swatch: "bg-[#0F172A]" },
  { name: "Amber", hex: "#F59E0B", note: "Gradient partner to orange", swatch: "bg-[#F59E0B]" },
  { name: "Page Grey", hex: "#F6F7FB", note: "App background", swatch: "bg-[#F6F7FB] ring-1 ring-gray-200" },
];

const usageRules = [
  { ok: true, text: "Use the logo with clear space around it, at least the height of the mark." },
  { ok: true, text: "Place the logo on white or light backgrounds, or on a white plate over dark ones." },
  { ok: true, text: "Write the name as one word with a capital K and M: KawilMart." },
  { ok: false, text: "Do not stretch, recolour, rotate or add effects to the mark." },
  { ok: false, text: "Do not write it as Kawil Mart, KawilMart Ltd, or KAWILMART in body copy." },
  { ok: false, text: "Do not imply KawilMart endorses a product, seller or story without written confirmation." },
];

const Card = ({ className = "", children, style }) => (
  <section style={style} className={`reveal-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${className}`}>
    {children}
  </section>
);

const PressPage = () => {
  const { navigate } = useAppContext();
  const [copied, setCopied] = useState("");

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied((current) => (current === key ? "" : current)), 2000);
    } catch {
      toast.error("Could not copy — select the text and copy manually");
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-12 md:pt-12">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl">
          <h1 className="animate-page-enter text-[26px] font-black leading-tight tracking-tight md:text-[40px]">
            Press &amp; Media
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-white/85 md:text-[15px]">
            Writing about KawilMart? Here are the facts, the brand assets and the person to talk to. We reply to
            media enquiries within one working day.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent("Media enquiry")}`}
              className="rounded-full bg-white px-5 py-2.5 text-[12.5px] font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Media enquiry
            </a>
            <a
              href={LOGO_FILE}
              download
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-white/20"
            >
              Download logo
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* Fast facts ------------------------------------------------------ */}
        <Card className="-mt-5 md:-mt-7">
          <h2 className="text-[15px] font-bold text-gray-950">Fast facts</h2>
          <p className="mt-1 text-[11.5px] text-gray-500">Accurate as of today. Please check with us before publishing figures.</p>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {fastFacts.map((fact) => (
              <article key={fact.label} className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm">
                    <Icon type={fact.icon} className="h-[17px] w-[17px]" />
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400">{fact.label}</span>
                </div>
                <p className="mt-2.5 text-[13px] font-bold text-gray-950">{fact.value}</p>
                <p className="mt-1 text-[11.5px] leading-[17px] text-gray-600">{fact.detail}</p>
              </article>
            ))}
          </div>
        </Card>

        {/* Boilerplate ------------------------------------------------------ */}
        <Card className="mt-3" style={{ "--reveal-delay": "60ms" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-gray-950">Company boilerplate</h2>
              <p className="mt-1 text-[11.5px] text-gray-500">Copy this straight into your piece.</p>
            </div>
            <button
              type="button"
              onClick={() => copy(BOILERPLATE, "boilerplate")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-600 px-3.5 py-2 text-[11.5px] font-bold text-white transition hover:bg-orange-700"
            >
              <Icon type={copied === "boilerplate" ? "check" : "copy"} className="h-[15px] w-[15px]" />
              {copied === "boilerplate" ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="mt-3 rounded-xl bg-gray-50 p-3.5 text-[12.5px] leading-[20px] text-gray-700 ring-1 ring-gray-100">
            {BOILERPLATE}
          </p>
        </Card>

        {/* Brand assets ------------------------------------------------------ */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="min-w-0" style={{ "--reveal-delay": "100ms" }}>
            <h2 className="text-[15px] font-bold text-gray-950">Logo</h2>
            <p className="mt-1 text-[11.5px] text-gray-500">PNG, transparent background. Use it as supplied.</p>

            <div className="mt-3 flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
              <Image src={assets.logo} alt="KawilMart logo" width={200} height={54} className="h-10 w-auto object-contain" />
            </div>

            <a
              href={LOGO_FILE}
              download
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2.5 text-[12px] font-bold text-gray-700 transition hover:bg-gray-200"
            >
              <Icon type="download" className="h-[16px] w-[16px]" />
              Download PNG
            </a>
          </Card>

          <Card className="min-w-0" style={{ "--reveal-delay": "140ms" }}>
            <h2 className="text-[15px] font-bold text-gray-950">Colours</h2>
            <p className="mt-1 text-[11.5px] text-gray-500">Tap a swatch to copy its hex value.</p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {brandColours.map((colour) => (
                <button
                  key={colour.hex}
                  type="button"
                  onClick={() => copy(colour.hex, colour.hex)}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
                >
                  <span className={`h-9 w-9 shrink-0 rounded-lg ${colour.swatch}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-gray-950">{colour.name}</span>
                    <span className="block text-[11px] font-medium text-gray-500">
                      {copied === colour.hex ? "Copied" : colour.hex}
                    </span>
                    <span className="block truncate text-[10.5px] text-gray-400">{colour.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Usage ------------------------------------------------------------- */}
        <Card className="mt-3" style={{ "--reveal-delay": "180ms" }}>
          <h2 className="text-[15px] font-bold text-gray-950">Using the brand</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {usageRules.map((rule) => (
              <li key={rule.text} className="flex min-w-0 gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    rule.ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  <Icon type={rule.ok ? "check" : "cross"} className="h-3 w-3" />
                </span>
                <span className="min-w-0 text-[12px] leading-[18px] text-gray-600">{rule.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Contact + newsroom note -------------------------------------------- */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section
            style={{ "--reveal-delay": "220ms" }}
            className="reveal-up min-w-0 rounded-2xl bg-[#0f172a] p-4 text-white shadow-sm"
          >
            <h2 className="text-[15px] font-bold">Media contact</h2>
            <p className="mt-1 text-[11.5px] leading-[17px] text-slate-400">
              For interviews, statements, imagery or fact-checking a story before it runs.
            </p>

            <div className="mt-3.5 space-y-2">
              <a
                href={`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent("Media enquiry")}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-orange-400/40 hover:bg-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
                  <Icon type="mail" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">Email</span>
                  <span className="block break-all text-[11px] text-slate-400">{PRESS_EMAIL}</span>
                </span>
              </a>

              <a
                href={`tel:${PRESS_PHONE}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-orange-400/40 hover:bg-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                  <Icon type="phone" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">Phone</span>
                  <span className="block text-[11px] text-slate-400">0767 934 191 &middot; 8AM &ndash; 10PM</span>
                </span>
              </a>
            </div>
          </section>

          {/* An empty "latest news" grid would look broken, so this states the
              position honestly and points to what we do publish instead. */}
          <Card className="min-w-0 flex flex-col" style={{ "--reveal-delay": "260ms" }}>
            <h2 className="text-[15px] font-bold text-gray-950">Newsroom</h2>
            <p className="mt-1 flex-1 text-[12.5px] leading-[19px] text-gray-600">
              We do not have press releases published yet. Announcements go out through our newsletter and social
              channels first &mdash; and if you are working to a deadline, email us and we will get you a statement
              rather than making you wait for one.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/about")}
                className="rounded-full bg-orange-600 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-orange-700"
              >
                About KawilMart
              </button>
              <button
                type="button"
                onClick={() => navigate("/careers")}
                className="rounded-full bg-gray-100 px-4 py-2.5 text-[12px] font-bold text-gray-700 transition hover:bg-gray-200"
              >
                Careers
              </button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default PressPage;
