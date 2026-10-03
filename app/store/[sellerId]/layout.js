import connectDB from "@/config/db";
import User from "@/models/User";
import Product from "@/models/Product";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

const activeProductQuery = {
  $or: [
    { productStatus: "active" },
    { productStatus: { $exists: false } },
    { productStatus: "" },
    { productStatus: null },
  ],
};

export async function generateMetadata({ params }) {
  const { sellerId } = await params;

  try {
    await connectDB();
    const [seller, product] = await Promise.all([
      User.findById(sellerId)
        .select("name businessName businessLocation sellerDescription storeCoverImage storeAvatar sellerSubscriptionStatus sellerAccessUntil")
        .lean(),
      Product.findOne({ ...activeProductQuery, userId: sellerId }).select("_id").lean(),
    ]);

    if (!seller || !product || !getSellerAccessState(seller).hasAccess) {
      return { title: "Store unavailable | Wilwa", robots: { index: false, follow: false } };
    }

    const name = seller.businessName || seller.name || "Wilwa Store";
    const location = seller.businessLocation ? ` in ${seller.businessLocation}` : "";
    const description = String(seller.sellerDescription || `Shop ${name}${location} on Wilwa.`).slice(0, 155);
    const url = siteUrl ? `${siteUrl.replace(/\/$/, "")}/store/${sellerId}` : undefined;
    const image = seller.storeCoverImage || seller.storeAvatar || undefined;

    return {
      title: `${name} | Wilwa`,
      description,
      alternates: url ? { canonical: url } : undefined,
      openGraph: { title: `${name} | Wilwa`, description, url, type: "website", images: image ? [{ url: image, alt: name }] : undefined },
    };
  } catch {
    return { title: "Store | Wilwa", robots: { index: false, follow: false } };
  }
}

export default function StoreLayout({ children }) {
  return children;
}
