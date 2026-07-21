'use client'
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { PAYMENT_METHODS } from "@/lib/orderLifecycle";
import toast from "react-hot-toast";

// Same key components/OrderSummary.jsx reads on checkout, so a choice made here
// is genuinely the one preselected at checkout rather than a cosmetic setting.
const PAYMENT_METHOD_SAVE_KEY = "kw_checkout_payment_method";

const MtnMark = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFCC00]">
    <span className="text-[10px] font-black leading-none text-black">MTN</span>
  </span>
);

const AirtelMark = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E40000]">
    <span className="text-[9px] font-black lowercase leading-none text-white">airtel</span>
  </span>
);

const CashMark = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  </span>
);

const PAYMENT_OPTIONS = [
  {
    value: PAYMENT_METHODS.COD,
    label: "Cash on Delivery",
    description: "Pay the rider in cash when your order arrives.",
    mark: <CashMark />,
  },
  {
    value: PAYMENT_METHODS.MTN_MOMO,
    label: "MTN Mobile Money",
    description: "Pay from your MTN MoMo wallet.",
    mark: <MtnMark />,
  },
  {
    value: PAYMENT_METHODS.AIRTEL_MONEY,
    label: "Airtel Money",
    description: "Pay from your Airtel Money wallet.",
    mark: <AirtelMark />,
  },
];

const CheckIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PaymentMethodsPage = () => {
  const { navigate } = useAppContext();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [preferredMethod, setPreferredMethod] = useState(PAYMENT_METHODS.COD);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PAYMENT_METHOD_SAVE_KEY);
      if (saved && Object.values(PAYMENT_METHODS).includes(saved)) {
        setPreferredMethod(saved);
      }
    } catch {
      // Storage unavailable — the default stands.
    }
  }, []);

  const choose = (method) => {
    setPreferredMethod(method);
    try {
      window.localStorage.setItem(PAYMENT_METHOD_SAVE_KEY, method);
      toast.success("Preferred payment method saved");
    } catch {
      toast.error("Could not save your preference on this device");
    }
  };

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Payment Methods" showMobilePageSearch={false} />
      <main className="mx-auto min-h-screen max-w-3xl px-3 pb-10 pt-3 sm:px-6 md:py-6">
        <header className="mb-4 hidden md:block">
          <h1 className="text-lg font-bold text-gray-950">Payment Methods</h1>
          <p className="text-xs text-gray-500">Choose how you would like to pay for your orders.</p>
        </header>

        {!isLoaded ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[4.5rem] animate-pulse rounded-xl bg-white ring-1 ring-gray-100" />
            ))}
          </div>
        ) : !user ? (
          <div className="rounded-xl bg-white px-5 py-14 text-center ring-1 ring-gray-100">
            <p className="text-sm font-medium text-gray-700">Sign in to manage payment methods</p>
            <p className="mt-1 text-xs text-gray-500">Your preference is applied automatically at checkout.</p>
            <button type="button" onClick={() => openSignIn()} className="mt-4 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700">
              Sign in
            </button>
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Preferred method
              </h2>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const active = preferredMethod === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(option.value)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left transition-all duration-150 active:scale-[0.99] ${
                        active
                          ? "ring-2 ring-orange-500"
                          : "ring-1 ring-gray-100 hover:ring-gray-200"
                      }`}
                    >
                      <span className="shrink-0">{option.mark}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-gray-950">{option.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-[15px] text-gray-500">{option.description}</span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                          active ? "bg-orange-600 text-white" : "border border-gray-300 text-transparent"
                        }`}
                      >
                        <CheckIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-5 rounded-xl bg-white p-4 ring-1 ring-gray-100">
              <h2 className="text-[13px] font-bold text-gray-950">How payment works</h2>
              <ul className="mt-2.5 space-y-2.5">
                {[
                  "Your preferred method is preselected at checkout — you can still switch it per order.",
                  "Mobile money is collected on delivery. Have the amount ready on your phone when the rider arrives.",
                  "You only pay once your order is in your hands. Nothing is charged when you place it.",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      <CheckIcon />
                    </span>
                    <span className="text-[12px] leading-[17px] text-gray-600">{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/add-address")}
                className="flex flex-1 items-center justify-between gap-2 rounded-xl bg-white p-3.5 text-left ring-1 ring-gray-100 transition hover:ring-gray-200"
              >
                <span>
                  <span className="block text-[12.5px] font-bold text-gray-950">Delivery address</span>
                  <span className="text-[11px] text-gray-500">Where riders collect payment</span>
                </span>
                <span className="text-gray-400">›</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-orders")}
                className="flex flex-1 items-center justify-between gap-2 rounded-xl bg-white p-3.5 text-left ring-1 ring-gray-100 transition hover:ring-gray-200"
              >
                <span>
                  <span className="block text-[12.5px] font-bold text-gray-950">Payment history</span>
                  <span className="text-[11px] text-gray-500">See what you paid per order</span>
                </span>
                <span className="text-gray-400">›</span>
              </button>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default PaymentMethodsPage;
