"use client";

import { useEffect, useMemo, useState } from "react";

const legalTabs = [
  {
    key: "overview",
    label: "Overview",
    eyebrow: "KawilMart Legal Center",
    title: "A cleaner way to understand how KawilMart works, what we expect, and how we protect people on the platform.",
    intro:
      "This legal center is organized like a product guide instead of a wall of text. It explains KawilMart's current marketplace setup across buyers, sellers, riders, orders, support, and privacy.",
    cta: {
      href: "/inbox?tab=support",
      label: "Open Support Inbox",
      description: "Need help with an order, account, seller, or rider issue?",
    },
    sections: [
      {
        id: "overview",
        label: "Introduction",
        title: "Introduction",
        paragraphs: [
          "KawilMart is a marketplace platform built for Northern Uganda. We help shoppers discover products from local sellers, place orders, choose delivery or pickup, and track order progress in one place.",
          "This legal center is written to match the app as it exists today, including cash on delivery, seller-specific order splitting, rider assignment, support inbox messaging, and role-based dashboards.",
        ],
      },
      {
        id: "marketplace-model",
        label: "Marketplace model",
        title: "How the platform operates",
        rows: [
          ["Payment flow", "KawilMart currently uses cash on delivery as the active checkout model."],
          ["Fulfillment", "Customers can choose delivery or pickup depending on the order setup."],
          ["Order structure", "A single cart may become multiple seller-specific orders if products belong to different sellers."],
          ["Support flow", "Users can reach KawilMart through the in-app support inbox, email, or phone."],
        ],
      },
      {
        id: "platform-roles",
        label: "Platform roles",
        title: "Who does what on KawilMart",
        rows: [
          ["Buyers", "Browse products, save addresses, place orders, confirm deliveries, and review sellers after eligible orders."],
          ["Sellers", "List products, maintain stock, accept and prepare orders, and manage store activity inside the seller dashboard."],
          ["Riders", "Accept or decline delivery assignments, update delivery progress, and manage availability in the rider dashboard."],
          ["Admins & support", "Review marketplace safety, manage disputes, adjust access, and keep the platform operating smoothly."],
        ],
      },
      {
        id: "policy-updates",
        label: "Policy updates",
        title: "How updates are handled",
        paragraphs: [
          "As KawilMart grows, these policies may be updated to reflect new features, stronger safety controls, or changes in applicable law and operations.",
          "When updates are material, KawilMart may communicate them through the app, email, support, or visible policy changes on this page.",
        ],
      },
    ],
  },
  {
    key: "privacy",
    label: "Privacy Policy",
    eyebrow: "KawilMart Privacy Policy",
    title: "When you use KawilMart, you trust us with order, account, and support information. We take that responsibility seriously.",
    intro:
      "This section explains what information KawilMart collects, why we collect it, how we use it in the live marketplace, and the controls available to users.",
    cta: {
      href: "/inbox?tab=support",
      label: "Contact Support About Privacy",
      description: "Need access, correction, or deletion help?",
    },
    sections: [
      {
        id: "privacy",
        label: "Introduction",
        title: "Introduction",
        paragraphs: [
          "KawilMart collects information that helps the marketplace function safely and reliably. That includes account data, order details, saved addresses, notifications, support conversations, and limited technical information used to secure the platform.",
          "We do not describe features here that the current app does not support. This policy is aligned with the actual codebase and operational flows in KawilMart today.",
        ],
      },
      {
        id: "information-we-collect",
        label: "Information KawilMart collects",
        title: "Information KawilMart collects",
        rows: [
          ["Account and identity data", "Name, email address, role metadata, profile image, and account status used for authentication and access control."],
          ["Order and address data", "Saved addresses, phone numbers, cart contents, product choices, order records, delivery mode, and tracking status."],
          ["Seller and rider information", "Business details, support contacts, verification notes, rider availability, vehicle details, and billing-related access fields when provided."],
          ["Support and communication data", "Notifications, support inbox messages, operational notes, and account-related communication history."],
          ["Technical data", "Session and device-level information used for performance, login continuity, security, and error diagnosis."],
        ],
      },
      {
        id: "why-we-collect-data",
        label: "Why KawilMart collects data",
        title: "Why KawilMart collects data",
        bullets: [
          "To create and secure accounts for buyers, sellers, riders, and admins.",
          "To process seller-specific orders and calculate delivery fees based on seller location and address details.",
          "To display order tracking, unlock contacts only at the correct order stage, and send operational notifications.",
          "To handle support, disputes, fraud review, moderation, and marketplace safety decisions.",
          "To manage subscription access, verification status, and invoice or statement records for sellers and riders where applicable.",
        ],
      },
      {
        id: "privacy-controls",
        label: "Your privacy controls",
        title: "Your privacy controls",
        bullets: [
          "You can update certain account and address details directly in the app.",
          "You can contact KawilMart to request help with correcting inaccurate information.",
          "You can ask for account review, deletion support, or data-related guidance through the support inbox.",
          "Some communication settings and operational messages are tied to active orders and may still be required for service use.",
        ],
      },
      {
        id: "sharing-information",
        label: "Sharing your information",
        title: "Sharing your information",
        paragraphs: [
          "KawilMart does not sell personal data. We share limited information only when needed to operate the marketplace, such as showing a seller what they need to fulfill an order or giving a rider only the contact details they need after assignment acceptance.",
          "We may also use trusted service providers for authentication, email, SMS, hosting, or operational infrastructure. Where required, we may disclose information for legal compliance or security investigations.",
        ],
      },
      {
        id: "security-retention",
        label: "Security and retention",
        title: "Keeping your information secure",
        paragraphs: [
          "KawilMart uses platform-level authentication, access controls, and operational review processes to reduce misuse and unauthorized access.",
          "We retain information for as long as reasonably necessary to operate the marketplace, support users, investigate issues, maintain records, and satisfy legal, security, or accounting obligations.",
        ],
      },
      {
        id: "about-this-policy",
        label: "About this policy",
        title: "About this policy",
        paragraphs: [
          "This privacy policy describes the current KawilMart marketplace. If the app gains new capabilities later, the policy may be updated so that the legal center continues to match the product people are actually using.",
        ],
      },
    ],
  },
  {
    key: "terms",
    label: "Terms of Service",
    eyebrow: "KawilMart Terms of Service",
    title: "These terms explain the rules for using KawilMart as a buyer, seller, rider, admin, or visitor.",
    intro:
      "By using KawilMart, you agree to use the platform responsibly, provide accurate information, and follow the role-specific expectations that keep the marketplace safe and workable.",
    cta: {
      href: "/legal#marketplace-rules",
      label: "Jump to Marketplace Rules",
      description: "See the conduct rules that apply across KawilMart.",
    },
    sections: [
      {
        id: "terms",
        label: "Introduction",
        title: "Introduction",
        paragraphs: [
          "KawilMart provides the digital infrastructure that connects customers, sellers, riders, and admins. Sellers remain responsible for their listings, stock, pricing, and fulfillment commitments.",
          "Use of the platform is conditioned on lawful, honest, and respectful behavior. If you do not agree to these terms, you should not use KawilMart.",
        ],
      },
      {
        id: "accounts-eligibility",
        label: "Account registration",
        title: "Account registration and eligibility",
        bullets: [
          "You must provide accurate and current information when creating or maintaining an account.",
          "You are responsible for protecting your login credentials and for activity under your account.",
          "KawilMart may restrict or suspend accounts that appear fraudulent, abusive, compromised, or non-compliant.",
          "Some marketplace roles may require added verification, supporting details, or admin review before full access is granted.",
        ],
      },
      {
        id: "orders-cod-delivery",
        label: "Orders and fulfillment",
        title: "Orders, cash on delivery, and fulfillment",
        rows: [
          ["Checkout", "KawilMart currently supports cash on delivery as the active payment flow."],
          ["Delivery mode", "Orders may be marked for delivery or pickup depending on customer choice and marketplace logic."],
          ["Order acceptance", "Seller contact unlocks after the seller accepts the order; rider contact unlocks after rider acceptance for delivery orders."],
          ["Stock protection", "An order may be blocked or adjusted if stock changes during checkout or if the seller account is unavailable."],
        ],
      },
      {
        id: "seller-obligations",
        label: "Seller obligations",
        title: "Seller obligations",
        bullets: [
          "Only list goods you are allowed to sell and can fulfill accurately.",
          "Keep stock, pricing, descriptions, and images truthful and current.",
          "Prepare accepted orders promptly for pickup or rider handoff.",
          "Maintain any verification, compliance, business, and billing details required by KawilMart.",
        ],
      },
      {
        id: "buyer-obligations",
        label: "Buyer obligations",
        title: "Buyer obligations",
        bullets: [
          "Provide a reachable phone number and accurate delivery or pickup information.",
          "Only place cash on delivery orders when you are prepared to complete them.",
          "Use reviews, order confirmation, and support tools honestly and only for genuine marketplace issues.",
          "Follow return, cancellation, replacement, or dispute instructions when KawilMart support requests additional evidence.",
        ],
      },
      {
        id: "rider-obligations",
        label: "Rider obligations",
        title: "Rider obligations",
        bullets: [
          "Keep rider availability status truthful and respond to assignments responsibly.",
          "Only use contact information for the active delivery you were assigned to.",
          "Do not falsely mark deliveries as completed or misuse order information.",
          "Comply with road safety, local law, and any rider verification or conduct requirements KawilMart applies.",
        ],
      },
      {
        id: "marketplace-rules",
        label: "Marketplace rules",
        title: "Prohibited conduct",
        bullets: [
          "Fraud, payment abuse, fake orders, or deliberate misuse of cash on delivery.",
          "False listings, counterfeit goods, illegal products, or unsafe marketplace activity.",
          "Harassment, threats, hate, abuse, or deceptive communication toward users or staff.",
          "Data scraping, unauthorized access attempts, or efforts to interfere with the platform.",
          "Creating or using accounts to evade suspensions, restrictions, or safety review.",
        ],
      },
      {
        id: "enforcement-updates",
        label: "Enforcement and updates",
        title: "Enforcement and updates",
        paragraphs: [
          "KawilMart may limit listings, pause features, suspend accounts, or preserve records where marketplace safety, dispute review, compliance, or fraud analysis requires it.",
          "These terms may evolve as KawilMart evolves. Continued use after a material update may be treated as acceptance of the revised terms where permitted by law.",
        ],
      },
    ],
  },
  {
    key: "roles",
    label: "Marketplace Roles",
    eyebrow: "Marketplace Role Guide",
    title: "KawilMart works best when each role understands its responsibilities and where platform control begins and ends.",
    intro:
      "This role guide gives a clearer operational view of sellers, buyers, riders, and KawilMart support teams in the marketplace.",
    cta: {
      href: "/seller",
      label: "Open Seller Area",
      description: "Already working as a seller on KawilMart?",
    },
    sections: [
      {
        id: "roles",
        label: "Introduction",
        title: "Introduction",
        paragraphs: [
          "KawilMart is designed around distinct marketplace roles. Each role sees different tools, notifications, and responsibilities in the app.",
        ],
      },
      {
        id: "sellers",
        label: "Sellers",
        title: "Sellers",
        paragraphs: [
          "Sellers manage their products, store presence, stock, and order activity inside the seller dashboard.",
        ],
        bullets: [
          "Product publishing and editing can be limited if seller access is inactive or under review.",
          "Seller billing, subscription access, and invoice documents are handled inside KawilMart's seller operations flow.",
          "Sellers may receive ratings from buyers after qualifying completed orders.",
        ],
      },
      {
        id: "buyers",
        label: "Buyers",
        title: "Buyers",
        paragraphs: [
          "Buyers use KawilMart to browse products, place orders, save delivery addresses, and track marketplace activity from checkout to delivery confirmation.",
        ],
        bullets: [
          "Customers can choose delivery or pickup where supported.",
          "Customers confirm delivery inside the app after receiving eligible orders.",
          "Order issues should be raised through support with screenshots, photos, or order details where possible.",
        ],
      },
      {
        id: "riders",
        label: "Riders",
        title: "Riders",
        paragraphs: [
          "Riders manage active delivery work through the rider dashboard and are expected to keep their availability and status updates reliable.",
        ],
        bullets: [
          "Assignments can be accepted or declined inside the dashboard.",
          "Delivery updates and statements are managed through rider-specific tools.",
          "Contact access is limited until the rider formally accepts the assignment.",
        ],
      },
      {
        id: "admins-support",
        label: "Admins and support",
        title: "Admins and support",
        paragraphs: [
          "KawilMart admins and support teams may review disputes, manage access, communicate operational updates, and step in when marketplace fairness or security requires intervention.",
          "That review can include order history, tracking events, support messages, listing records, and account-level signals relevant to the issue.",
        ],
      },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    eyebrow: "KawilMart Legal FAQ",
    title: "Quick answers to common policy and marketplace questions.",
    intro:
      "This FAQ focuses on the features and workflows KawilMart currently runs, including cash on delivery, rider assignment, seller access controls, and privacy support.",
    cta: {
      href: "mailto:kawilmart@gmail.com",
      label: "Email KawilMart",
      description: "Prefer email instead of the support inbox?",
    },
    sections: [
      {
        id: "faq",
        label: "Introduction",
        title: "Introduction",
        paragraphs: [
          "These answers are written to be practical, short, and aligned with the current KawilMart product.",
        ],
      },
      {
        id: "shopping-orders",
        label: "Shopping and orders",
        title: "Shopping and orders",
        qa: [
          {
            question: "Why can one checkout become multiple orders?",
            answer:
              "Because KawilMart can split the cart into seller-specific orders when products come from different sellers.",
          },
          {
            question: "How do I pay today?",
            answer:
              "KawilMart's active checkout model is cash on delivery.",
          },
          {
            question: "Can I choose pickup instead of delivery?",
            answer:
              "Yes, where the order supports it. Pickup orders do not carry a delivery fee.",
          },
        ],
      },
      {
        id: "sellers-billing",
        label: "Sellers and billing",
        title: "Sellers and billing",
        qa: [
          {
            question: "Can KawilMart pause a seller account?",
            answer:
              "Yes. Seller product activity or store access can be limited when subscription, compliance, fraud, or operational review requires it.",
          },
          {
            question: "Are seller invoices part of the platform?",
            answer:
              "Yes. KawilMart includes seller billing and invoice-related workflows in the current codebase.",
          },
        ],
      },
      {
        id: "riders-delivery",
        label: "Riders and delivery",
        title: "Riders and delivery",
        qa: [
          {
            question: "When does a rider see contact details?",
            answer:
              "After the rider accepts the relevant delivery assignment.",
          },
          {
            question: "Can a rider decline a job?",
            answer:
              "Yes. Riders can accept or decline assignments through the rider dashboard, subject to order state and platform rules.",
          },
        ],
      },
      {
        id: "privacy-accounts",
        label: "Privacy and accounts",
        title: "Privacy and accounts",
        qa: [
          {
            question: "Does KawilMart sell my personal data?",
            answer:
              "No. KawilMart does not sell personal data. Limited information is shared only where needed to operate the marketplace or comply with law.",
          },
          {
            question: "How do I ask for privacy help?",
            answer:
              "Use the KawilMart support inbox or contact the public support channels listed in the footer and legal center.",
          },
        ],
      },
    ],
  },
];

const titleBarStyle = {
  backgroundImage:
    "linear-gradient(180deg, rgba(249, 115, 22, 0.06) 0%, rgba(255, 255, 255, 0.96) 65%, rgba(255, 255, 255, 1) 100%)",
};

const DocumentIllustration = ({ accent = "Overview" }) => (
  <div className="mx-auto flex w-full max-w-[260px] justify-center py-8">
    <svg viewBox="0 0 320 180" className="w-full text-slate-900" fill="none" aria-hidden="true">
      <rect x="20" y="96" width="66" height="42" stroke="currentColor" strokeWidth="2" />
      <line x1="34" y1="110" x2="72" y2="110" stroke="#f97316" strokeWidth="4" />
      <line x1="34" y1="122" x2="60" y2="122" stroke="#94a3b8" strokeWidth="2" />

      <path d="M134 32 180 18 226 32V84C226 110 207 130 180 140 153 130 134 110 134 84V32Z" fill="#f97316" />
      <path d="M167 58h17c9 0 15 4 15 13 0 9-6 14-17 14h-15v16h-14V58h14Zm0 11v15h15c5 0 8-2 8-7 0-5-3-8-8-8h-15Z" fill="white" />

      <rect x="238" y="90" width="54" height="48" stroke="currentColor" strokeWidth="2" />
      <line x1="250" y1="103" x2="280" y2="103" stroke="#94a3b8" strokeWidth="2" />
      <line x1="250" y1="115" x2="274" y2="115" stroke="#94a3b8" strokeWidth="2" />
      <path d="M266 56v22" stroke="currentColor" strokeWidth="2" />
      <path d="M252 68c0-10 6-16 14-16s14 6 14 16" stroke="currentColor" strokeWidth="2" />

      <line x1="86" y1="138" x2="134" y2="138" stroke="#94a3b8" strokeWidth="2" />
      <line x1="226" y1="138" x2="238" y2="138" stroke="#94a3b8" strokeWidth="2" />
      <line x1="292" y1="138" x2="304" y2="138" stroke="#94a3b8" strokeWidth="2" />

      <text x="160" y="168" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700" letterSpacing="2">
        {accent.toUpperCase()}
      </text>
    </svg>
  </div>
);

const TabLink = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative shrink-0 border-b-2 px-1 py-4 text-sm font-medium transition ${
      active
        ? "border-orange-500 text-orange-600"
        : "border-transparent text-slate-600 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

const SidebarLink = ({ active, href, children, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className={`block border-l-2 py-3 pl-4 pr-3 text-sm transition ${
      active
        ? "border-orange-500 text-orange-600"
        : "border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
    }`}
  >
    {children}
  </a>
);

const SectionTable = ({ rows }) => (
  <div className="border border-slate-200">
    <div className="grid grid-cols-1 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="border-b border-slate-200 px-4 py-3 md:border-b-0 md:border-r">Topic</div>
      <div className="px-4 py-3">Details</div>
    </div>
    {rows.map(([label, value], index) => (
      <div
        key={label}
        className={`grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] ${index !== rows.length - 1 ? "border-b border-slate-200" : ""}`}
      >
        <div className="border-b border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 md:border-b-0 md:border-r">
          {label}
        </div>
        <div className="px-4 py-4 text-sm leading-7 text-slate-600">{value}</div>
      </div>
    ))}
  </div>
);

const BulletList = ({ items }) => (
  <ul className="space-y-4">
    {items.map((item) => (
      <li key={item} className="flex gap-4 text-sm leading-7 text-slate-600">
        <span className="mt-3 h-1.5 w-1.5 shrink-0 bg-orange-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const QaList = ({ items }) => (
  <div className="space-y-6">
    {items.map((item, index) => (
      <div key={item.question} className={index !== items.length - 1 ? "border-b border-slate-200 pb-6" : ""}>
        <h4 className="text-base font-semibold text-slate-900">{item.question}</h4>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
      </div>
    ))}
  </div>
);

const LegalCenterPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("overview");

  const tabMap = useMemo(
    () => Object.fromEntries(legalTabs.map((tab) => [tab.key, tab])),
    []
  );

  const sectionToTabMap = useMemo(() => {
    const mapping = {};

    legalTabs.forEach((tab) => {
      mapping[tab.key] = tab.key;
      tab.sections.forEach((section) => {
        mapping[section.id] = tab.key;
      });
    });

    return mapping;
  }, []);

  const currentTab = tabMap[activeTab] || legalTabs[0];

  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        setActiveTab("overview");
        setActiveSection("overview");
        return;
      }

      const nextTab = sectionToTabMap[hash];
      if (nextTab) {
        setActiveTab(nextTab);
        setActiveSection(hash);

        requestAnimationFrame(() => {
          const target = document.getElementById(hash);
          if (target) {
            target.scrollIntoView({ block: "start" });
          }
        });
      }
    };

    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);

    return () => {
      window.removeEventListener("hashchange", syncWithHash);
    };
  }, [sectionToTabMap]);

  useEffect(() => {
    const sectionIds = currentTab.sections.map((section) => section.id);

    const onScroll = () => {
      let current = currentTab.sections[0]?.id || currentTab.key;

      sectionIds.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (!element) {
          return;
        }

        const rect = element.getBoundingClientRect();
        if (rect.top <= 180) {
          current = sectionId;
        }
      });

      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [currentTab]);

  const handleTabChange = (tabKey) => {
    const nextTab = tabMap[tabKey];
    if (!nextTab) {
      return;
    }

    const nextSection = nextTab.sections[0]?.id || tabKey;
    setActiveTab(tabKey);
    setActiveSection(nextSection);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${nextSection}`);

      requestAnimationFrame(() => {
        document.getElementById(nextSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200" style={titleBarStyle}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 lg:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
            KawilMart Privacy & Terms
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
            Policy pages arranged like a help document, but written for KawilMart's real marketplace logic.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Browse by topic, jump through the left document rail, and read each policy section in a cleaner, more focused layout.
          </p>
        </div>
      </div>

      <div className="sticky top-[72px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-4 sm:px-6 md:px-10 lg:px-16">
          {legalTabs.map((tab) => (
            <TabLink
              key={tab.key}
              active={tab.key === activeTab}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </TabLink>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
          <aside className="border-b border-slate-200 py-6 lg:sticky lg:top-[133px] lg:h-[calc(100vh-133px)] lg:overflow-auto lg:border-b-0 lg:border-r lg:pr-8">
            <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
              {currentTab.sections.map((section) => (
                <SidebarLink
                  key={section.id}
                  active={activeSection === section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </SidebarLink>
              ))}
            </div>
          </aside>

          <main className="min-w-0 py-8 lg:py-12">
            <article id={currentTab.key} className="scroll-mt-44">
              <div className="border-b border-slate-200 pb-10 text-center">
                <DocumentIllustration accent={currentTab.label} />
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
                  {currentTab.eyebrow}
                </p>
                <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
                  {currentTab.title}
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
                  {currentTab.intro}
                </p>

                {currentTab.cta ? (
                  <div className="mx-auto mt-8 max-w-xl border border-orange-200 bg-orange-50/60 px-5 py-5 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                      KawilMart shortcut
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {currentTab.cta.description}
                    </p>
                    <a
                      href={currentTab.cta.href}
                      className="mt-4 inline-flex items-center gap-2 border-b border-orange-500 pb-1 text-sm font-medium text-orange-600"
                    >
                      {currentTab.cta.label}
                      <span aria-hidden="true">+</span>
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="mx-auto max-w-4xl">
                {currentTab.sections.map((section, index) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-44 ${index === 0 ? "pt-10" : "border-t border-slate-200 pt-10"} pb-10`}
                  >
                    <div className="max-w-3xl">
                      <h3 className="text-2xl font-semibold text-slate-900">{section.title}</h3>

                      {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph} className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
                          {paragraph}
                        </p>
                      ))}

                      {section.bullets?.length ? (
                        <div className="mt-6">
                          <BulletList items={section.bullets} />
                        </div>
                      ) : null}

                      {section.rows?.length ? (
                        <div className="mt-6">
                          <SectionTable rows={section.rows} />
                        </div>
                      ) : null}

                      {section.qa?.length ? (
                        <div className="mt-6">
                          <QaList items={section.qa} />
                        </div>
                      ) : null}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalCenterPage;
