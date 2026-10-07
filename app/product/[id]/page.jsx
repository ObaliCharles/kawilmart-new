import { getStorefrontProductById } from "@/lib/getStorefrontProducts";
import ProductPageClient from "./ProductPageClient";

export const runtime = "nodejs";
// Product availability can change outside Next's data cache. Render the
// current public listing on each request, including for search crawlers.
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getStorefrontProductById(id).catch(() => null);

  return <ProductPageClient initialProduct={product} />;
}
