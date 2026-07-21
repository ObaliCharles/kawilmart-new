'use client'

import React, { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";

// Line icons drawn at a single 1.7 stroke weight so the whole page reads as one
// icon set rather than a pile of mismatched glyphs.
const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    track: "M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Zm0 0L12 12m0 0 8.5-4.5M12 12v9",
    payments: "M3 7.5h18v9H3v-9Zm0 3.5h18M6.5 14h3",
    deliveries: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    shopping: "M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
    chat: "M20 12a7 7 0 0 1-9.9 6.4L4 20l1.6-6.1A7 7 0 1 1 20 12Z",
    returns: "M4 9h11a4.5 4.5 0 0 1 0 9h-4M4 9l3.5-3.5M4 9l3.5 3.5",
    seller: "M4 9h16l-1 10H5L4 9Zm3 0V7a5 5 0 0 1 10 0v2",
    phone: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    whatsapp: "M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.3A8 8 0 1 1 20 12Zm-11-3.2c1 3.6 2.6 5.2 6.2 6.2l1-1.4 2 .9v1.3c-3.9.5-7.5-3.1-8-7h1.4l.9 2-1.5 1",
    mail: "M3.5 6.5h17v11h-17v-11Zm0 0 8.5 6.5 8.5-6.5",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
    chevron: "m9 6 6 6-6 6",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const QUICK_ACTIONS = [
  { key: "track", label: "Track Order", hint: "Track your order in real time", icon: "track", href: "/my-orders", tone: "text-orange-600 bg-orange-50" },
  { key: "payments", label: "Payments", hint: "Payment methods & mobile money", icon: "payments", href: "/payment-methods", tone: "text-emerald-600 bg-emerald-50" },
  { key: "deliveries", label: "Deliveries", hint: "Shipping info & delivery times", icon: "deliveries", href: "/legal#terms", tone: "text-amber-600 bg-amber-50" },
  // `clerk` opens the real Clerk account modal rather than routing anywhere.
  { key: "account", label: "Account", hint: "Manage your account & security", icon: "account", href: "clerk", tone: "text-sky-600 bg-sky-50" },
  { key: "shopping", label: "Shopping Help", hint: "Placing orders, carts, checkout", icon: "shopping", href: "/help/shopping", tone: "text-rose-600 bg-rose-50" },
  { key: "chat", label: "Live Chat", hint: "Chat with our support team", icon: "chat", href: "/inbox?tab=support", tone: "text-violet-600 bg-violet-50" },
];

const HELP_TOPICS = [
  { label: "Orders & Shipping", hint: "Track orders, shipping, delivery options", icon: "track", href: "/my-orders" },
  { label: "Payments & Refunds", hint: "Payment methods, failed payments, refunds", icon: "payments", href: "/payment-methods" },
  { label: "Account & Security", hint: "Manage account, passwords, security", icon: "account", href: "clerk" },
  { label: "Shopping & Checkout", hint: "Placing orders, carts, checkout", icon: "shopping", href: "/help/shopping" },
  { label: "Returns & Refunds", hint: "Return process, eligibility & timeline", icon: "returns", href: "/legal#terms" },
  { label: "Seller Support", hint: "For sellers and store owners", icon: "seller", href: "/seller" },
  { label: "Delivery Support", hint: "Delivery issues and complaints", icon: "deliveries", href: "/inbox?tab=support" },
];

const FAQS = [
  {
    question: "How do I track my order?",
    answer: "Open My Orders from your account menu. Every order shows a live status timeline from Placed through to Delivered, plus the rider's details once they accept the job.",
  },
  {
    question: "How do I pay with MTN Mobile Money?",
    answer: "Choose MTN Mobile Money at checkout. Payment is collected on delivery, so have the amount ready in your MoMo wallet when the rider arrives.",
  },
  {
    question: "How do I pay with Airtel Money?",
    answer: "Select Airtel Money at checkout. Like MTN, it is settled on delivery — the rider confirms payment before handing your items over.",
  },
  {
    question: "How long does delivery take?",
    answer: "Most Kampala deliveries arrive within 24 hours. Upcountry orders typically take two to three days depending on the seller's location and your district.",
  },
  {
    question: "How do I request a refund?",
    answer: "You can request a return within 7 days of delivery from the order's detail page. Once the seller approves it, your refund is processed back through the method you paid with.",
  },
  {
    question: "How can I change or cancel my order?",
    answer: "Orders can be cancelled while they are still marked Placed. After a seller accepts and starts preparing it, message them through the order page to arrange a change.",
  },
];

const CONTACT_CHANNELS = [
  { key: "chat", label: "Live Chat", detail: "Average reply: < 1 min", action: "Start Chat", icon: "chat", href: "/inbox?tab=support", tone: "text-orange-600 bg-orange-50" },
  { key: "phone", label: "Call Us", detail: "Mon – Sun (8AM – 10PM)", action: "0767 934 191", icon: "phone", href: "tel:+256767934191", tone: "text-emerald-600 bg-emerald-50" },
  { key: "whatsapp", label: "WhatsApp", detail: "Chat with us on WhatsApp", action: "0767 934 191", icon: "whatsapp", href: "https://wa.me/256767934191", tone: "text-green-600 bg-green-50" },
  { key: "mail", label: "Email Us", detail: "We reply within 24 hours", action: "support@kawilmart.ug", icon: "mail", href: "mailto:support@kawilmart.ug", tone: "text-sky-600 bg-sky-50" },
];

const SectionHeading = ({ title, action, onAction }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="text-[15px] font-bold text-gray-950">{title}</h2>
    {action ? (
      <button type="button" onClick={onAction} className="shrink-0 text-[11.5px] font-semibold text-orange-600 transition hover:text-orange-700">
        {action}
      </button>
    ) : null}
  </div>
);

const Card = ({ className = "", children, style }) => (
  <section style={style} className={`reveal-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${className}`}>
    {children}
  </section>
);

const FaqItem = ({ faq, open, onToggle }) => (
  <div className="border-b border-gray-100 last:border-b-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-3 py-3 text-left"
    >
      <span className="text-[12.5px] font-medium text-gray-800">{faq.question}</span>
      <svg
        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    {/* Grid-rows trick animates to the answer's natural height without
        hardcoding a max-height that would clip longer answers. */}
    <div className={`grid transition-all duration-300 ease-snappy ${open ? "grid-rows-[1fr] pb-3.5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        <p className="pr-7 text-[12px] leading-[19px] text-gray-600">{faq.answer}</p>
      </div>
    </div>
  </div>
);

const HelpCenterPage = () => {
  const { navigate } = useAppContext();
  const { openUserProfile, openSignIn } = useClerk();
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return FAQS;
    return FAQS.filter((faq) =>
      faq.question.toLowerCase().includes(normalizedQuery) || faq.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredTopics = useMemo(() => {
    if (!normalizedQuery) return HELP_TOPICS;
    return HELP_TOPICS.filter((topic) =>
      topic.label.toLowerCase().includes(normalizedQuery) || topic.hint.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const visibleFaqs = showAllFaqs || normalizedQuery ? filteredFaqs : filteredFaqs.slice(0, 6);
  const isSearching = Boolean(normalizedQuery);
  const hasNoResults = isSearching && filteredFaqs.length === 0 && filteredTopics.length === 0;

  const goToOrder = (event) => {
    event.preventDefault();
    navigate(orderNumber.trim() ? `/my-orders?q=${encodeURIComponent(orderNumber.trim())}` : "/my-orders");
  };

  // "clerk" is a sentinel rather than a route: account details live in Clerk's
  // own profile modal, so there is nothing of ours to navigate to.
  const openTarget = (href) => {
    if (href === "clerk") {
      if (user) openUserProfile?.();
      else openSignIn?.();
      return;
    }
    navigate(href);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (!normalizedQuery) return;

    if (filteredFaqs.length > 0) {
      setOpenFaq(filteredFaqs[0].question);
      return;
    }

    if (filteredTopics.length > 0) {
      openTarget(filteredTopics[0].href);
      return;
    }

    // Nothing in the help content matched — the shopper is most likely
    // looking for a product, so hand the query to the catalogue search.
    navigate(`/all-products?search=${encodeURIComponent(query.trim())}`);
  };

  const openChannel = (href) => {
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }
    window.open(href, href.startsWith("http") ? "_blank" : "_self");
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-4 pb-8 pt-7 text-white sm:px-6 md:pb-12 md:pt-12">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="animate-page-enter text-[26px] font-black leading-tight tracking-tight md:text-[40px]">
            How can we help you today?
          </h1>
          <p className="mt-2 text-[12.5px] text-white/85 md:text-[15px]">
            Find answers, track orders and get the support you need.
          </p>

          {/* The list below filters as you type. Submitting jumps to the first
              matching topic, and falls back to a product search when nothing in
              the help content matches — so the button is never a dead end. */}
          <form
            onSubmit={submitSearch}
            className="mx-auto mt-5 flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg shadow-orange-900/10"
          >
            <span className="pl-2.5 text-gray-400">
              <Icon type="search" className="h-[18px] w-[18px]" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for help articles, orders, payments…"
              aria-label="Search help articles"
              className="min-w-0 flex-1 bg-transparent py-2 text-[12.5px] text-gray-900 outline-none placeholder:text-gray-400 md:text-[13.5px]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 rounded-full px-2 text-[18px] leading-none text-gray-400 transition hover:text-gray-600"
              >
                &times;
              </button>
            ) : null}
            <button
              type="submit"
              className="hidden shrink-0 rounded-full bg-orange-600 px-5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700 sm:block"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        {/* Quick actions -------------------------------------------------- */}
        <section className="-mt-5 grid grid-cols-3 gap-2 md:-mt-7 md:grid-cols-6 md:gap-3">
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={action.key}
              type="button"
              onClick={() => openTarget(action.href)}
              style={{ "--reveal-delay": `${index * 40}ms` }}
              className="reveal-up interactive-lift flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 text-center shadow-sm ring-1 ring-gray-100 transition hover:ring-orange-200 md:px-3 md:py-4"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}>
                <Icon type={action.icon} />
              </span>
              <span className="text-[11px] font-bold leading-tight text-gray-900 md:text-[12px]">{action.label}</span>
            </button>
          ))}
        </section>

        {hasNoResults ? (
          <Card className="mt-4 text-center">
            <p className="text-[13px] font-semibold text-gray-800">No results for &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-[12px] text-gray-500">
              Nothing in our help articles matched. It might be a product &mdash; try the shop, or reach our team below.
            </p>
            <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(`/all-products?search=${encodeURIComponent(query.trim())}`)}
                className="rounded-full bg-orange-600 px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-orange-700"
              >
                Search products for &ldquo;{query.trim()}&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full bg-gray-100 px-5 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Clear search
              </button>
            </div>
          </Card>
        ) : null}

        {/* Topics + order tracking + FAQ ----------------------------------- */}
        {/* grid-cols-1 matters: without an explicit track the implicit column
            is auto-sized, so a wide child stretches the grid past the viewport
            instead of being constrained by it. */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-4">
          {filteredTopics.length > 0 ? (
            <Card className="min-w-0">
              <SectionHeading title="Popular Help Topics" />
              <div className="-mx-1">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => openTarget(topic.href)}
                    className="group flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition hover:bg-orange-50/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition group-hover:bg-white group-hover:text-orange-600">
                      <Icon type={topic.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-gray-900">{topic.label}</span>
                      <span className="block truncate text-[11px] text-gray-500">{topic.hint}</span>
                    </span>
                    <span className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500">
                      <Icon type="chevron" className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="min-w-0 space-y-3">
            <Card style={{ "--reveal-delay": "60ms" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-bold text-gray-950">Track Your Order</h2>
                  <p className="mt-1 text-[11.5px] text-gray-500">Enter your order number to get instant updates.</p>
                  <form onSubmit={goToOrder} className="mt-3 space-y-2">
                    <label htmlFor="help-order-number" className="sr-only">Order number</label>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 ring-1 ring-gray-200 focus-within:ring-orange-400">
                      <span className="text-gray-400"><Icon type="track" className="h-[17px] w-[17px]" /></span>
                      <input
                        id="help-order-number"
                        value={orderNumber}
                        onChange={(event) => setOrderNumber(event.target.value)}
                        placeholder="Enter order number"
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-[12px] outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-orange-600 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700 active:scale-[0.99]"
                    >
                      Track Order
                    </button>
                  </form>
                </div>

                <span className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 sm:flex">
                  <Icon type="deliveries" className="h-10 w-10" />
                </span>
              </div>
            </Card>

            {filteredFaqs.length > 0 ? (
              <Card style={{ "--reveal-delay": "120ms" }}>
                <SectionHeading
                  title="Frequently Asked Questions"
                  action={!isSearching && filteredFaqs.length > 6 ? (showAllFaqs ? "Show less" : "View All") : null}
                  onAction={() => setShowAllFaqs((current) => !current)}
                />
                <div>
                  {visibleFaqs.map((faq) => (
                    <FaqItem
                      key={faq.question}
                      faq={faq}
                      open={openFaq === faq.question}
                      onToggle={() => setOpenFaq((current) => (current === faq.question ? null : faq.question))}
                    />
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Contact --------------------------------------------------------- */}
        <Card className="mt-3" style={{ "--reveal-delay": "80ms" }}>
          <h2 className="text-[15px] font-bold text-gray-950">Still Need Help?</h2>
          <p className="mt-1 text-[11.5px] text-gray-500">Our support team is here to assist you with anything you need.</p>

          <div className="mt-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {CONTACT_CHANNELS.map((channel) => (
              <button
                key={channel.key}
                type="button"
                onClick={() => openChannel(channel.href)}
                className="interactive-lift flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-4 text-center transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${channel.tone}`}>
                  <Icon type={channel.icon} />
                </span>
                <span className="text-[12px] font-bold text-gray-900">{channel.label}</span>
                <span className="text-[10.5px] leading-tight text-gray-500">{channel.detail}</span>
                <span className="mt-0.5 break-all text-[10.5px] font-semibold text-orange-600">{channel.action}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Support thread -------------------------------------------------- */}
        <Card className="mt-3" style={{ "--reveal-delay": "140ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-gray-950">Your Support Conversation</h2>
              <p className="mt-1 text-[11.5px] leading-[17px] text-gray-500">
                Messages with our team live in your inbox — open it to continue where you left off or start a new request.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/inbox?tab=support")}
              className="shrink-0 rounded-full bg-orange-600 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-orange-700 active:scale-[0.98]"
            >
              Open support inbox
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default HelpCenterPage;
