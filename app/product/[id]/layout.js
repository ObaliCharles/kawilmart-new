import { getStorefrontProductById } from "@/lib/getStorefrontProducts";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const product = await getStorefrontProductById(id).catch(() => null);

    if (!product) {
        return {
            title: "Product unavailable | Wilwa",
            description: "This Wilwa product is currently unavailable.",
        };
    }

    const title = `${product.name} | Wilwa`;
    const description = String(product.description || `Shop ${product.name} on Wilwa.`).slice(0, 155);
    const image = Array.isArray(product.image) ? product.image[0] : product.image;
    const url = siteUrl ? `${siteUrl.replace(/\/$/, "")}/product/${id}` : undefined;

    return {
        title,
        description,
        alternates: url ? { canonical: url } : undefined,
        openGraph: {
            title,
            description,
            type: "website",
            url,
            images: image ? [{ url: image, alt: product.name }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export default function ProductLayout({ children }) {
    return children;
}
