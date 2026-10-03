const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://wilwa.ug";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/seller/",
        "/cart",
        "/checkout",
        "/wishlist",
        "/my-orders",
        "/inbox",
        "/notifications",
        "/address-book",
        "/add-address",
        "/payment-methods",
        "/order-placed",
        "/track-order",
        "/sign-in",
        "/sign-up",
      ],
    },
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
    host: siteUrl.replace(/\/$/, ""),
  };
}
