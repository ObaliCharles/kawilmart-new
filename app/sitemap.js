import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { getSellerAccessState } from "@/lib/sellerBilling";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://wilwa.ug").replace(/\/$/, "");

const publicPages = [
  "",
  "/all-products",
  "/categories",
  "/about",
  "/help",
  "/help/shopping",
  "/guides",
  "/legal",
  "/affiliates",
  "/careers",
  "/press",
];

export default async function sitemap() {
  const staticEntries = publicPages.map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/all-products" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/all-products" || path === "/categories" ? 0.9 : 0.6,
  }));

  try {
    await connectDB();
    const products = await Product.find({
      $or: [
        { productStatus: "active" },
        { productStatus: { $exists: false } },
        { productStatus: "" },
        { productStatus: null },
      ],
    }).select("_id userId updatedAt date").lean();

    const sellerIds = [...new Set(products.map((product) => String(product.userId || "")).filter(Boolean))];
    const sellers = sellerIds.length
      ? await User.find({ _id: { $in: sellerIds } }).select("_id sellerSubscriptionStatus sellerAccessUntil").lean()
      : [];
    const sellersById = new Map(sellers.map((seller) => [String(seller._id), seller]));

    const productEntries = products
      .filter((product) => {
        const seller = sellersById.get(String(product.userId));
        return !seller || getSellerAccessState(seller).hasAccess;
      })
      .map((product) => ({
        url: `${siteUrl}/product/${product._id}`,
        lastModified: product.updatedAt || (product.date ? new Date(product.date) : new Date()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const storeEntries = [...new Set(
      products
        .filter((product) => {
          const seller = sellersById.get(String(product.userId));
          return seller && getSellerAccessState(seller).hasAccess;
        })
        .map((product) => String(product.userId))
    )].map((sellerId) => ({
      url: `${siteUrl}/store/${sellerId}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticEntries, ...storeEntries, ...productEntries];
  } catch {
    // A temporary database failure should not make the core site pages disappear
    // from the sitemap response.
    return staticEntries;
  }
}
