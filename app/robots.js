import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

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
