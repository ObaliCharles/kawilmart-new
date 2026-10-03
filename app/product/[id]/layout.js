import { getStorefrontProductById } from "@/lib/getStorefrontProducts";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "";

const escapeJsonForHtml = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export async function generateMetadata({ params }) {
    const { id } = await params;
    const product = await getStorefrontProductById(id).catch(() => null);

    if (!product) {
        return {
            title: "Product unavailable | Wilwa",
            description: "This Wilwa product is currently unavailable.",
            robots: { index: false, follow: false },
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

export default async function ProductLayout({ children, params }) {
    const { id } = await params;
    const product = await getStorefrontProductById(id).catch(() => null);

    if (!product) {
        return children;
    }

    const images = (Array.isArray(product.image) ? product.image : [product.image])
        .filter((image) => typeof image === "string" && image.trim());
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const reviewAverage = Number(product.averageRating) || (reviews.length
        ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length
        : 0);
    const inStock = product.stock === null || product.stock === undefined || Number(product.stock) > 0;
    const productUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/product/${id}` : undefined;
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: String(product.description || "").slice(0, 5000),
        ...(images.length ? { image: images } : {}),
        ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
        ...(productUrl ? { url: productUrl } : {}),
        offers: {
            "@type": "Offer",
            priceCurrency: "UGX",
            price: Number(product.offerPrice) || Number(product.price),
            availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
            ...(productUrl ? { url: productUrl } : {}),
            seller: {
                "@type": "Organization",
                name: product.sellerProfile?.name || "Wilwa Seller",
            },
        },
        ...(reviews.length && reviewAverage > 0 ? {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(reviewAverage.toFixed(1)),
                reviewCount: reviews.length,
                bestRating: 5,
                worstRating: 1,
            },
        } : {}),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonForHtml(schema) }} />
            {children}
        </>
    );
}
