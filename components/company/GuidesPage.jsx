'use client'

import React from "react";
import { useAppContext } from "@/context/AppContext";

// A hub, not a blog: every card leads somewhere that already exists in the app
// rather than to an article we would have to invent. The advice itself matches
// how the marketplace behaves — pay on delivery, per-seller orders, 7-day
// returns, ratings drawn from verified purchases.
const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    cart: "M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
    pay: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    delivery: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    shield: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4",
    star: "M12 4.2 14.4 9l5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 9.8 9.6 9 12 4.2Z",
    track: "M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Zm0 0L12 12m0 0 8.5-4.5M12 12v9",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    store: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    wishlist: "M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7-2.5c0 5-7 9.5-7 9.5Z",
    check: "m5 13 4 4L19 7",
    warn: "M12 4 3 20h18L12 4Zm0 6v5m0 3h.01",
    chevron: "m9 6 6 6-6 6",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const guides = [
  {
    icon: "pay",
    title: "Paying with mobile money",
    body: "Pick Cash, MTN Mobile Money or Airtel Money at checkout. All three are collected when the rider hands your order over — nothing leaves your wallet when you place it. Have the exact amount ready in your MoMo balance so the handover is quick.",
    action: "Payment methods",
    href: "/payment-methods",
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: "delivery",
    title: "Delivery, pickup and fees",
    body: "Delivery is priced by how far the seller is from your area, so a nearby shop costs less to deliver from. Choosing pickup is always free. Most same-city orders arrive within 24 hours; between regions expect two to three days.",
    action: "Delivery terms",
    href: "/legal#terms",
    tone: "text-amber-600 bg-amber-50",
  },
  {
    icon: "returns",
    title: "Returns and refunds",
    body: "You have 7 days from delivery to request a return from the order page. The seller reviews it, and an approved refund goes back through the method you paid with. Keep the packaging until you have checked the item works.",
    action: "Return policy",
    href: "/legal#terms",
    tone: "text-rose-600 bg-rose-50",
  },
  {
    icon: "star",
    title: "Reading ratings before you buy",
    body: "Ratings on a product come from people who bought it, and reviews from a confirmed order carry a verified badge. Read the three- and four-star reviews first — they describe the trade-offs that five-star ones skip.",
    action: "Browse products",
    href: "/all-products",
    tone: "text-orange-600 bg-orange-50",
  },
  {
    icon: "track",
    title: "Tracking an order to your door",
    body: "Every order moves through Placed, Accepted, Processing, Ready, Out for delivery and Delivered. The rider's contact appears once they accept the job, and you confirm receipt yourself once the items are in your hands.",
    action: "My orders",
    href: "/my-orders",
    tone: "text-sky-600 bg-sky-50",
  },
  {
    icon: "grid",
    title: "Finding things faster",
    body: "Search by product, brand or category from the top bar, then narrow with the price, brand, rating and condition filters. Save anything you are undecided on to your wishlist — it follows your account between phone and desktop.",
    action: "All categories",
    href: "/categories",
    tone: "text-violet-600 bg-violet-50",
  },
];

const safetyChecks = [
  {
    ok: true,
    text: "Keep the whole order inside KawilMart — chat, payment and delivery. That is what makes a return or refund enforceable.",
  },
  {
    ok: true,
    text: "Check the seller's rating and how their previous buyers described delivery before ordering something expensive.",
  },
  {
    ok: true,
    text: "Inspect the item before you pay the rider. Payment happens at handover precisely so you can look first.",
  },
  {
    ok: false,
    text: "Never send money to a personal mobile money number, even if the message looks like it came from a seller.",
  },
  {
    ok: false,
    text: "Do not accept a request to move the deal to WhatsApp or cash outside the app for a discount. Off-platform orders are not covered.",
  },
  {
    ok: false,
    text: "We will never call to ask for your password, PIN or a one-time code. Anyone who does is not us — report them.",
  },
];

const Card = ({ className = "", children, style }) => (
  <section style={style} className={`reveal-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${className}`}>
    {children}
  </section>
);

const GuidesPage = () => {
  const { navigate } = useAppContext();

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-12 md:pt-12">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl">
          <h1 className="animate-page-enter text-[26px] font-black leading-tight tracking-tight md:text-[40px]">
            Shopping guides
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-white/85 md:text-[15px]">
            Short, practical guides to buying on KawilMart &mdash; paying, delivery, returns, and how to spot a
            seller worth ordering from.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* Featured -------------------------------------------------------- */}
        <Card className="-mt-5 md:-mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon type="cart" className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-orange-600">Start here</span>
                <h2 className="mt-0.5 text-[15px] font-bold text-gray-950">How shopping on KawilMart works</h2>
                <p className="mt-1 text-[12.5px] leading-[19px] text-gray-600">
                  The whole journey in six steps &mdash; from finding a product to confirming it arrived.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/help/shopping")}
              className="shrink-0 rounded-full bg-orange-600 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-orange-700 active:scale-[0.98]"
            >
              Read the guide
            </button>
          </div>
        </Card>

        {/* Guides ---------------------------------------------------------- */}
        <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {guides.map((guide, index) => (
            <article
              key={guide.title}
              style={{ "--reveal-delay": `${Math.min(index, 5) * 50}ms` }}
              className="reveal-up flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${guide.tone}`}>
                <Icon type={guide.icon} />
              </span>
              <h2 className="mt-3 text-[13.5px] font-bold text-gray-950">{guide.title}</h2>
              <p className="mt-1 flex-1 text-[12.5px] leading-[19px] text-gray-600">{guide.body}</p>
              <button
                type="button"
                onClick={() => navigate(guide.href)}
                className="mt-2.5 inline-flex items-center gap-1 self-start text-[11.5px] font-bold text-orange-600 transition hover:gap-1.5 hover:text-orange-700"
              >
                {guide.action}
                <span aria-hidden="true">&rarr;</span>
              </button>
            </article>
          ))}
        </section>

        {/* Buying safely ---------------------------------------------------- */}
        <Card className="mt-3" style={{ "--reveal-delay": "60ms" }}>
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon type="shield" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-gray-950">Buying safely</h2>
              <p className="mt-1 text-[11.5px] text-gray-500">
                The six habits that keep a marketplace order protected.
              </p>
            </div>
          </div>

          <ul className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {safetyChecks.map((check) => (
              <li key={check.text} className="flex min-w-0 gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    check.ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  <Icon type={check.ok ? "check" : "warn"} className="h-3 w-3" />
                </span>
                <span className="min-w-0 text-[12px] leading-[18px] text-gray-600">{check.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* For sellers ------------------------------------------------------- */}
        <Card className="mt-3" style={{ "--reveal-delay": "100ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                <Icon type="store" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13.5px] font-bold text-gray-950">Selling instead of buying?</h2>
                <p className="mt-0.5 text-[12px] leading-[18px] text-gray-600">
                  Open a store, list your stock and manage orders from your own dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/become-a-vendor")}
              className="shrink-0 rounded-full bg-gray-900 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-gray-800"
            >
              Become a vendor
            </button>
          </div>
        </Card>

        {/* Help fallback ------------------------------------------------------ */}
        <Card className="mt-3" style={{ "--reveal-delay": "140ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-bold text-gray-950">Question not covered here?</h2>
              <p className="mt-0.5 text-[12px] leading-[18px] text-gray-500">
                The Help Center has the full FAQ, or our team can look up your order with you.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => navigate("/help")}
                className="rounded-full bg-gray-100 px-4 py-2.5 text-[12px] font-bold text-gray-700 transition hover:bg-gray-200"
              >
                Help Center
              </button>
              <button
                type="button"
                onClick={() => navigate("/inbox?tab=support")}
                className="rounded-full bg-orange-600 px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-orange-700"
              >
                Chat with us
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default GuidesPage;
