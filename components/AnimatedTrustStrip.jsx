'use client'
import { useEffect, useState } from "react";

// Premium animated trust strip — the web equivalent of a Rive/Lottie strip:
// one guarantee visible at a time, its scene animates in vector (inline SVG,
// transform/opacity-only keyframes → compositor-friendly 60fps), pauses,
// fades into the next. No images, no GIFs, no dependencies.
const CYCLE_MS = 3200;

const ORANGE = "#FF6A00";
const ORANGE_DEEP = "#E85D00";
const SUCCESS = "#22C55E";

/* ---------------- scenes ---------------- */

const TruckScene = () => (
  <svg viewBox="0 0 64 44" className="h-10 w-14" fill="none" aria-hidden="true">
    {/* speed lines */}
    <g stroke={ORANGE} strokeWidth="2" strokeLinecap="round" opacity="0">
      <path d="M2 15h9" className="kwts-line kwts-line-1" />
      <path d="M0 22h12" className="kwts-line kwts-line-2" />
      <path d="M3 29h8" className="kwts-line kwts-line-3" />
    </g>
    <g className="kwts-truck">
      {/* cargo box */}
      <rect x="16" y="9" width="26" height="19" rx="3" fill={ORANGE} />
      {/* cab */}
      <path d="M42 14h9.2c.9 0 1.8.4 2.4 1.2l4 5c.5.7.8 1.5.8 2.3V25a3 3 0 0 1-3 3H42V14Z" fill={ORANGE_DEEP} />
      <path d="M44.5 17h5.4l3.3 4.3h-8.7V17Z" fill="#FFE1CC" />
      {/* wheels */}
      <g className="kwts-wheel" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="25" cy="30" r="4.6" fill="#111111" />
        <circle cx="25" cy="30" r="1.8" fill="#fff" />
        <path d="M25 26.2v2m0 3.6v2M21.2 30h2m3.6 0h2" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="kwts-wheel" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="47" cy="30" r="4.6" fill="#111111" />
        <circle cx="47" cy="30" r="1.8" fill="#fff" />
        <path d="M47 26.2v2m0 3.6v2M43.2 30h2m3.6 0h2" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* dust puff on brake */}
      <g className="kwts-dust" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="17" cy="32" r="2.6" fill="#D1D5DB" />
        <circle cx="13.5" cy="30" r="1.7" fill="#E5E7EB" />
      </g>
    </g>
  </svg>
);

const ShieldScene = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-14" fill="none" aria-hidden="true">
    <g className="kwts-shield" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <path d="M24 4 40 10v11c0 9.6-6.4 18.3-16 21-9.6-2.7-16-11.4-16-21V10L24 4Z" fill={ORANGE} />
      <path d="M24 8.4 36 13v8.3c0 7.5-4.9 14.3-12 16.8-7.1-2.5-12-9.3-12-16.8V13l12-4.6Z" fill={ORANGE_DEEP} opacity="0.35" />
      {/* diagonal shine sweep, clipped to the shield */}
      <clipPath id="kwts-shield-clip">
        <path d="M24 4 40 10v11c0 9.6-6.4 18.3-16 21-9.6-2.7-16-11.4-16-21V10L24 4Z" />
      </clipPath>
      <g clipPath="url(#kwts-shield-clip)">
        <rect x="-14" y="-6" width="10" height="60" fill="#fff" opacity="0.35" transform="rotate(18 0 0)" className="kwts-shine" />
      </g>
    </g>
    {/* sparkles */}
    <path className="kwts-sparkle kwts-sparkle-1" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }}
      d="M40 8.5 41 11l2.5 1L41 13l-1 2.5L39 13l-2.5-1L39 11l1-2.5Z" fill={ORANGE} />
    <path className="kwts-sparkle kwts-sparkle-2" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }}
      d="M7.5 27l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" fill={ORANGE} />
    {/* white badge + self-drawing green check */}
    <g className="kwts-badge" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx="33.5" cy="34" r="8" fill="#fff" className="kwts-badge-shadow" />
      <path d="m29.8 34.2 2.6 2.6 5-5.4" stroke={SUCCESS} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="kwts-check" />
    </g>
  </svg>
);

const LockScene = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-14" fill="none" aria-hidden="true">
    {/* card slides up */}
    <g className="kwts-card">
      <rect x="4" y="16" width="30" height="21" rx="3.5" fill="#F3F4F6" />
      <rect x="4" y="20.5" width="30" height="4.5" fill={ORANGE} />
      <rect x="8" y="29" width="10" height="2.4" rx="1.2" fill="#D1D5DB" />
      <rect x="8" y="32.6" width="6.5" height="2.4" rx="1.2" fill="#E5E7EB" />
    </g>
    {/* glow pulse behind the lock */}
    <circle cx="34" cy="27" r="12" fill={ORANGE} opacity="0" className="kwts-glow" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    {/* lock drops in, shackle clicks shut */}
    <g className="kwts-lock">
      <path d="M29.5 22v-3.4a4.5 4.5 0 0 1 9 0V22" stroke={ORANGE_DEEP} strokeWidth="2.6" strokeLinecap="round" className="kwts-shackle" />
      <rect x="26.5" y="21" width="15" height="12.5" rx="3" fill={ORANGE} />
      <circle cx="34" cy="26.4" r="1.8" fill="#fff" />
      <rect x="33.1" y="27" width="1.8" height="3.4" rx="0.9" fill="#fff" />
    </g>
  </svg>
);

const ReturnsScene = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-14" fill="none" aria-hidden="true">
    {/* package slides in with a slight tilt */}
    <g className="kwts-box" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <rect x="15" y="16" width="18" height="16" rx="2.5" fill={ORANGE} />
      <rect x="22.8" y="16" width="2.4" height="16" fill="#FFE1CC" />
      <rect x="15" y="21.4" width="18" height="2" fill={ORANGE_DEEP} opacity="0.5" />
    </g>
    {/* circular arrow orbits the package */}
    <g className="kwts-orbit" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <path d="M24 8.5A15.5 15.5 0 0 1 39.5 24" stroke={ORANGE_DEEP} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36.6 20.5 39.5 24l1.3-4.3" stroke={ORANGE_DEEP} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 39.5A15.5 15.5 0 0 1 8.5 24" stroke={ORANGE_DEEP} strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
    </g>
    {/* green check pops */}
    <g className="kwts-pop" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx="36.5" cy="35" r="6.6" fill={SUCCESS} />
      <path d="m33.6 35.1 2 2 3.8-4.1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const SLIDES = [
  { key: "delivery", title: "Fast Delivery", subtitle: "24–48 Hours", Scene: TruckScene },
  { key: "original", title: "100% Original", subtitle: "Genuine Products", Scene: ShieldScene },
  { key: "secure", title: "Secure Payment", subtitle: "Encrypted Checkout", Scene: LockScene },
  { key: "returns", title: "Easy Returns", subtitle: "7-Day Return Policy", Scene: ReturnsScene },
];

/* Keyframes scoped with a kwts- prefix. Only transform + opacity animate. */
const STRIP_CSS = `
.kwts-slide{animation:kwts-cycle ${CYCLE_MS}ms linear both}
@keyframes kwts-cycle{0%{opacity:0;transform:translateY(5px)}11%{opacity:1;transform:translateY(0)}89%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-5px)}}
.kwts-title{animation:kwts-text .6s cubic-bezier(.22,1,.36,1) 1.45s both}
.kwts-sub{animation:kwts-text .6s cubic-bezier(.22,1,.36,1) 1.6s both}
@keyframes kwts-text{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}

.kwts-truck{animation:kwts-truck 1.7s cubic-bezier(.16,1,.3,1) .1s both}
@keyframes kwts-truck{0%{transform:translateX(-74px)}58%{transform:translateX(1.6px)}68%{transform:translate(-.6px,0)}76%{transform:translate(0,1.4px)}84%{transform:translate(0,-.4px)}100%{transform:translate(0,0)}}
.kwts-wheel{animation:kwts-spin 1.55s cubic-bezier(.2,.7,.3,1) .1s both}
@keyframes kwts-spin{from{transform:rotate(-540deg)}to{transform:rotate(0deg)}}
.kwts-line{animation:kwts-lines 1.15s ease-out .18s both}
.kwts-line-2{animation-delay:.28s}
.kwts-line-3{animation-delay:.38s}
@keyframes kwts-lines{0%{opacity:0;transform:translateX(16px)}25%{opacity:.9}70%{opacity:.5}100%{opacity:0;transform:translateX(-7px)}}
.kwts-dust{animation:kwts-dust .55s ease-out 1.28s both}
@keyframes kwts-dust{0%{opacity:0;transform:translateX(4px) scale(.4)}35%{opacity:.6}100%{opacity:0;transform:translateX(-3px) scale(1.5)}}

.kwts-shield{animation:kwts-grow .6s cubic-bezier(.34,1.56,.64,1) .1s both}
@keyframes kwts-grow{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
.kwts-shine{animation:kwts-shine .75s ease-in-out .75s both}
@keyframes kwts-shine{from{transform:rotate(18deg) translateX(0)}to{transform:rotate(18deg) translateX(64px)}}
.kwts-sparkle{animation:kwts-sparkle .7s ease-out 1.15s both}
.kwts-sparkle-2{animation-delay:1.38s}
@keyframes kwts-sparkle{0%{opacity:0;transform:scale(0)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(.5)}}
.kwts-badge{animation:kwts-grow .45s cubic-bezier(.34,1.56,.64,1) .9s both}
.kwts-check{stroke-dasharray:12;stroke-dashoffset:12;animation:kwts-draw .5s ease-out 1.25s both}
@keyframes kwts-draw{to{stroke-dashoffset:0}}

.kwts-card{animation:kwts-rise .55s cubic-bezier(.22,1,.36,1) .05s both}
@keyframes kwts-rise{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
.kwts-lock{animation:kwts-drop .6s cubic-bezier(.22,1,.36,1) .55s both}
@keyframes kwts-drop{0%{opacity:0;transform:translateY(-20px)}55%{opacity:1;transform:translateY(2.4px)}78%{transform:translateY(-1.2px)}100%{opacity:1;transform:translateY(0)}}
.kwts-shackle{animation:kwts-click .22s ease-in 1.2s both}
@keyframes kwts-click{from{transform:translateY(-2.6px)}to{transform:translateY(0)}}
.kwts-glow{animation:kwts-glow .7s ease-out 1.35s both}
@keyframes kwts-glow{0%{opacity:.3;transform:scale(.55)}100%{opacity:0;transform:scale(1.35)}}

.kwts-box{animation:kwts-slide-in .6s cubic-bezier(.22,1,.36,1) .05s both}
@keyframes kwts-slide-in{0%{opacity:0;transform:translateX(-17px) rotate(-8deg)}70%{opacity:1;transform:translateX(1px) rotate(1.6deg)}100%{opacity:1;transform:translateX(0) rotate(0)}}
.kwts-orbit{animation:kwts-orbit 1.35s cubic-bezier(.45,.05,.35,1) .55s both}
@keyframes kwts-orbit{from{opacity:0;transform:rotate(-300deg)}18%{opacity:1}to{opacity:1;transform:rotate(0deg)}}
.kwts-pop{animation:kwts-pop .5s cubic-bezier(.34,1.56,.64,1) 1.85s both}
@keyframes kwts-pop{0%{opacity:0;transform:scale(0)}70%{opacity:1;transform:scale(1.14)}100%{opacity:1;transform:scale(1)}}

@media (prefers-reduced-motion:reduce){
  .kwts-slide,.kwts-slide *{animation:none!important}
}
`;

const AnimatedTrustStrip = ({ className = "" }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setSlideIndex((current) => (current + 1) % SLIDES.length),
      CYCLE_MS
    );
    return () => window.clearInterval(interval);
  }, []);

  const { key, title, subtitle, Scene } = SLIDES[slideIndex];

  return (
    <section
      className={`relative h-16 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)] ring-1 ring-gray-100/70 ${className}`}
      aria-label="Fast delivery in 24 to 48 hours. 100% original, genuine products. Secure, encrypted payment. Easy returns within 7 days."
    >
      <style>{STRIP_CSS}</style>
      {/* Remounted per rotation so every scene replays from frame one. */}
      <div key={`${key}-${slideIndex}`} className="kwts-slide flex h-full items-center gap-3 px-4" aria-hidden="true">
        <span className="flex h-12 w-14 shrink-0 items-center justify-center">
          <Scene />
        </span>
        <span className="min-w-0 flex-1">
          <span className="kwts-title block truncate text-[13px] font-bold leading-4 text-[#111111]">{title}</span>
          <span className="kwts-sub block truncate text-[11px] font-medium leading-4 text-[#777777]">{subtitle}</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {SLIDES.map((slide, index) => (
            <span
              key={slide.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === slideIndex ? "w-4 bg-[#FF6A00]" : "w-1.5 bg-gray-200"}`}
            />
          ))}
        </span>
      </div>
    </section>
  );
};

export default AnimatedTrustStrip;
