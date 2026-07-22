'use client'

import React, { useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";

// One line-icon set at a single 1.7 stroke weight. No emoji anywhere — every
// glyph here is drawn so it inherits brand colour and scales cleanly.
const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    mission: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    vision: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    values: "M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z",
    payments: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    delivery: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    sellers: "M4 9h16l-1 10H5L4 9Zm3 0V7a5 5 0 0 1 10 0v2M9.5 13l1.8 1.8L15 11",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    prices: "M4 12.5 12.5 4H20v7.5L11.5 20 4 12.5Zm12-4.5h.01",
    support: "M4 13a8 8 0 0 1 16 0m0 0v3a2 2 0 0 1-2 2h-1v-5h3ZM4 13v5h3v-5H4Z",
    customers: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 7a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M17 19a6 6 0 0 0-2-4.5",
    store: "M4 9h16l-1 10H5L4 9Zm3 0V7a5 5 0 0 1 10 0v2",
    products: "M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Zm0 0v18m0-9 8.5-4.5M12 12 3.5 7.5",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
    check: "m5 13 4 4L19 7",
    arrow: "M5 12h14m0 0-5-5m5 5-5 5",
    mail: "M3.5 6.5h17v11h-17v-11Zm0 0 8.5 6.5 8.5-6.5",
    linkedin: "M6 9v9M6 6.01V6M11 18v-5a2.5 2.5 0 0 1 5 0v5M11 9.5V18",
    x: "m5 5 14 14M19 5 5 19",
    plus: "M12 5v14M5 12h14",
    star: "M12 3.6 14.7 9l6 .9-4.35 4.2 1.03 5.9L12 17.2 6.62 20l1.03-5.9L3.3 9.9l6-.9L12 3.6Z",
    quote: "M9 11H5.5V7.5H9V11Zm0 0c0 3-1.5 4.5-3.5 5.5M18.5 11H15V7.5h3.5V11Zm0 0c0 3-1.5 4.5-3.5 5.5",
    shield: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const PILLARS = [
  { icon: "mission", tone: "bg-orange-50 text-orange-600", title: "Our Mission", body: "To provide a seamless and reliable online shopping experience while supporting local businesses." },
  { icon: "vision", tone: "bg-sky-50 text-sky-600", title: "Our Vision", body: "To be Uganda's most trusted online marketplace, known for quality, innovation and impact." },
  {
    icon: "values",
    tone: "bg-rose-50 text-rose-600",
    title: "Our Values",
    list: ["Customer First", "Integrity & Trust", "Innovation", "Community Growth"],
  },
];

const REASONS = [
  { icon: "payments", title: "Secure Payments", detail: "100% safe & protected" },
  { icon: "delivery", title: "Fast Delivery", detail: "Across Uganda" },
  { icon: "sellers", title: "Trusted Sellers", detail: "Verified & reliable" },
  { icon: "returns", title: "Easy Returns", detail: "Hassle-free returns" },
  { icon: "prices", title: "Best Prices", detail: "Affordable for all" },
  { icon: "support", title: "24/7 Support", detail: "We're here to help" },
];

const TEAM = [
  { name: "Obali Junior Charles", role: "CEO & Co-founder", short: "Charles" },
  { name: "Laloyomaber Joshua", role: "CTO & Co-founder", short: "Joshua" },
  { name: "Rubangakene Emmy", role: "Operations Head", short: "Emmy" },
  { name: "Customer Happiness", role: "Support Lead", short: "Support" },
];

// Years past the present are labelled "Ahead" so aspirations never read as
// things that already happened.
const JOURNEY = [
  { year: "2025", title: "The Beginning", body: "KawilMart was founded with a small team and big dreams.", status: "done" },
  { year: "2026", title: "Growing Strong", body: "Expanding our seller network and improving delivery across the country.", status: "now" },
  { year: "2027", title: "New Milestones", body: "Introducing new features and a further improved customer experience.", status: "ahead" },
  { year: "2028", title: "The Future", body: "Continuing to innovate and make shopping better for everyone.", status: "ahead" },
];

// Only the rails we actually process. Card networks were deliberately left out
// so this page does not promise payment methods checkout cannot take.
const PARTNERS = [
  { key: "mtn", node: <span className="rounded-[3px] bg-[#FFCC00] px-2 py-1 text-[11px] font-black leading-none text-black">MTN</span> },
  { key: "airtel", node: <span className="text-[15px] font-black lowercase tracking-tight text-[#E40000]">airtel</span> },
];

const AVATAR_TONES = [
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

const initialsFor = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "K";

const SectionTitle = ({ children, className = "" }) => (
  <h2 className={`text-center text-[19px] font-black tracking-tight text-gray-950 md:text-[26px] ${className}`}>
    {children}
  </h2>
);

const AboutPageContent = ({ about, testimonials = [] }) => {
  const { navigate } = useAppContext();
  const [openJourney, setOpenJourney] = useState("2025");
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const activeTestimonial = testimonials[testimonialIndex] || null;

  const stats = [
    { icon: "customers", value: "5,000+", label: "Happy Customers" },
    { icon: "store", value: "300+", label: "Trusted Sellers" },
    { icon: "products", value: "10,000+", label: "Products Available" },
    { icon: "clock", value: "24/7", label: "Customer Support" },
  ];

  return (
    <main className="bg-white">
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1005] via-[#2b1608] to-[#0f172a] text-white">
        <div className="absolute inset-0 opacity-25">
          <Image
            src={assets.girl_with_headphone_image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1005] via-[#1a1005]/85 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <p className="animate-page-enter text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
            {about?.eyebrow || "About KawilMart"}
          </p>
          <h1 className="mt-2.5 max-w-2xl text-[26px] font-black leading-[1.15] tracking-tight md:text-[44px]">
            More than a marketplace,
            <span className="block text-orange-400">we&apos;re a community.</span>
          </h1>
          <p className="mt-3.5 max-w-xl text-[13px] leading-6 text-white/80 md:text-[15px]">
            {about?.intro || "KawilMart was created to simplify shopping in Uganda by connecting trusted sellers with smart buyers."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/all-products")}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-[13px] font-bold text-white transition hover:bg-orange-700"
            >
              <Icon type="products" className="h-4 w-4" />
              Shop Now
            </button>
            <button
              type="button"
              onClick={() => navigate("/become-a-vendor")}
              className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-[13px] font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Become a Seller
            </button>
          </div>
        </div>
      </section>

      {/* Our story ------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <div className="reveal-up relative overflow-hidden rounded-2xl">
            <Image
              src={assets.boy_with_laptop_image}
              alt="The KawilMart team at work"
              width={640}
              height={420}
              className="h-52 w-full object-cover md:h-72"
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3 py-2 text-[11.5px] font-bold text-white shadow-lg">
              <Icon type="shield" className="h-4 w-4" />
              Building trust · Delivering value
            </span>
          </div>

          <div className="reveal-up min-w-0">
            <SectionTitle className="!text-left">Our Story</SectionTitle>
            <p className="mt-3 text-[13px] leading-6 text-gray-600 md:text-[14.5px]">
              {about?.story}
            </p>
            <button
              type="button"
              onClick={() => navigate("/all-products")}
              className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-orange-600 transition hover:gap-2.5 hover:text-orange-700"
            >
              Start exploring the marketplace
              <Icon type="arrow" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values ---------------------------------------- */}
      <section className="bg-[#fff8f3] py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {PILLARS.map((pillar, index) => (
              <article
                key={pillar.title}
                style={{ "--reveal-delay": `${index * 70}ms` }}
                className="reveal-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-orange-100/70"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${pillar.tone}`}>
                  <Icon type={pillar.icon} className="h-[22px] w-[22px]" />
                </span>
                <h3 className="mt-3.5 text-[15px] font-black text-gray-950">{pillar.title}</h3>

                {pillar.list ? (
                  <ul className="mt-2.5 space-y-1.5">
                    {pillar.list.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[12.5px] text-gray-700">
                        <span className="text-emerald-600"><Icon type="check" className="h-3.5 w-3.5" /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12.5px] leading-[20px] text-gray-600">{pillar.body}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose ------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <SectionTitle>Why Choose KawilMart?</SectionTitle>
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-6">
          {REASONS.map((reason, index) => (
            <div
              key={reason.title}
              style={{ "--reveal-delay": `${index * 50}ms` }}
              className="reveal-up flex min-w-0 flex-col items-center text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon type={reason.icon} className="h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-2.5 text-[11.5px] font-bold leading-tight text-gray-950 md:text-[12.5px]">{reason.title}</h3>
              <p className="mt-0.5 text-[10.5px] leading-tight text-gray-500 md:text-[11.5px]">{reason.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats ------------------------------------------------------------ */}
      <section className="bg-[#0f172a] py-7 text-white md:py-9">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-3 gap-y-6 px-4 sm:px-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 items-center justify-center gap-2.5">
              <span className="shrink-0 text-orange-400">
                <Icon type={stat.icon} className="h-6 w-6 md:h-7 md:w-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-black leading-tight md:text-[22px]">{stat.value}</span>
                <span className="block truncate text-[10.5px] text-white/65 md:text-[12px]">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Team ------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <SectionTitle>Meet Our Team</SectionTitle>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TEAM.map((member, index) => (
            <article
              key={member.name}
              style={{ "--reveal-delay": `${index * 60}ms` }}
              className="reveal-up flex min-w-0 flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100"
            >
              <span className={`flex h-16 w-16 items-center justify-center rounded-full text-[18px] font-black ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>
                {initialsFor(member.name)}
              </span>
              <h3 className="mt-2.5 w-full truncate text-[12.5px] font-bold text-gray-950 md:text-[13.5px]">{member.name}</h3>
              <p className="mt-0.5 w-full truncate text-[11px] text-gray-500">{member.role}</p>
              <div className="mt-2 flex items-center gap-2 text-gray-400">
                <Icon type="linkedin" className="h-[15px] w-[15px]" />
                <Icon type="x" className="h-[15px] w-[15px]" />
                <Icon type="mail" className="h-[15px] w-[15px]" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Journey ----------------------------------------------------------- */}
      <section className="bg-[#fff8f3] py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle>Our Journey</SectionTitle>

          {/* Horizontal rail on desktop, accordion on phones — four blocks of
              copy side by side is unreadable at 360px. */}
          <div className="mt-8 hidden md:block">
            <div className="relative">
              <span className="absolute left-0 right-0 top-1.5 h-0.5 bg-orange-200" />
              <div className="relative grid grid-cols-4 gap-4">
                {JOURNEY.map((entry) => (
                  <div key={entry.year} className="min-w-0">
                    <span className={`block h-3.5 w-3.5 rounded-full ring-4 ring-[#fff8f3] ${entry.status === "ahead" ? "bg-orange-200" : "bg-orange-600"}`} />
                    <p className="mt-3 text-[15px] font-black text-orange-600">{entry.year}</p>
                    <p className="mt-0.5 text-[13px] font-bold text-gray-950">{entry.title}</p>
                    <p className="mt-1 text-[12px] leading-[18px] text-gray-600">{entry.body}</p>
                    {entry.status === "ahead" ? (
                      <span className="mt-1.5 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Ahead</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 md:hidden">
            {JOURNEY.map((entry) => {
              const open = openJourney === entry.year;
              return (
                <div key={entry.year} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-orange-100/70">
                  <button
                    type="button"
                    onClick={() => setOpenJourney(open ? "" : entry.year)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry.status === "ahead" ? "bg-orange-200" : "bg-orange-600"}`} />
                    <span className="min-w-0 flex-1 text-[12.5px] font-bold text-gray-950">
                      {entry.year} &ndash; {entry.title}
                    </span>
                    <span className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
                      <Icon type="plus" className="h-4 w-4" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-snappy ${open ? "grid-rows-[1fr] pb-3.5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="px-3.5 text-[12px] leading-[18px] text-gray-600">{entry.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials + partners -------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className={`grid gap-4 ${activeTestimonial ? "md:grid-cols-2" : ""}`}>
          {activeTestimonial ? (
            <div className="reveal-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <SectionTitle className="!text-left !text-[15px] md:!text-[18px]">What Our Customers Say</SectionTitle>

              <div className="mt-4 min-h-[9rem]">
                <span className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg key={index} className="h-4 w-4" viewBox="0 0 24 24" fill={index < activeTestimonial.rating ? "currentColor" : "none"} aria-hidden="true">
                      <path d="M12 3.6 14.7 9l6 .9-4.35 4.2 1.03 5.9L12 17.2 6.62 20l1.03-5.9L3.3 9.9l6-.9L12 3.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  ))}
                </span>
                <p className="mt-2.5 break-words text-[13px] leading-[21px] text-gray-700">
                  &ldquo;{activeTestimonial.comment}&rdquo;
                </p>
                <p className="mt-3 text-[12.5px] font-bold text-gray-950">{activeTestimonial.name}</p>
                <p className="truncate text-[11px] text-gray-500">on {activeTestimonial.product}</p>
              </div>

              {testimonials.length > 1 ? (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                    aria-label="Previous review"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                  >
                    <Icon type="arrow" className="h-4 w-4 rotate-180" />
                  </button>
                  <span className="flex gap-1.5">
                    {testimonials.map((_, index) => (
                      <span key={index} className={`h-1.5 rounded-full transition-all ${index === testimonialIndex ? "w-4 bg-orange-600" : "w-1.5 bg-gray-300"}`} />
                    ))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                    aria-label="Next review"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                  >
                    <Icon type="arrow" className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="reveal-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <SectionTitle className="!text-left !text-[15px] md:!text-[18px]">Payments We Accept</SectionTitle>
            <p className="mt-2 text-[12px] leading-[18px] text-gray-500">
              Mobile money and cash on delivery, collected when your order arrives.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {PARTNERS.map((partner) => (
                <span key={partner.key} className="flex h-11 min-w-[4.5rem] items-center justify-center rounded-lg bg-gray-50 px-3 ring-1 ring-gray-100">
                  {partner.node}
                </span>
              ))}
              <span className="flex h-11 items-center justify-center rounded-lg bg-gray-50 px-3 text-[11px] font-bold text-gray-600 ring-1 ring-gray-100">
                Cash on delivery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA --------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="reveal-up overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 p-5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white sm:flex">
                <Icon type="products" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-black leading-tight text-white md:text-[22px]">
                  Ready to Experience the Best of Online Shopping?
                </h2>
                <p className="mt-1 text-[12.5px] leading-[19px] text-white/85">
                  Join shoppers and trusted sellers building Uganda&apos;s marketplace on KawilMart.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/all-products")}
                className="rounded-full bg-white px-6 py-3 text-[13px] font-bold text-orange-700 transition hover:bg-orange-50"
              >
                Start Shopping
              </button>
              <button
                type="button"
                onClick={() => navigate("/become-a-vendor")}
                className="rounded-full border border-white/40 px-6 py-3 text-[13px] font-bold text-white transition hover:bg-white/15"
              >
                Become a Seller
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPageContent;
