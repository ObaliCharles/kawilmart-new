'use client'
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import axios from 'axios';
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/seller/Footer";
import { SellerProductFormSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { defaultSellerCategory, sellerCategoryGroups } from "@/lib/marketplaceCategories";
import { getOrderStatusBadgeClass, getOrderStatusDisplay, getPaymentStatusBadgeClass } from "@/lib/orderUi";
import { downloadAuthenticatedFile } from "@/lib/clientDownloads";

const MetricCard = ({ icon, label, value, sub, color, valueClassName = '' }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] sm:p-5">
    <div className="flex items-start gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 sm:text-xs">{label}</p>
        <p className={`mt-1 font-semibold leading-tight text-gray-950 ${valueClassName || 'text-lg sm:text-2xl'}`}>
          {value}
        </p>
        {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
      </div>
    </div>
  </div>
);

const invoiceStatusClasses = {
  issued: 'bg-sky-50 text-sky-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
  void: 'bg-slate-100 text-slate-700',
};

const formatDateLabel = (value) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const InlineSellerIcon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    storefront: "M4 10.5 6 5h12l2 5.5M6 10.5h12V19H6v-8.5ZM9 19v-5h6v5M8 5v5m4-5v5m4-5v5",
    camera: "M4.5 8.5h3l1.5-2h6l1.5 2h3A1.5 1.5 0 0 1 20 10v7.5A1.5 1.5 0 0 1 18.5 19h-15A1.5 1.5 0 0 1 2 17.5V10A1.5 1.5 0 0 1 3.5 8.5Zm7.5 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    phone: "M7.5 3.5h9A1.5 1.5 0 0 1 18 5v14a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Zm3 14.5h3",
    truck: "M3.5 7h10v9h-10V7Zm10 3h3l2.5 3V16h-5.5v-6Zm-7.5 8a1.8 1.8 0 1 0 0 .1m11 0a1.8 1.8 0 1 0 0 .1",
    clock: "M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 3.5V12l2.5 1.5",
    shop: "M4 8h16M6 8l1-3h10l1 3M6 8v11h12V8M9 12h6M9 15h4",
    wallet: "M4 7.5h14A1.5 1.5 0 0 1 19.5 9v7A1.5 1.5 0 0 1 18 17.5H6A2.5 2.5 0 0 1 3.5 15V9A1.5 1.5 0 0 1 5 7.5Zm10 4h4",
    package: "M4.5 8.5 12 4l7.5 4.5V15L12 19l-7.5-4V8.5Zm7.5-4v4.5m0 0L4.5 8.5m7.5 0 7.5-4",
    chart: "M5 18V6m0 12h14M8 14v-3m4 3V9m4 5V7",
    invoice: "M7 4h8l3 3v13H7V4Zm2 4h6m-6 4h6m-6 4h4",
    check: "M5 12.5 9.5 17 19 7.5",
    star: "M12 4.5 14.9 9.9 21 10.8l-4.4 4.3 1 6.1L12 18.3 6.4 21.2l1-6.1L3 10.8l6.1-.9L12 4.5Z",
  };

  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[type] || paths.shop} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const applicationSteps = [
  {
    step: "01",
    title: "Prepare your business details",
    text: "Add your shop name, location, contact number, and a short description of what you sell.",
  },
  {
    step: "02",
    title: "Send your application",
    text: "Use the support inbox button to submit your request and include the account email on file.",
  },
  {
    step: "03",
    title: "Wait for review",
    text: "The KawilMart team checks your details, confirms your role, and unlocks seller access when approved.",
  },
  {
    step: "04",
    title: "Start listing products",
    text: "Once access is active, you can upload products, manage orders, and monitor performance from the seller dashboard.",
  },
];

const ApplicationCard = ({ title, value, description, icon }) => (
  <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02] backdrop-blur-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">{title}</p>
        <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const emptyVendorApplication = (user = null) => ({
  fullName: user?.fullName || user?.firstName || user?.username || "",
  email: user?.primaryEmailAddress?.emailAddress || "",
  phoneNumber: user?.primaryPhoneNumber?.phoneNumber || "",
  businessName: "",
  businessLocation: "",
  whatYouSell: "",
  notes: "",
});

const SellerApplicationLanding = ({ user, resolvedRole, refreshAccessState }) => {
  const [application, setApplication] = useState(() => emptyVendorApplication(user));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApplication((prev) => ({
      ...prev,
      ...emptyVendorApplication(user),
      fullName: prev.fullName || user?.fullName || user?.firstName || user?.username || "",
      email: prev.email || user?.primaryEmailAddress?.emailAddress || "",
      phoneNumber: prev.phoneNumber || user?.primaryPhoneNumber?.phoneNumber || "",
    }));
  }, [user]);

  const handleChange = (field, value) => {
    setApplication((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const requiredFields = ["fullName", "email", "businessName", "businessLocation", "whatYouSell"];
    const hasMissingField = requiredFields.some((field) => !String(application[field] || "").trim());
    if (hasMissingField) {
      toast.error("Please fill in all required vendor application fields.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/vendor-applications", application);

      if (data.success) {
        toast.success(data.message || "Application submitted successfully.");
        setApplication((prev) => ({
          ...emptyVendorApplication(user),
          phoneNumber: prev.phoneNumber,
        }));
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),linear-gradient(180deg,#fff8f2_0%,#fffdfb_45%,#f8fafc_100%)]">
      <Navbar />
      <main className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">Sell on KawilMart</p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-gray-950 md:text-5xl lg:text-6xl">
                  Apply to become a vendor and start selling from a polished storefront.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-gray-600 md:text-[1.03rem]">
                  If you are logged in as <span className="font-semibold text-gray-900">{resolvedRole || "buyer"}</span>, this page gives you the full vendor application path, support contacts, and the steps we use to approve new sellers.
                </p>

                <div className="flex flex-wrap gap-3">
                  <a href="#vendor-application-form" className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(234,88,12,0.18)] transition hover:bg-orange-700">
                    Fill application
                  </a>
                  <Link href="/legal#seller-obligations" className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50">
                    View procedures
                  </Link>
                  {refreshAccessState ? (
                    <button
                      type="button"
                      onClick={() => void refreshAccessState()}
                      className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      Re-check access
                    </button>
                  ) : null}
                </div>
              </div>

              <form id="vendor-application-form" onSubmit={handleSubmit} className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">Vendor application</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-gray-950">Tell us about your shop</h2>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">No seller access needed</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    value={application.fullName}
                    onChange={(event) => handleChange("fullName", event.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                  />
                  <input
                    type="email"
                    value={application.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                  />
                  <input
                    type="text"
                    value={application.phoneNumber}
                    onChange={(event) => handleChange("phoneNumber", event.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={application.businessName}
                    onChange={(event) => handleChange("businessName", event.target.value)}
                    placeholder="Business / shop name"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                  />
                  <input
                    type="text"
                    value={application.businessLocation}
                    onChange={(event) => handleChange("businessLocation", event.target.value)}
                    placeholder="Business location"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                  />
                  <textarea
                    value={application.whatYouSell}
                    onChange={(event) => handleChange("whatYouSell", event.target.value)}
                    placeholder="What do you sell?"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 sm:col-span-2 min-h-24 resize-none"
                  />
                  <textarea
                    value={application.notes}
                    onChange={(event) => handleChange("notes", event.target.value)}
                    placeholder="Extra notes, social links, delivery coverage, or anything helpful"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 sm:col-span-2 min-h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 w-full rounded-full bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  We review applications manually and contact you through the email or phone number you provide.
                </p>
              </form>
            </div>
          </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02] backdrop-blur-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">Application procedure</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-gray-950">A simple, guided process</h2>
            <div className="mt-6 space-y-4">
              {applicationSteps.map((item) => (
                <div key={item.step} className="grid gap-4 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4 md:grid-cols-[64px_1fr] md:p-5">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-base font-bold text-white shadow-[0_10px_24px_rgba(234,88,12,0.18)]">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-gray-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-orange-100 bg-[linear-gradient(180deg,#fff7ed_0%,#fffdfa_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">What you can sell</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-950">Store setup tips</h2>
            <p className="text-sm leading-7 text-gray-600">
              Include clear photos, accurate pricing, short product descriptions, and a contact number that can receive order updates. Good listings are approved faster and convert better once the dashboard is active.
            </p>

            <div className="grid gap-3 pt-2">
              <ApplicationCard
                title="Best practice"
                value="Use clean product photos"
                description="Bright, cropped images help your listings look polished and easier to trust."
                icon={<InlineSellerIcon type="camera" className="h-5 w-5" />}
              />
              <ApplicationCard
                title="Best practice"
                value="Keep your contacts reachable"
                description="Use a phone number you can answer quickly so support can verify your application."
                icon={<InlineSellerIcon type="phone" className="h-5 w-5" />}
              />
              <ApplicationCard
                title="Best practice"
                value="Describe delivery clearly"
                description="Tell us whether you prefer pickup, delivery, or both when your account is approved."
                icon={<InlineSellerIcon type="truck" className="h-5 w-5" />}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
};

const SellerOverviewSkeleton = () => (
  <div className="space-y-6" aria-hidden="true">
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-orange-100" />
          <div className="h-9 w-72 max-w-full rounded-2xl bg-gray-100" />
          <div className="h-4 w-96 max-w-full rounded-full bg-gray-100" />
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="h-10 w-32 rounded-full bg-orange-100" />
            <div className="h-10 w-28 rounded-full bg-gray-100" />
            <div className="h-10 w-32 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="h-3 w-20 rounded-full bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
              <div className="h-3 w-24 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-20 rounded-full bg-gray-100" />
            <div className="h-8 w-24 rounded-full bg-gray-100" />
            <div className="h-3 w-28 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="h-52 rounded-2xl bg-gray-100" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-36 rounded-full bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 rounded-full bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="h-52 rounded-2xl bg-gray-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="h-52 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  </div>
);

const AddProductInner = () => {
  const { getToken, router, authReady, user, formatCurrency, formatCompactCurrency, isSeller, resolvedRole, refreshAccessState } = useAppContext();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultSellerCategory);
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [location, setLocation] = useState('');
  const [sellerContact, setSellerContact] = useState('');
  const [sellerLocation, setSellerLocation] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [invoiceDownloadPeriod, setInvoiceDownloadPeriod] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const imagePreviews = useMemo(() => (
    [...Array(4)].map((_, index) => (
      files[index]
        ? URL.createObjectURL(files[index])
        : existingImages[index] || assets.upload_area
    ))
  ), [existingImages, files]);

  const resetForm = () => {
    setFiles([]);
    setExistingImages([]);
    setName('');
    setDescription('');
    setCategory(defaultSellerCategory);
    setPrice('');
    setOfferPrice('');
    setStock('');
    setLocation('');
    setSellerContact('');
    setSellerLocation('');
  };

  const fetchProductDetails = async () => {
    if (!editId) {
      resetForm();
      return;
    }

    try {
      setLoadingProduct(true);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`/api/product/seller-item?productId=${editId}`, { headers });

      if (data.success) {
        const product = data.product;
        setFiles([]);
        setExistingImages(product.image || []);
        setName(product.name || '');
        setDescription(product.description || '');
        setCategory(product.category || defaultSellerCategory);
        setPrice(product.price?.toString() || '');
        setOfferPrice(product.offerPrice?.toString() || '');
        setStock(product.stock?.toString() || '');
        setLocation(product.location || '');
        setSellerContact(product.sellerContact || '');
        setSellerLocation(product.sellerLocation || '');
      } else {
        toast.error(data.message || 'Failed to load product details');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to load product details');
    } finally {
      setLoadingProduct(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoadingDashboard(true);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get('/api/seller/stats', { headers });

      if (data.success) {
        setDashboardStats(data.stats);
      } else {
        setDashboardStats(null);
        toast.error(data.message || 'Failed to load dashboard overview');
      }
    } catch (error) {
      setDashboardStats(null);
      toast.error(error?.response?.data?.message || error.message || 'Failed to load dashboard overview');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (authReady && user) {
      fetchProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, editId]);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }

    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, isEditMode]);

  useEffect(() => {
    const nextPeriod = dashboardStats?.invoicePeriodOptions?.[0] || dashboardStats?.billing?.periodKey || '';
    if (nextPeriod && !invoiceDownloadPeriod) {
      setInvoiceDownloadPeriod(nextPeriod);
    }
  }, [dashboardStats, invoiceDownloadPeriod]);

  const sellerAccess = dashboardStats?.subscription?.access;
  const sellerHasStoreAccess = sellerAccess?.hasAccess ?? true;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!sellerHasStoreAccess) {
      toast.error(sellerAccess?.reason || 'Selling access is currently disabled. Contact support or renew your subscription.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('offerPrice', offerPrice);
    formData.append('stock', stock);
    formData.append('location', location);
    formData.append('sellerContact', sellerContact);
    formData.append('sellerLocation', sellerLocation);

    if (isEditMode) {
      formData.append('productId', editId);
      formData.append('existingImages', JSON.stringify(existingImages));
      for (let i = 0; i < 4; i += 1) {
        if (files[i]) {
          formData.append(`image_${i}`, files[i]);
        }
      }
    } else {
      if (!files.filter(Boolean).length) {
        toast.error('Please upload at least one product image');
        return;
      }

      for (let i = 0; i < files.length; i += 1) {
        if (files[i]) {
          formData.append('images', files[i]);
        }
      }
    }

    try {
      setIsSubmitting(true);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint = isEditMode ? '/api/product/update' : '/api/product/add';
      const { data } = await axios.post(endpoint, formData, { headers });

      if (data.success) {
        toast.success(data.message);
        if (isEditMode) {
          router.push('/seller/product-list');
        } else {
          resetForm();
          fetchDashboardStats();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('seller-product-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInvoiceDownload = async () => {
    if (!invoiceDownloadPeriod || downloadingInvoice) {
      return;
    }

    try {
      setDownloadingInvoice(true);
      const token = await getToken();
      await downloadAuthenticatedFile({
        url: `/api/seller/invoices/download?periodKey=${encodeURIComponent(invoiceDownloadPeriod)}`,
        token,
        fallbackFilename: `kawilmart-seller-invoice-${invoiceDownloadPeriod}.html`,
      });
      toast.success('Invoice download started');
    } catch (error) {
      toast.error(error.message || 'Failed to download seller invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const revenueByDay = dashboardStats?.revenueByDay || [];
  const maxRevenue = Math.max(...revenueByDay.map((day) => day.revenue), 1);
  const categoryEntries = Object.entries(dashboardStats?.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const statusEntries = Object.entries(dashboardStats?.statusCounts || {}).sort((a, b) => b[1] - a[1]);
  const paymentEntries = Object.entries(dashboardStats?.paymentCounts || {}).sort((a, b) => b[1] - a[1]);
  const totalOrders = dashboardStats?.totalOrders || 0;
  const totalProducts = dashboardStats?.totalProducts || 0;
  const invoiceHistory = dashboardStats?.invoices || [];
  const invoicePeriodOptions = dashboardStats?.invoicePeriodOptions || [];
  const invoiceSummary = dashboardStats?.invoiceSummary || {};

  if (!authReady || !user || !isSeller) {
    return (
      <SellerApplicationLanding
        user={user}
        resolvedRole={resolvedRole}
        refreshAccessState={refreshAccessState}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-between">
      <div className="space-y-6 md:p-10 p-4">
        {!isEditMode ? (
          loadingDashboard ? (
            <SellerOverviewSkeleton />
          ) : dashboardStats ? (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-6 text-white shadow-sm md:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">
                      Seller Overview
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                      Welcome back, {user?.firstName || 'Seller'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-orange-50 sm:text-base">
                      Track sales, orders, payments, and product performance from one place, then add new products right below.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => router.push('/seller/orders')}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-50"
                      >
                        Manage Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/seller/product-list')}
                        className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        View Products
                      </button>
                      <button
                        type="button"
                        onClick={scrollToForm}
                        className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Quick Add Product
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]">
                    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                      <p className="text-xs text-orange-100">Delivery Rate</p>
                      <p className="mt-1 text-2xl font-bold tracking-[-0.03em]">{dashboardStats.highlights.deliveryRate}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                      <p className="text-xs text-orange-100">Cancellation Rate</p>
                      <p className="mt-1 text-2xl font-bold tracking-[-0.03em]">{dashboardStats.highlights.cancellationRate}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                      <p className="text-xs text-orange-100">Best Seller</p>
                      <p className="mt-1 text-sm font-semibold leading-snug">
                        {dashboardStats.highlights.bestSellingProduct || 'No sales yet'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                      <p className="text-xs text-orange-100">Latest Product</p>
                      <p className="mt-1 text-sm font-semibold leading-snug">
                        {dashboardStats.highlights.latestProduct || 'Nothing listed yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard
                  icon={<InlineSellerIcon type="wallet" className="h-5 w-5 text-orange-600" />}
                  label="Completed Revenue"
                  value={formatCurrency(dashboardStats.totalRevenue)}
                  sub={`${dashboardStats.completedOrders} completed orders`}
                  color="bg-green-50"
                  valueClassName="text-[15px] break-words sm:text-2xl"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="package" className="h-5 w-5 text-blue-600" />}
                  label="Total Orders"
                  value={dashboardStats.totalOrders.toLocaleString()}
                  sub={`${dashboardStats.activeOrders} active right now`}
                  color="bg-blue-50"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="shop" className="h-5 w-5 text-purple-600" />}
                  label="Products"
                  value={dashboardStats.totalProducts.toLocaleString()}
                  sub={`${categoryEntries.length} categories in your shop`}
                  color="bg-purple-50"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="chart" className="h-5 w-5 text-orange-600" />}
                  label="Avg Order Value"
                  value={formatCurrency(dashboardStats.averageOrderValue)}
                  sub="Average sale size"
                  color="bg-orange-50"
                  valueClassName="text-[15px] break-words sm:text-2xl"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="invoice" className="h-5 w-5 text-cyan-600" />}
                  label="Units Sold"
                  value={dashboardStats.totalUnitsSold.toLocaleString()}
                  sub="Across all orders"
                  color="bg-cyan-50"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="check" className="h-5 w-5 text-emerald-600" />}
                  label="Paid Orders"
                  value={dashboardStats.paidOrders.toLocaleString()}
                  sub={`${dashboardStats.pendingPayments} awaiting payment`}
                  color="bg-emerald-50"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="truck" className="h-5 w-5 text-lime-600" />}
                  label="Commission Due"
                  value={formatCurrency(dashboardStats.billing?.totalDue || 0)}
                  sub={`Invoice ${dashboardStats.billing?.invoiceNumber || 'pending'}`}
                  color="bg-lime-50"
                  valueClassName="text-[15px] break-words sm:text-2xl"
                />
                <MetricCard
                  icon={<InlineSellerIcon type="star" className="h-5 w-5 text-yellow-600" />}
                  label="Subscription"
                  value={dashboardStats.subscription?.status || 'active'}
                  sub={`${formatCurrency(dashboardStats.subscription?.monthlyFee || 0)} monthly`}
                  color="bg-yellow-50"
                />
              </section>

              {!sellerHasStoreAccess ? (
                <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">Selling Access Disabled</p>
                      <h2 className="mt-2 text-lg font-semibold text-gray-900">Your storefront is currently locked</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        {sellerAccess?.reason || 'Your subscription needs admin attention before you can publish or update products again.'}
                      </p>
                    </div>
                    <Link
                      href="/inbox?tab=support"
                      className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
                    >
                      Contact Support
                    </Link>
                  </div>
                </section>
              ) : null}

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="font-semibold text-gray-900">Current Billing Snapshot</h2>
                  <p className="mt-1 text-sm text-gray-500">Monthly subscription plus commission from completed orders only.</p>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Invoice', value: dashboardStats.billing?.invoiceNumber || 'Pending' },
                      { label: 'Completed Orders', value: dashboardStats.billing?.completedOrders || 0 },
                      { label: 'Commission', value: formatCurrency(dashboardStats.billing?.commissionTotal || 0) },
                      { label: 'Total Due', value: formatCurrency(dashboardStats.billing?.totalDue || 0) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
                        <p className="mt-2 font-semibold text-gray-900 break-words">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="font-semibold text-gray-900">Risk Monitor</h2>
                  <p className="mt-1 text-sm text-gray-500">Basic anti-fraud flags from cancelled, failed, and unconfirmed deliveries.</p>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cancelled Orders</span>
                      <span className="font-semibold text-gray-900">{dashboardStats.risk?.cancelledOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Failed Orders</span>
                      <span className="font-semibold text-gray-900">{dashboardStats.risk?.failedOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Unconfirmed Deliveries</span>
                      <span className="font-semibold text-gray-900">{dashboardStats.risk?.disputedDeliveries || 0}</span>
                    </div>
                    <div className="pt-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        dashboardStats.risk?.flagged ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {dashboardStats.risk?.flagged ? 'Monitoring required' : 'Healthy'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">Issued Invoices</h2>
                      <p className="mt-1 text-sm text-gray-500">Month-end billing records for subscription and sales commission.</p>
                    </div>
                    <Link
                      href="/inbox?tab=support"
                      className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
                    >
                      Need billing help?
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {invoiceHistory.length ? invoiceHistory.map((invoice) => (
                      <div key={invoice.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoiceStatusClasses[invoice.status] || invoiceStatusClasses.issued}`}>
                                {invoice.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {invoice.periodLabel} · Due {formatDateLabel(invoice.dueAt)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              Subscription {formatCurrency(invoice.subscriptionFee)} · Commission {formatCurrency(invoice.commissionTotal)} · Orders {invoice.completedOrders}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs uppercase tracking-wide text-gray-400">Total due</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(invoice.totalDue)}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {invoice.paidAt ? `Paid ${formatDateLabel(invoice.paidAt)}` : `Issued ${formatDateLabel(invoice.issuedAt)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                        No issued invoices yet. Your monthly billing records will appear here once KawilMart generates them.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="font-semibold text-gray-900">Invoice Summary</h2>
                  <p className="mt-1 text-sm text-gray-500">Outstanding balances and cleared invoices at a glance.</p>

                  <div className="mt-5 space-y-3">
                    {[
                      { label: 'Outstanding balance', value: formatCurrency(invoiceSummary.outstandingTotal || 0) },
                      { label: 'Paid total', value: formatCurrency(invoiceSummary.paidTotal || 0) },
                      { label: 'Issued invoices', value: invoiceSummary.issuedInvoices || 0 },
                      { label: 'Overdue invoices', value: invoiceSummary.overdueInvoices || 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Download invoice</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Choose a month to export your billing document. If that month has not been officially issued yet, KawilMart downloads a live preview using the same seller billing rules.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={invoiceDownloadPeriod}
                        onChange={(event) => setInvoiceDownloadPeriod(event.target.value)}
                        className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400"
                      >
                        {invoicePeriodOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleInvoiceDownload()}
                        disabled={!invoiceDownloadPeriod || downloadingInvoice}
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          !invoiceDownloadPeriod || downloadingInvoice
                            ? 'cursor-not-allowed bg-white text-gray-400'
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                      >
                        {downloadingInvoice ? 'Preparing...' : 'Download month'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
                      <p className="text-sm text-gray-500">Last 7 days of sales activity</p>
                    </div>
                    <p className="text-sm font-medium text-orange-600">
                      Total: {formatCurrency(dashboardStats.totalRevenue)}
                    </p>
                  </div>
                  <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
                    {revenueByDay.map((day) => (
                      <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                          {day.revenue > 0 ? formatCompactCurrency(day.revenue) : 'UGX 0'}
                        </span>
                        <div className="flex h-36 w-full flex-col justify-end rounded-xl bg-gray-100">
                          <div
                            className="w-full rounded-xl bg-gradient-to-t from-orange-600 to-orange-300 transition-all duration-500"
                            style={{ height: `${Math.max(6, (day.revenue / maxRevenue) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 sm:text-xs">{day.day}</span>
                        <span className="text-[11px] text-gray-300 sm:text-xs">{day.count} orders</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="font-semibold text-gray-900">Order Status</h2>
                    <p className="mt-1 text-sm text-gray-500">How your orders are moving right now</p>
                    <div className="mt-5 space-y-3">
                      {statusEntries.length ? statusEntries.map(([status, count]) => (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(status)}`}>
                              {getOrderStatusDisplay(status)}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${totalOrders ? (count / totalOrders) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-400">No orders yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="font-semibold text-gray-900">Payments & Categories</h2>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment Status</p>
                        {paymentEntries.length ? paymentEntries.map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between gap-3 text-sm">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusBadgeClass(status)}`}>
                              {status}
                            </span>
                            <span className="font-semibold text-gray-700">{count}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400">No payments yet.</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Top Categories</p>
                        {categoryEntries.length ? categoryEntries.slice(0, 4).map(([categoryName, count]) => (
                          <div key={categoryName}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                              <span className="text-gray-600">{categoryName}</span>
                              <span className="font-semibold text-gray-700">{count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-300 to-orange-600"
                                style={{ width: `${totalProducts ? (count / totalProducts) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400">Add products to see category mix.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.15fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">Top Products</h2>
                      <p className="text-sm text-gray-500">Best performers by units sold</p>
                    </div>
                    <Link href="/seller/product-list" className="text-sm font-medium text-orange-600 hover:underline">
                      View all
                    </Link>
                  </div>

                  <div className="mt-5 space-y-4">
                    {dashboardStats.topProducts.length ? dashboardStats.topProducts.map((product) => (
                      <div key={product._id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                          <Image
                            src={product.image || assets.upload_area}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {product.soldCount} sold • {formatCurrency(product.revenue)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-orange-600">
                            {formatCurrency(product.offerPrice)}
                          </p>
                          <Link href={`/product/${product._id}`} className="text-xs text-gray-500 hover:text-orange-600">
                            View
                          </Link>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                        Sales will start appearing here once customers place orders.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                      <p className="text-sm text-gray-500">Latest customer activity in your store</p>
                    </div>
                    <Link href="/seller/orders" className="text-sm font-medium text-orange-600 hover:underline">
                      Manage
                    </Link>
                  </div>

                  <div className="mt-5 space-y-4">
                    {dashboardStats.recentOrders.length ? dashboardStats.recentOrders.map((order) => (
                      <div key={order._id} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Order #{String(order._id).slice(-8).toUpperCase()}
                            </p>
                            <p className="mt-1 font-medium text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500">
                              {order.totalItems} item(s){order.destination ? ` • ${order.destination}` : ''}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                            <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                            {getOrderStatusDisplay(order.status)}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                        Your recent orders will appear here.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">Latest Products</h2>
                    <p className="text-sm text-gray-500">Your newest listings and quick health checks</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-3 py-1">Products: {dashboardStats.totalProducts}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">Likes: {dashboardStats.totalLikes}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">Rating: {dashboardStats.averageRating.toFixed(1)}/5</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {dashboardStats.recentProducts.length ? dashboardStats.recentProducts.map((product) => (
                    <div key={product._id} className="rounded-2xl border border-gray-100 p-3">
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                        <Image
                          src={product.image || assets.upload_area}
                          alt={product.name}
                          width={320}
                          height={240}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-3">
                        <p className="truncate font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="font-semibold text-orange-600">{formatCurrency(product.offerPrice)}</span>
                          <span className="text-gray-400">{new Date(product.date).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                          <span>{product.likesCount} likes</span>
                          <span>{product.averageRating.toFixed(1)} rating</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 md:col-span-2 xl:col-span-4">
                      Start listing products to populate your dashboard overview.
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              Seller overview is unavailable right now.
            </div>
          )
        ) : null}

        {loadingProduct ? (
          <SellerProductFormSkeleton />
        ) : (
          <section id="seller-product-form" className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6 md:p-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? 'Edit Product Details' : 'Quick Add Product'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditMode
                      ? 'Update your product information here. Existing images stay unless you replace them.'
                      : 'Add a new item to your catalog without leaving the seller dashboard.'}
                  </p>
                </div>
                {!isEditMode ? (
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Tip: use clear photos</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">Keep title short and searchable</span>
                  </div>
                ) : null}
              </div>

              {!sellerHasStoreAccess ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {sellerAccess?.reason || 'Selling access is inactive.'} Product publishing and editing are blocked until access is restored.
                </div>
              ) : null}

              <div>
                <p className="text-base font-medium text-gray-900">Product Images</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {[...Array(4)].map((_, index) => (
                    <label key={index} htmlFor={`image${index}`} className="cursor-pointer">
                      <input
                        onChange={(e) => {
                          const updatedFiles = [...files];
                          updatedFiles[index] = e.target.files[0];
                          setFiles(updatedFiles);
                        }}
                        type="file"
                        id={`image${index}`}
                        hidden
                      />
                      <Image
                        src={imagePreviews[index]}
                        alt=""
                        width={100}
                        height={100}
                        className="h-24 w-24 rounded-2xl border border-gray-200 object-cover"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="product-name">
                    Product Name
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    placeholder="Type here"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setCategory(e.target.value)}
                    value={category}
                  >
                    {sellerCategoryGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 lg:col-span-2">
                  <label className="text-base font-medium text-gray-900" htmlFor="product-description">
                    Product Description
                  </label>
                  <textarea
                    id="product-description"
                    rows={4}
                    className="resize-none rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    placeholder="Type here"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="product-price">
                    Product Price
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    placeholder="0"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setPrice(e.target.value)}
                    value={price}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="offer-price">
                    Offer Price
                  </label>
                  <input
                    id="offer-price"
                    type="number"
                    placeholder="0"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setOfferPrice(e.target.value)}
                    value={offerPrice}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="stock">
                    Items Left
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setStock(e.target.value)}
                    value={stock}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="location">
                    Product Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    placeholder="e.g., Kampala, Uganda"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setLocation(e.target.value)}
                    value={location}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-base font-medium text-gray-900" htmlFor="seller-contact">
                    Your Contact Number
                  </label>
                  <input
                    id="seller-contact"
                    type="tel"
                    placeholder="+256 XXX XXX XXX"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setSellerContact(e.target.value)}
                    value={sellerContact}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 lg:col-span-2">
                  <label className="text-base font-medium text-gray-900" htmlFor="seller-location">
                    Your Business Location
                  </label>
                  <input
                    id="seller-location"
                    type="text"
                    placeholder="e.g., Nakasero, Kampala"
                    className="rounded-xl border border-gray-200 px-3 py-3 outline-none transition focus:border-orange-400"
                    onChange={(e) => setSellerLocation(e.target.value)}
                    value={sellerLocation}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !sellerHasStoreAccess}
                  className={`rounded-xl px-8 py-3 text-sm font-medium text-white transition ${
                    isSubmitting || !sellerHasStoreAccess
                      ? 'cursor-not-allowed bg-orange-300'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Product' : 'Add Product')}
                </button>

                {isEditMode ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => router.push('/seller/product-list')}
                    className={`rounded-xl border px-6 py-3 text-sm font-medium transition ${
                      isSubmitting
                        ? 'cursor-not-allowed border-gray-200 text-gray-400'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/seller/product-list')}
                    className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View Product List
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

const AddProduct = () => (
  <Suspense fallback={<SellerProductFormSkeleton />}>
    <AddProductInner />
  </Suspense>
);

export default AddProduct;
