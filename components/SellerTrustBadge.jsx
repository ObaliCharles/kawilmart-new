'use client'

const toneClasses = {
  emerald: {
    pill: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white text-emerald-700",
    icon: "bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.24)]",
    compact: "border-emerald-200 bg-emerald-50 text-emerald-600 shadow-[0_8px_18px_rgba(5,150,105,0.14)]",
  },
  sky: {
    pill: "border-sky-200 bg-gradient-to-r from-sky-50 to-white text-sky-700",
    icon: "bg-sky-600 text-white shadow-[0_8px_18px_rgba(2,132,199,0.24)]",
    compact: "border-sky-200 bg-sky-50 text-sky-600 shadow-[0_8px_18px_rgba(2,132,199,0.14)]",
  },
  amber: {
    pill: "border-amber-200 bg-gradient-to-r from-amber-50 to-white text-amber-700",
    icon: "bg-amber-500 text-white shadow-[0_8px_18px_rgba(245,158,11,0.24)]",
    compact: "border-amber-200 bg-amber-50 text-amber-600 shadow-[0_8px_18px_rgba(245,158,11,0.14)]",
  },
  violet: {
    pill: "border-violet-200 bg-gradient-to-r from-violet-50 to-white text-violet-700",
    icon: "bg-violet-600 text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]",
    compact: "border-violet-200 bg-violet-50 text-violet-600 shadow-[0_8px_18px_rgba(124,58,237,0.14)]",
  },
  slate: {
    pill: "border-slate-200 bg-gradient-to-r from-slate-100 to-white text-slate-700",
    icon: "bg-slate-600 text-white shadow-[0_8px_18px_rgba(51,65,85,0.24)]",
    compact: "border-slate-200 bg-slate-100 text-slate-600 shadow-[0_8px_18px_rgba(51,65,85,0.14)]",
  },
};

const BadgeCheckIcon = ({ className = "h-2.5 w-2.5" }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.5 8.2L7 10.7L11.75 5.95"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const SellerTrustBadge = ({ sellerProfile, className = "", variant = "label" }) => {
  const label = sellerProfile?.badgeLabel || (sellerProfile?.isVerified ? "Verified Seller" : "");

  if (!label) {
    return null;
  }

  const tone = sellerProfile?.badgeTone || (sellerProfile?.isVerified ? "emerald" : "slate");
  const toneClass = toneClasses[tone] || toneClasses.emerald;

  if (variant === "icon") {
    const verificationLabel = sellerProfile?.isVerified ? "Verified seller" : label;

    if (!sellerProfile?.isVerified && !/verified/i.test(label || "")) {
      return null;
    }

    return (
      <span
        role="img"
        aria-label={verificationLabel}
        title={verificationLabel}
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${toneClass.compact} ${className}`}
      >
        <BadgeCheckIcon />
      </span>
    );
  }

  return (
    <span className={`inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${toneClass.pill} ${className}`}>
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${toneClass.icon}`}>
        <BadgeCheckIcon />
      </span>
      <span className="min-w-0 truncate">
        {label}
      </span>
    </span>
  );
};

export default SellerTrustBadge;
