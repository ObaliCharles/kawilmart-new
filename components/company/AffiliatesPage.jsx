'use client'

import React from "react";
import { useAppContext } from "@/context/AppContext";

// There is no self-serve affiliate dashboard or referral tracking in the
// product yet, so this page does not promise a commission rate or a link
// generator. It describes the partnerships we actually run by hand today and
// says plainly that the automated version is not live.
const PARTNERS_EMAIL = "support@kawilmart.ug";

const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    creator: "M15 8a3 3 0 1 0-6 0 3 3 0 0 0 6 0Zm5 12a8 8 0 0 0-16 0M18 5h4m-2-2v4",
    store: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    community: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0m2.5-14.6a3.5 3.5 0 0 1 0 6.8M18 20a6 6 0 0 0-2-4.5",
    business: "M4 21V6l7-3v18M11 21h9V10h-9M7 9h.01M7 13h.01M7 17h.01",
    mail: "M3.5 6.5h17v11h-17v-11Zm0 0 8.5 6.5 8.5-6.5",
    whatsapp: "M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.3A8 8 0 1 1 20 12Zm-11-3.2c1 3.6 2.6 5.2 6.2 6.2l1-1.4 2 .9v1.3c-3.9.5-7.5-3.1-8-7h1.4l.9 2-1.5 1",
    check: "m5 13 4 4L19 7",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M12 11v6",
    chevron: "m9 6 6 6-6 6",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const partnerTypes = [
  {
    icon: "creator",
    title: "Creators & reviewers",
    body: "You make content for a Ugandan audience — unboxings, reviews, hauls, tech or beauty. We agree a scope and a fee per campaign, and supply products, imagery and any codes involved.",
    fit: "Best if you post regularly and can show your audience numbers.",
  },
  {
    icon: "community",
    title: "Referrers",
    body: "You bring us sellers worth having: shops with real stock and someone to run the store. We pay per seller who onboards and starts fulfilling orders.",
    fit: "Best if you already work with retailers, markets or SACCOs.",
  },
  {
    icon: "business",
    title: "Businesses & institutions",
    body: "Schools, offices, NGOs and estates buying in volume, or platforms that want KawilMart products available to their own users. Terms are set case by case.",
    fit: "Best for bulk orders or an ongoing supply arrangement.",
  },
  {
    icon: "store",
    title: "Sellers",
    body: "The most direct way to earn on KawilMart is to sell on it. Open a store, list your stock, and keep the margin on every order you fulfil — no partnership agreement needed.",
    fit: "Self-serve and live right now.",
    cta: { label: "Become a vendor", href: "/become-a-vendor" },
  },
];

const steps = [
  {
    title: "Tell us what you have in mind",
    body: `Email ${PARTNERS_EMAIL} with "Partnership" in the subject. Include who you are, your audience or network, and the kind of arrangement you are after.`,
  },
  {
    title: "We come back with terms",
    body: "Usually within a few working days. Scope, what each side does, how and when you get paid — written down before anything starts.",
  },
  {
    title: "Run it and get paid",
    body: "Payouts go through mobile money or bank transfer on the schedule in your agreement. We track results together so both sides can see what worked.",
  },
];

const commitments = [
  "No joining fee, ever — if anyone asks you to pay to become a KawilMart partner, it is not us.",
  "Terms in writing before you promote anything, including how payment is calculated.",
  "You are told which products are in stock, so you never send your audience to an empty page.",
  "You keep editorial control. We will not ask you to claim something about a product that is not true.",
];

const Card = ({ className = "", children, style }) => (
  <section style={style} className={`reveal-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${className}`}>
    {children}
  </section>
);

const AffiliatesPage = () => {
  const { navigate } = useAppContext();

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-12 md:pt-12">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl">
          <h1 className="animate-page-enter text-[26px] font-black leading-tight tracking-tight md:text-[40px]">
            Partner with KawilMart
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-white/85 md:text-[15px]">
            Creators, referrers and businesses who want to earn from Uganda&apos;s marketplace. Every partnership is
            agreed directly with our team &mdash; no bots, no tiers, no fine print.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`}
              className="rounded-full bg-white px-5 py-2.5 text-[12.5px] font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Apply to partner
            </a>
            <button
              type="button"
              onClick={() => navigate("/become-a-vendor")}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-white/20"
            >
              Or sell on KawilMart
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* Honest status note ---------------------------------------------- */}
        <Card className="-mt-5 md:-mt-7">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon type="info" className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-bold text-gray-950">The self-serve affiliate programme is not live yet</h2>
              <p className="mt-1 text-[12.5px] leading-[19px] text-gray-600">
                There is no dashboard, tracking link or automatic commission rate to sign up for today &mdash; we would
                rather say that than have you sign up for something that does not exist. Partnerships are arranged
                directly with our team, one agreement at a time, and they pay out. Email us and we will tell you
                exactly what is on the table.
              </p>
            </div>
          </div>
        </Card>

        {/* Partner types ---------------------------------------------------- */}
        <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {partnerTypes.map((type, index) => (
            <article
              key={type.title}
              style={{ "--reveal-delay": `${index * 60}ms` }}
              className="reveal-up flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon type={type.icon} />
              </span>
              <h2 className="mt-3 text-[13.5px] font-bold text-gray-950">{type.title}</h2>
              <p className="mt-1 flex-1 text-[12.5px] leading-[19px] text-gray-600">{type.body}</p>

              <p className="mt-2.5 rounded-xl bg-gray-50 px-3 py-2 text-[11.5px] leading-[17px] text-gray-500 ring-1 ring-gray-100">
                {type.fit}
              </p>

              {type.cta ? (
                <button
                  type="button"
                  onClick={() => navigate(type.cta.href)}
                  className="mt-2.5 inline-flex items-center gap-1 self-start text-[11.5px] font-bold text-orange-600 transition hover:gap-1.5 hover:text-orange-700"
                >
                  {type.cta.label}
                  <span aria-hidden="true">&rarr;</span>
                </button>
              ) : (
                <a
                  href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent(`Partnership — ${type.title}`)}`}
                  className="mt-2.5 inline-flex items-center gap-1 self-start text-[11.5px] font-bold text-orange-600 transition hover:gap-1.5 hover:text-orange-700"
                >
                  Apply as {type.title.toLowerCase()}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              )}
            </article>
          ))}
        </section>

        {/* How it works + commitments ---------------------------------------- */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="min-w-0" style={{ "--reveal-delay": "80ms" }}>
            <h2 className="text-[15px] font-bold text-gray-950">How it works</h2>
            <p className="mt-1 text-[11.5px] text-gray-500">Three steps, handled by real people.</p>

            <ol className="mt-3.5 space-y-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex min-w-0 gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[11px] font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[12.5px] font-bold text-gray-950">{step.title}</h3>
                    <p className="mt-0.5 break-words text-[12px] leading-[18px] text-gray-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="min-w-0" style={{ "--reveal-delay": "120ms" }}>
            <h2 className="text-[15px] font-bold text-gray-950">What we commit to</h2>
            <ul className="mt-3 space-y-2.5">
              {commitments.map((item) => (
                <li key={item} className="flex min-w-0 gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon type="check" className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 text-[12px] leading-[18px] text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Contact ----------------------------------------------------------- */}
        <section
          style={{ "--reveal-delay": "160ms" }}
          className="reveal-up mt-3 rounded-2xl bg-[#0f172a] p-4 text-white shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold">Ready to talk?</h2>
              <p className="mt-1 text-[11.5px] leading-[17px] text-slate-400">
                Tell us who your audience is and what you want to run. We answer every enquiry, including the noes.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`}
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-orange-700"
              >
                <Icon type="mail" className="h-[16px] w-[16px]" />
                Email us
              </a>
              <a
                href="https://wa.me/256767934191"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10"
              >
                <Icon type="whatsapp" className="h-[16px] w-[16px]" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AffiliatesPage;
