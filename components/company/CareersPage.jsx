'use client'

import React from "react";
import { useAppContext } from "@/context/AppContext";

// Nothing on this page is aspirational fiction: the teams listed are the ones
// the product actually needs to run (catalogue, delivery, seller onboarding,
// support), and applications go to the same inbox the Help Center publishes.
const CAREERS_EMAIL = "support@kawilmart.ug";

const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    code: "m8 8-4 4 4 4m8-8 4 4-4 4M14 5l-4 14",
    delivery: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    seller: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    support: "M4 13a8 8 0 0 1 16 0m0 0v3a2 2 0 0 1-2 2h-1v-5h3ZM4 13v5h3v-5H4Z",
    growth: "m4 17 5-5 3 3 7-7m0 0h-4m4 0v4",
    design: "M12 3 3 8v8l9 5 9-5V8l-9-5Zm0 0v18M3 8l9 5 9-5",
    mail: "M3.5 6.5h17v11h-17v-11Zm0 0 8.5 6.5 8.5-6.5",
    phone: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    check: "m5 13 4 4L19 7",
    heart: "M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7-2.5c0 5-7 9.5-7 9.5Z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
    users: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0m2.5-14.6a3.5 3.5 0 0 1 0 6.8M18 20a6 6 0 0 0-2-4.5",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const values = [
  {
    icon: "users",
    title: "Small team, wide scope",
    body: "Everyone here touches the real product. You will not spend a quarter waiting for someone else's approval to ship the thing you were hired to build.",
  },
  {
    icon: "heart",
    title: "Built for Uganda first",
    body: "Mobile money, cash on delivery, patchy data, upcountry addresses. We design for how people here actually buy, not for a template borrowed from elsewhere.",
  },
  {
    icon: "clock",
    title: "Ship, then improve",
    body: "We would rather put something useful in front of sellers this week and fix it with their feedback than polish it privately for a month.",
  },
];

// These are the functions the marketplace needs staffed, not a list of live
// vacancies — so the page says so plainly instead of implying open headcount.
const teams = [
  {
    icon: "code",
    title: "Engineering",
    body: "Next.js and MongoDB across the storefront, seller dashboard and order pipeline. Strong bias toward people who care how the app feels on a mid-range Android phone.",
    tags: ["Next.js", "React", "MongoDB", "Node"],
  },
  {
    icon: "seller",
    title: "Seller onboarding",
    body: "Meeting shop owners, getting their stock listed properly, and teaching them the dashboard. Half relationship work, half getting product data clean.",
    tags: ["Field work", "Training", "Kampala"],
  },
  {
    icon: "delivery",
    title: "Operations & delivery",
    body: "Coordinating riders, chasing late orders, and keeping the promise we make at checkout. This is the team that makes the timeline on the order page true.",
    tags: ["Logistics", "Dispatch", "Riders"],
  },
  {
    icon: "support",
    title: "Customer support",
    body: "Live chat, calls and WhatsApp. Resolving payment, delivery and return issues for buyers and sellers, and feeding the recurring ones back to the product team.",
    tags: ["Chat", "Calls", "Returns"],
  },
  {
    icon: "growth",
    title: "Marketing & growth",
    body: "Campaigns, social, and the content that gets a first-time shopper to trust an order. Comfortable working with numbers, not just posts.",
    tags: ["Social", "Content", "Campaigns"],
  },
  {
    icon: "design",
    title: "Design",
    body: "Product and brand design for a marketplace that has to stay legible on a small screen. Interested in commerce UX and in doing more with less.",
    tags: ["Product design", "Mobile-first", "Brand"],
  },
];

const applicationSteps = [
  {
    title: "Send your application",
    body: `Email ${CAREERS_EMAIL} with "Careers" and the team you are interested in as the subject line.`,
  },
  {
    title: "Tell us what you have done",
    body: "A CV or a link is enough. What we read closest is a short note on something you built, sold, fixed or ran — and what it changed.",
  },
  {
    title: "A conversation",
    body: "If it looks like a fit we reply within about a week to set up a call. If it is not a fit right now we keep the application on file rather than deleting it.",
  },
];

const otherPaths = [
  {
    title: "Sell on KawilMart",
    body: "Have stock or a shop already? Open a store and sell to buyers across the country.",
    action: "Become a vendor",
    href: "/become-a-vendor",
  },
  {
    title: "Partner with us",
    body: "Creators, communities and businesses who want to work with us commercially.",
    action: "See partnerships",
    href: "/affiliates",
  },
  {
    title: "Get to know us first",
    body: "What KawilMart is, who it is for, and how the marketplace works.",
    action: "About KawilMart",
    href: "/about",
  },
];

const CareersPage = () => {
  const { navigate } = useAppContext();

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-12 md:pt-12">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl">
          <h1 className="animate-page-enter text-[26px] font-black leading-tight tracking-tight md:text-[40px]">
            Help build Uganda&apos;s marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-white/85 md:text-[15px]">
            KawilMart connects local sellers with buyers across the country &mdash; everyday essentials, paid for the
            way people here actually pay. If that is work you want to do, we would like to hear from you.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("Careers — application")}`}
              className="rounded-full bg-white px-5 py-2.5 text-[12.5px] font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Send an application
            </a>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-white/20"
            >
              About KawilMart
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* How we work ---------------------------------------------------- */}
        <section className="-mt-5 grid grid-cols-1 gap-3 md:-mt-7 md:grid-cols-3">
          {values.map((value, index) => (
            <article
              key={value.title}
              style={{ "--reveal-delay": `${index * 60}ms` }}
              className="reveal-up min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon type={value.icon} />
              </span>
              <h2 className="mt-3 text-[13.5px] font-bold text-gray-950">{value.title}</h2>
              <p className="mt-1 text-[12.5px] leading-[19px] text-gray-600">{value.body}</p>
            </article>
          ))}
        </section>

        {/* Teams ----------------------------------------------------------- */}
        <section className="reveal-up mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[15px] font-bold text-gray-950">Where we hire</h2>
            <p className="text-[11.5px] text-gray-500">
              Roles open as the marketplace grows &mdash; applications stay on file.
            </p>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {teams.map((team) => (
              <article
                key={team.title}
                className="flex min-w-0 gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 transition hover:border-orange-200 hover:bg-orange-50/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                  <Icon type={team.icon} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-bold text-gray-950">{team.title}</h3>
                  <p className="mt-1 text-[12px] leading-[18px] text-gray-600">{team.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {team.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-gray-600 ring-1 ring-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Careers — ${team.title}`)}`}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-orange-600 transition hover:gap-1.5 hover:text-orange-700"
                  >
                    Apply for {team.title.toLowerCase()}
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How to apply ---------------------------------------------------- */}
        <section className="reveal-up mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-[15px] font-bold text-gray-950">How to apply</h2>
            <p className="mt-1 text-[11.5px] text-gray-500">
              There is no form to fill in. One email is the whole process.
            </p>

            <ol className="mt-3.5 space-y-3">
              {applicationSteps.map((step, index) => (
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
          </div>

          <div className="min-w-0 rounded-2xl bg-[#0f172a] p-4 text-white shadow-sm">
            <h2 className="text-[15px] font-bold">Reach the team</h2>
            <p className="mt-1 text-[11.5px] leading-[17px] text-slate-400">
              The same people who run seller and buyer support read this inbox.
            </p>

            <div className="mt-3.5 space-y-2">
              <a
                href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("Careers — application")}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-orange-400/40 hover:bg-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
                  <Icon type="mail" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">Email us</span>
                  <span className="block break-all text-[11px] text-slate-400">{CAREERS_EMAIL}</span>
                </span>
              </a>

              <a
                href="tel:+256767934191"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-orange-400/40 hover:bg-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                  <Icon type="phone" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">Call us</span>
                  <span className="block text-[11px] text-slate-400">0767 934 191 &middot; 8AM &ndash; 10PM</span>
                </span>
              </a>
            </div>

            <p className="mt-3 flex gap-2 text-[11px] leading-[17px] text-slate-400">
              <span className="mt-0.5 shrink-0 text-emerald-400"><Icon type="check" className="h-3.5 w-3.5" /></span>
              We never charge anyone to apply, interview or start work here. If someone asks you for money in our
              name, it is not us &mdash; please report it to the address above.
            </p>
          </div>
        </section>

        {/* Other ways in ---------------------------------------------------- */}
        <section className="reveal-up mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-[15px] font-bold text-gray-950">Not looking for a job?</h2>
          <p className="mt-1 text-[11.5px] text-gray-500">There is more than one way to work with KawilMart.</p>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {otherPaths.map((path) => (
              <button
                key={path.title}
                type="button"
                onClick={() => navigate(path.href)}
                className="interactive-lift flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <span className="text-[12.5px] font-bold text-gray-950">{path.title}</span>
                <span className="mt-1 flex-1 text-[11.5px] leading-[17px] text-gray-600">{path.body}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-orange-600">
                  {path.action}
                  <span aria-hidden="true">&rarr;</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default CareersPage;
