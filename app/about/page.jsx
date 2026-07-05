import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { assets } from "@/assets/assets";
import { getResolvedSiteContent } from "@/lib/getSiteContent";

export const dynamic = "force-dynamic";

const gridBackgroundStyle = {
  backgroundImage: `
    linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(251, 146, 60, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.18), transparent 24%)
  `,
  backgroundSize: "26px 26px, 26px 26px, 100% 100%, 100% 100%",
  backgroundColor: "#f7f3ec",
};

const AboutPage = async () => {
  const siteContent = await getResolvedSiteContent();
  const about = siteContent.aboutPage;

  const highlights = [
    {
      badge: "For customers",
      title: "Simple discovery, less guesswork",
      description:
        "We design every shopping touchpoint to feel clear, fast, and trustworthy from first search to final checkout.",
      image: assets.girl_with_headphone_image,
      accent: "from-orange-500/90 to-amber-400/80",
    },
    {
      badge: "For sellers",
      title: "A storefront that helps local businesses shine",
      description:
        "From product uploads to order updates, KawilMart gives sellers room to present their products professionally and grow.",
      image: assets.boy_with_laptop_image,
      accent: "from-slate-900/90 to-slate-700/80",
    },
    {
      badge: "For everyday life",
      title: "Tech that fits real routines",
      description:
        "We focus on products people actually use every day: learning, work, entertainment, communication, and daily convenience.",
      image: assets.girl_with_earphone_image,
      accent: "from-amber-500/90 to-orange-400/80",
    },
  ];

  const experienceBlocks = [
    {
      step: "01",
      title: "Browse with clarity",
      text: "Organized collections, sharper search, and useful product detail pages help people compare confidently.",
    },
    {
      step: "02",
      title: "Shop from trusted local sellers",
      text: "We put local-first commerce at the center so customers can connect with sellers that understand their market.",
    },
    {
      step: "03",
      title: "Stay updated after checkout",
      text: "Order tracking, role-based notifications, and operational dashboards keep everyone informed as orders move.",
    },
  ];

  const promiseCards = [
    {
      title: "Local-first growth",
      text: "We want digital commerce to create more momentum for local sellers, riders, and communities.",
    },
    {
      title: "Trust at every step",
      text: "Transparent pricing, smoother communication, and dependable updates make shopping feel more human.",
    },
    {
      title: "Modern but practical",
      text: "KawilMart is built to feel polished without becoming complicated for shoppers or store owners.",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-6 py-10 md:px-16 md:py-16 lg:px-32" style={gridBackgroundStyle}>
        <div className="mx-auto max-w-7xl space-y-10">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
                  {about.eyebrow}
                </p>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
                    {about.title}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                    {about.intro}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {about.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.75rem] border border-orange-100 bg-orange-50/70 p-5 shadow-sm"
                    >
                      <p className="text-xl font-semibold text-slate-900 md:text-2xl">{stat.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-900 p-2 shadow-lg">
                    <Image
                      src={assets.girl_with_headphone_image}
                      alt="Customer enjoying the KawilMart experience"
                      className="h-56 w-full rounded-[1.5rem] object-cover"
                      priority
                    />
                  </div>
                  <div className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                      Why we exist
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {about.story}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-700 p-6 text-white shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                      What feels different here
                    </p>
                    <ul className="mt-5 space-y-4">
                      {about.mission.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                            +
                          </span>
                          <span className="text-sm leading-7 text-slate-100">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white p-2 shadow-sm">
                    <Image
                      src={assets.boy_with_laptop_image}
                      alt="Seller or shopper using KawilMart on a laptop"
                      className="h-64 w-full rounded-[1.5rem] object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm"
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${item.accent} opacity-90`} />
                  <Image
                    src={item.image}
                    alt={item.title}
                    className="h-72 w-full object-cover mix-blend-soft-light"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                      {item.badge}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight">{item.title}</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2.25rem] border border-white/70 bg-white/85 p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">
                  How KawilMart works
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">
                  Built for a smoother shopping rhythm
                </h2>
              </div>

              <div className="mt-8 grid gap-4">
                {experienceBlocks.map((item) => (
                  <div
                    key={item.step}
                    className="grid gap-4 rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-5 md:grid-cols-[72px_1fr]"
                  >
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-lg font-semibold text-white">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/85 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <Image
                  src={assets.girl_with_earphone_image}
                  alt="Happy customer enjoying products from KawilMart"
                  className="h-72 w-full rounded-[1.75rem] object-cover"
                />
              </div>

              <div className="rounded-[2.25rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">
                  Our promise
                </p>
                <div className="mt-5 space-y-4">
                  {promiseCards.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] border border-orange-100 bg-white/80 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="p-7 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
                  People behind the marketplace
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                  We are building a marketplace that feels local, lively, and dependable.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-8 text-slate-300 md:text-base">
                  KawilMart is not just about listings on a screen. It is about helping customers discover better products,
                  helping sellers present themselves confidently, and helping every order feel supported from start to finish.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {about.stats.map((stat) => (
                    <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-lg font-semibold text-white">{stat.value}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 bg-slate-900/60 p-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-[1.75rem]">
                  <Image
                    src={assets.girl_with_headphone_image}
                    alt="KawilMart lifestyle showcase"
                    className="h-full min-h-[240px] w-full object-cover"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="overflow-hidden rounded-[1.75rem]">
                    <Image
                      src={assets.boy_with_laptop_image}
                      alt="Seller tools and digital shopping experience"
                      className="h-40 w-full object-cover sm:h-[190px]"
                    />
                  </div>
                  <div className="overflow-hidden rounded-[1.75rem]">
                    <Image
                      src={assets.girl_with_earphone_image}
                      alt="Customer enjoying products from KawilMart"
                      className="h-40 w-full object-cover sm:h-[190px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
