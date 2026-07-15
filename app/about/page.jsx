import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { assets } from "@/assets/assets";
import { getResolvedSiteContent } from "@/lib/getSiteContent";

export const dynamic = "force-dynamic";

const AboutPage = async () => {
  const siteContent = await getResolvedSiteContent();
  const about = siteContent.aboutPage;

  const highlights = [
    {
      badge: "For customers",
      title: "Simple discovery, less guesswork",
      description:
        "Every shopping touchpoint is designed to feel clear, fast, and trustworthy from first search to final checkout.",
      image: assets.girl_with_headphone_image,
      accent: "from-orange-600/90 via-orange-500/40 to-transparent",
    },
    {
      badge: "For sellers",
      title: "A storefront that helps local businesses shine",
      description:
        "From product uploads to order updates, KawilMart gives sellers room to present their products professionally and grow.",
      image: assets.boy_with_laptop_image,
      accent: "from-slate-950/90 via-slate-900/40 to-transparent",
    },
    {
      badge: "For everyday life",
      title: "Tech that fits real routines",
      description:
        "We focus on products people actually use every day: learning, work, entertainment, communication, and convenience.",
      image: assets.girl_with_earphone_image,
      accent: "from-amber-600/90 via-amber-500/40 to-transparent",
    },
  ];

  const experienceBlocks = [
    {
      step: "01",
      title: "Browse with clarity",
      text: "Organized collections, sharper search, and useful product pages help people compare confidently.",
    },
    {
      step: "02",
      title: "Shop from trusted local sellers",
      text: "Local-first commerce sits at the center so customers connect with sellers who understand their market.",
    },
    {
      step: "03",
      title: "Stay updated after checkout",
      text: "Order tracking, notifications, and dashboards keep everyone informed as orders move.",
    },
  ];

  const promiseCards = [
    {
      title: "Local-first growth",
      text: "Digital commerce should create momentum for local sellers, riders, and communities.",
      dot: "bg-orange-500",
    },
    {
      title: "Trust at every step",
      text: "Transparent pricing, smooth communication, and dependable updates make shopping feel human.",
      dot: "bg-emerald-500",
    },
    {
      title: "Modern but practical",
      text: "Polished without becoming complicated — for shoppers and store owners alike.",
      dot: "bg-sky-500",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero — full-width dark band */}
        <section className="relative overflow-hidden bg-[linear-gradient(120deg,#0b1220_0%,#111827_55%,#1f1307_100%)] text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <p className="reveal-up text-xs font-semibold uppercase tracking-[0.28em] text-orange-400">
                {about.eyebrow}
              </p>
              <h1 className="reveal-up mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl" style={{ "--reveal-delay": "80ms" }}>
                {about.title}
              </h1>
              <p className="reveal-up mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base md:leading-8" style={{ "--reveal-delay": "160ms" }}>
                {about.intro}
              </p>

              <div className="reveal-up mt-9 flex flex-wrap gap-x-10 gap-y-5" style={{ "--reveal-delay": "240ms" }}>
                {about.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold text-white md:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-up relative hidden lg:block" style={{ "--reveal-delay": "200ms" }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={assets.girl_with_headphone_image}
                    alt="Customer enjoying the KawilMart experience"
                    className="h-64 w-full object-cover transition duration-700 hover:scale-105"
                    priority
                  />
                </div>
                <div className="mt-10 overflow-hidden rounded-2xl">
                  <Image
                    src={assets.boy_with_laptop_image}
                    alt="Seller using KawilMart on a laptop"
                    className="h-64 w-full object-cover transition duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why we exist — quiet strip */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[0.35fr_0.65fr] md:gap-14">
            <h2 className="reveal-up text-xl font-bold tracking-tight text-gray-950 md:text-2xl">Why we exist</h2>
            <div>
              <p className="reveal-up text-sm leading-7 text-gray-600 md:text-[15px] md:leading-8" style={{ "--reveal-delay": "100ms" }}>
                {about.story}
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {about.mission.map((item, index) => (
                  <li
                    key={item}
                    className="reveal-up flex items-start gap-2.5 text-sm leading-6 text-gray-700"
                    style={{ "--reveal-delay": `${160 + index * 70}ms` }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Highlights — full-bleed image cards */}
        <section className="bg-gray-50/70 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
            {highlights.map((item, index) => (
              <article
                key={item.title}
                className="reveal-up group relative h-80 overflow-hidden rounded-2xl md:h-96"
                style={{ "--reveal-delay": `${index * 110}ms` }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.accent}`} />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                    {item.badge}
                  </p>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug md:text-xl">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/85 transition-all duration-300 group-hover:line-clamp-none md:text-[13px] md:leading-6">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works — clean numbered steps */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="max-w-xl">
            <p className="reveal-up text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">How KawilMart works</p>
            <h2 className="reveal-up mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ "--reveal-delay": "80ms" }}>
              Built for a smoother shopping rhythm
            </h2>
          </div>
          <div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
            {experienceBlocks.map((item, index) => (
              <div key={item.step} className="reveal-up" style={{ "--reveal-delay": `${140 + index * 110}ms` }}>
                <span className="text-4xl font-black tracking-tight text-orange-100 md:text-5xl">{item.step}</span>
                <h3 className="mt-2 text-base font-bold text-gray-950">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our promise */}
        <section className="bg-gray-50/70 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="reveal-up text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">Our promise</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
              {promiseCards.map((item, index) => (
                <div key={item.title} className="reveal-up" style={{ "--reveal-delay": `${index * 110}ms` }}>
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <h3 className="mt-3 text-base font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing band — full width */}
        <section className="relative overflow-hidden bg-[linear-gradient(120deg,#0b1220_0%,#111827_60%,#251204_100%)] text-white">
          <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-orange-600/15 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-18 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <p className="reveal-up text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                People behind the marketplace
              </p>
              <h2 className="reveal-up mt-4 text-2xl font-bold leading-tight md:text-4xl" style={{ "--reveal-delay": "80ms" }}>
                A marketplace that feels local, lively, and dependable.
              </h2>
              <p className="reveal-up mt-4 max-w-xl text-sm leading-7 text-slate-300" style={{ "--reveal-delay": "160ms" }}>
                KawilMart is not just listings on a screen. It is helping customers discover better products,
                helping sellers present themselves confidently, and making every order feel supported from start to finish.
              </p>
              <div className="reveal-up mt-8 flex flex-wrap gap-x-10 gap-y-4" style={{ "--reveal-delay": "240ms" }}>
                {about.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-extrabold text-white">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-up grid grid-cols-2 gap-3" style={{ "--reveal-delay": "200ms" }}>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src={assets.girl_with_earphone_image}
                  alt="Customer enjoying products from KawilMart"
                  className="h-full min-h-[220px] w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
              <div className="grid gap-3">
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={assets.boy_with_laptop_image}
                    alt="Seller tools and digital shopping experience"
                    className="h-32 w-full object-cover transition duration-700 hover:scale-105 sm:h-40"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={assets.girl_with_headphone_image}
                    alt="KawilMart lifestyle showcase"
                    className="h-32 w-full object-cover transition duration-700 hover:scale-105 sm:h-40"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
