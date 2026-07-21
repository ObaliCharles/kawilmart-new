'use client'

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { ugandaRegions } from "@/lib/ugandaLocations";

// Lives outside /seller on purpose: middleware.ts redirects any signed-in
// non-seller away from /seller(.*), so the application form that used to sit
// on the seller landing page was unreachable for exactly the people who
// needed it. This route is open to everyone.

const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    store: "M4 9h16l-1 11H5L4 9Zm2-1 1-4h10l1 4M4 9h16",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    box: "M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Zm0 0L12 12m0 0 8.5-4.5M12 12v9",
    check: "m5 13 4 4L19 7",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
    growth: "m4 17 5-5 3 3 7-7m0 0h-4m4 0v4",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const emptyApplication = {
  fullName: "",
  email: "",
  phoneNumber: "",
  businessName: "",
  businessLocation: "",
  whatYouSell: "",
  notes: "",
};

const benefits = [
  { icon: "growth", title: "Reach more buyers", body: "List your products in front of shoppers across Uganda." },
  { icon: "box", title: "Manage your own stock", body: "Add products, set prices, and track orders from one dashboard." },
  { icon: "clock", title: "Get paid per order", body: "Orders are split per seller so your earnings stay clear." },
];

const Field = ({ label, required, hint, children }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
      {label}
      {required ? <span className="ml-1 text-orange-500">*</span> : <span className="ml-1 text-gray-400">(Optional)</span>}
    </label>
    {children}
    {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
  </div>
);

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const BecomeVendorPage = () => {
  const { navigate } = useAppContext();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [application, setApplication] = useState(emptyApplication);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prefill from the signed-in account so the form is mostly done on arrival.
  useEffect(() => {
    if (!user) return;
    setApplication((current) => ({
      ...current,
      fullName: current.fullName || user.fullName || "",
      email: current.email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);

  const isSeller = Boolean(
    user?.publicMetadata?.role === "seller" || user?.publicMetadata?.role === "admin"
  );

  const setField = (field, value) => setApplication((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const required = ["fullName", "email", "businessName", "businessLocation", "whatYouSell"];
    if (required.some((field) => !String(application[field] || "").trim())) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/vendor-applications", application);

      if (data.success) {
        toast.success(data.message || "Application submitted");
        setSubmitted(true);
      } else {
        toast.error(data.message || "Unable to submit your application.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Become a Vendor" showMobilePageSearch={false} />
      <main className="min-h-screen bg-[#f7f8fb] px-3 pb-10 pt-3 sm:px-6 md:pt-6">
        <div className="mx-auto max-w-4xl">
          <header className="mb-4">
            <h1 className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl">Become a Vendor</h1>
            <p className="mt-1 text-[12.5px] leading-5 text-gray-500">
              Tell us about your business and our team will review your application.
            </p>
          </header>

          {isSeller ? (
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon type="check" className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-[15px] font-bold text-gray-950">You already sell on KawilMart</h2>
              <p className="mt-1 text-[12.5px] text-gray-500">Head to your dashboard to manage products and orders.</p>
              <button
                type="button"
                onClick={() => navigate("/seller")}
                className="mt-4 rounded-full bg-orange-600 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700"
              >
                Open seller dashboard
              </button>
            </section>
          ) : submitted ? (
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon type="check" className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-[15px] font-bold text-gray-950">Application received</h2>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-5 text-gray-500">
                Our team will review your details and get back to you by email. You can keep shopping in the meantime.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="rounded-full bg-orange-600 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700"
                >
                  Continue shopping
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/help")}
                  className="rounded-full bg-gray-100 px-5 py-2.5 text-[12.5px] font-bold text-gray-700 transition hover:bg-gray-200"
                >
                  Contact support
                </button>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
              <form onSubmit={handleSubmit} className="space-y-3">
                <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="mb-3.5 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Icon type="user" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-extrabold text-gray-950">Your details</h2>
                      <p className="text-[11.5px] text-gray-500">How we reach you about this application</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full Name" required>
                      <input
                        className={inputClass}
                        placeholder="e.g. John Okello"
                        value={application.fullName}
                        onChange={(event) => setField("fullName", event.target.value)}
                      />
                    </Field>
                    <Field label="Email Address" required>
                      <input
                        type="email"
                        className={inputClass}
                        placeholder="you@example.com"
                        value={application.email}
                        onChange={(event) => setField("email", event.target.value)}
                      />
                    </Field>
                    <Field label="Phone Number">
                      <input
                        className={inputClass}
                        placeholder="+256 7XX XXX XXX"
                        value={application.phoneNumber}
                        onChange={(event) => setField("phoneNumber", event.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="mb-3.5 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Icon type="store" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-extrabold text-gray-950">Your business</h2>
                      <p className="text-[11.5px] text-gray-500">What you sell and where you operate</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Business Name" required>
                      <input
                        className={inputClass}
                        placeholder="e.g. Okello Electronics"
                        value={application.businessName}
                        onChange={(event) => setField("businessName", event.target.value)}
                      />
                    </Field>
                    <Field label="Business Location" required hint="Region or city where you operate">
                      <input
                        className={inputClass}
                        placeholder="e.g. Gulu City, Northern Region"
                        value={application.businessLocation}
                        onChange={(event) => setField("businessLocation", event.target.value)}
                        list="vendor-region-suggestions"
                      />
                      <datalist id="vendor-region-suggestions">
                        {ugandaRegions.map((region) => (
                          <option key={region.value} value={region.label} />
                        ))}
                      </datalist>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="What do you sell?" required>
                        <input
                          className={inputClass}
                          placeholder="e.g. Phones and accessories, fashion, groceries"
                          value={application.whatYouSell}
                          onChange={(event) => setField("whatYouSell", event.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Anything else we should know?">
                        <textarea
                          rows={3}
                          maxLength={500}
                          className={`${inputClass} resize-none`}
                          placeholder="Tell us about your experience, stock size, or delivery setup"
                          value={application.notes}
                          onChange={(event) => setField("notes", event.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {!isLoaded ? null : !user ? (
                  <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-[12px] leading-5 text-amber-800 ring-1 ring-amber-100">
                    You can submit without an account, but{" "}
                    <button type="button" onClick={() => openSignIn()} className="font-bold underline">signing in</button>{" "}
                    lets us link the application to your profile and speeds up approval.
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-xl bg-white px-5 py-2.5 text-[12.5px] font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-orange-600 px-6 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>

              <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-6">
                <h2 className="text-[14px] font-extrabold text-gray-950">Why sell with us</h2>
                <ul className="mt-3 space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit.title} className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Icon type={benefit.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold text-gray-950">{benefit.title}</span>
                        <span className="mt-0.5 block text-[11.5px] leading-[16px] text-gray-500">{benefit.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-gray-100 pt-3 text-[11.5px] leading-[16px] text-gray-500">
                  Applications are reviewed manually. We will email you once a decision is made.
                </p>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BecomeVendorPage;
