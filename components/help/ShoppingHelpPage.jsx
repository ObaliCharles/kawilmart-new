'use client'

import React from "react";
import { useAppContext } from "@/context/AppContext";

// Every step below describes what the app actually does today — cash and
// mobile money are both collected on delivery, orders split per seller, and
// the return window is the 7 days enforced in lib/orderLifecycle.
const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
    cart: "M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
    address: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    pay: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    track: "M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Zm0 0L12 12m0 0 8.5-4.5M12 12v9",
    confirm: "m5 13 4 4L19 7",
    split: "M6 4v6a4 4 0 0 0 4 4h8m0 0-3-3m3 3-3 3M6 14v6",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    chat: "M20 12a7 7 0 0 1-9.9 6.4L4 20l1.6-6.1A7 7 0 1 1 20 12Z",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const steps = [
  {
    icon: "search",
    title: "Find what you need",
    body: "Search by product, brand or category from the top bar, or browse Categories. Filters let you narrow by price, brand, rating and condition.",
    cta: { label: "Browse products", href: "/all-products" },
  },
  {
    icon: "cart",
    title: "Add it to your cart",
    body: "Pick your options on the product page and tap Add to Cart. Your cart is saved to your account, so it follows you between phone and desktop.",
    cta: { label: "Open cart", href: "/cart" },
  },
  {
    icon: "address",
    title: "Choose delivery or pickup",
    body: "At checkout, pick a saved address and choose Delivery or Pickup. Delivery fees are calculated from how far the seller is from your area, so pickup is always free.",
    cta: { label: "Manage addresses", href: "/address-book" },
  },
  {
    icon: "pay",
    title: "Pay on delivery",
    body: "Choose Cash, MTN Mobile Money or Airtel Money. All three are collected when your order reaches you — nothing is charged when you place it.",
    cta: { label: "Payment methods", href: "/payment-methods" },
  },
  {
    icon: "track",
    title: "Track it to your door",
    body: "Follow your order in My Orders through Placed, Accepted, Processing, Ready, Out for delivery and Delivered. Rider contact appears once they accept the job.",
    cta: { label: "My orders", href: "/my-orders" },
  },
  {
    icon: "confirm",
    title: "Confirm you received it",
    body: "Once the items are in your hands, tap Confirm received. That completes the order and lets you rate the seller.",
    cta: { label: "My orders", href: "/my-orders" },
  },
];

const goodToKnow = [
  {
    icon: "split",
    title: "One cart can become several orders",
    body: "If your cart holds items from different sellers, we split it into one order per seller so each can be prepared and delivered on its own timeline. You still check out once.",
  },
  {
    icon: "clock",
    title: "Delivery timing",
    body: "Most deliveries within a city arrive inside 24 hours. Orders travelling between regions usually take two to three days.",
  },
  {
    icon: "returns",
    title: "You have 7 days to return",
    body: "Request a return from the order page within 7 days of delivery. The seller reviews it, and approved returns are refunded through the way you paid.",
  },
];

const StepCard = ({ step, index, onNavigate }) => (
  <li
    style={{ "--reveal-delay": `${Math.min(index, 5) * 60}ms` }}
    className="reveal-up flex min-w-0 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
  >
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
      <Icon type={step.icon} />
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white">
        {index + 1}
      </span>
    </span>

    <div className="min-w-0 flex-1">
      <h3 className="text-[13.5px] font-bold text-gray-950">{step.title}</h3>
      <p className="mt-1 text-[12.5px] leading-[19px] text-gray-600">{step.body}</p>
      <button
        type="button"
        onClick={() => onNavigate(step.cta.href)}
        className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-orange-600 transition hover:gap-1.5 hover:text-orange-700"
      >
        {step.cta.label}
        <span aria-hidden="true">&rarr;</span>
      </button>
    </div>
  </li>
);

const ShoppingHelpPage = () => {
  const { navigate } = useAppContext();

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-10 md:pt-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="animate-page-enter text-[24px] font-black leading-tight tracking-tight md:text-[34px]">
            Shopping on KawilMart
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-5 text-white/85 md:text-[15px]">
            From finding a product to confirming delivery &mdash; here is exactly how it works.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-3 sm:px-6">
        <ol className="-mt-5 grid grid-cols-1 gap-3 md:-mt-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} onNavigate={navigate} />
          ))}
        </ol>

        <section className="reveal-up mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-[15px] font-bold text-gray-950">Good to know</h2>
          <ul className="mt-3 space-y-3">
            {goodToKnow.map((item) => (
              <li key={item.title} className="flex min-w-0 gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                  <Icon type={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[12.5px] font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-0.5 text-[12px] leading-[18px] text-gray-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="reveal-up mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Icon type="chat" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-bold text-gray-950">Still stuck on something?</h2>
              <p className="mt-0.5 text-[12px] leading-[17px] text-gray-500">
                Our team can look up your order and sort it with you.
              </p>
            </div>
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
        </section>
      </div>
    </main>
  );
};

export default ShoppingHelpPage;
