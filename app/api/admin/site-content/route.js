import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import { resolveSiteContent } from "@/lib/defaultSiteContent";
import { getRequestUserId } from "@/lib/requestAuth";
import SiteContent from "@/models/SiteContent";
import { NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isUploadedFile = (file) =>
    file && typeof file.arrayBuffer === "function" && typeof file.size === "number" && file.size > 0;

const uploadFileToCloudinary = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};

const getOrCreateSiteContent = async () => {
    const existing = await SiteContent.findOne({ key: "homepage" });
    if (existing) {
        return existing;
    }

    return SiteContent.create({ key: "homepage" });
};

const readImageUrl = async (formData, fallback = "") => {
    const file = formData.get("image");
    if (isUploadedFile(file)) {
        const uploadResult = await uploadFileToCloudinary(file);
        return uploadResult.secure_url;
    }

    const imageUrl = formData.get("imageUrl");
    return typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : fallback;
};

const respondWithContent = (content, message) => {
    const plainContent = JSON.parse(JSON.stringify(content));
    return NextResponse.json({
        success: true,
        message,
        content: resolveSiteContent(plainContent),
    });
};

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const content = await SiteContent.findOne({ key: "homepage" }).lean();

        return NextResponse.json({
            success: true,
            content: resolveSiteContent(content),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const formData = await request.formData();
        const action = formData.get("action");
        const siteContent = await getOrCreateSiteContent();

        if (action === "upsertHeroSlide") {
            const slideId = formData.get("itemId");
            const existingSlide = slideId
                ? siteContent.heroSlides.find((slide) => String(slide._id) === String(slideId))
                : null;

            const nextSlide = {
                title: formData.get("title")?.toString() || "",
                offer: formData.get("offer")?.toString() || "",
                imageUrl: await readImageUrl(formData, existingSlide?.imageUrl || ""),
                primaryButtonText: formData.get("primaryButtonText")?.toString() || "Shop Now",
                secondaryButtonText: formData.get("secondaryButtonText")?.toString() || "Explore Deals",
                linkType: formData.get("linkType")?.toString() || "",
                category: formData.get("category")?.toString() || "",
                storeId: formData.get("storeId")?.toString() || "",
                productId: formData.get("productId")?.toString() || "",
                primaryHref: formData.get("primaryHref")?.toString() || "",
                secondaryHref: formData.get("secondaryHref")?.toString() || "/all-products?filter=flash",
            };

            if (existingSlide) {
                Object.assign(existingSlide, nextSlide);
            } else {
                siteContent.heroSlides.push(nextSlide);
            }

            await siteContent.save();
            return respondWithContent(siteContent, "Hero slide saved successfully");
        }

        if (action === "deleteHeroSlide") {
            const itemId = formData.get("itemId")?.toString();
            siteContent.heroSlides = siteContent.heroSlides.filter((slide) => String(slide._id) !== itemId);
            await siteContent.save();
            return respondWithContent(siteContent, "Hero slide deleted");
        }

        if (action === "upsertFeaturedCard") {
            const itemId = formData.get("itemId");
            const existingCard = itemId
                ? siteContent.featuredCards.find((card) => String(card._id) === String(itemId))
                : null;

            const nextCard = {
                title: formData.get("title")?.toString() || "",
                description: formData.get("description")?.toString() || "",
                imageUrl: await readImageUrl(formData, existingCard?.imageUrl || ""),
                buttonText: formData.get("buttonText")?.toString() || "Buy now",
                linkType: formData.get("linkType")?.toString() || "",
                category: formData.get("category")?.toString() || "",
                storeId: formData.get("storeId")?.toString() || "",
                productId: formData.get("productId")?.toString() || "",
                href: formData.get("href")?.toString() || "",
            };

            if (existingCard) {
                Object.assign(existingCard, nextCard);
            } else {
                siteContent.featuredCards.push(nextCard);
            }

            await siteContent.save();
            return respondWithContent(siteContent, "Featured card saved successfully");
        }

        if (action === "deleteFeaturedCard") {
            const itemId = formData.get("itemId")?.toString();
            siteContent.featuredCards = siteContent.featuredCards.filter((card) => String(card._id) !== itemId);
            await siteContent.save();
            return respondWithContent(siteContent, "Featured card deleted");
        }

        if (action === "savePromoBanner") {
            siteContent.promoBanner = {
                title: formData.get("title")?.toString() || "",
                description: formData.get("description")?.toString() || "",
                imageUrl: await readImageUrl(formData, siteContent.promoBanner?.imageUrl || ""),
                buttonText: formData.get("buttonText")?.toString() || "Buy now",
                linkType: formData.get("linkType")?.toString() || "",
                category: formData.get("category")?.toString() || "",
                storeId: formData.get("storeId")?.toString() || "",
                productId: formData.get("productId")?.toString() || "",
                href: formData.get("href")?.toString() || "",
            };

            await siteContent.save();
            return respondWithContent(siteContent, "Promo banner updated successfully");
        }

        if (action === "upsertPromoBanner") {
            const itemId = formData.get("itemId");
            const existingBanner = itemId
                ? siteContent.promoBanners.find((banner) => String(banner._id) === String(itemId))
                : null;

            const nextBanner = {
                title: formData.get("title")?.toString() || "",
                description: formData.get("description")?.toString() || "",
                imageUrl: await readImageUrl(formData, existingBanner?.imageUrl || ""),
                buttonText: formData.get("buttonText")?.toString() || "Buy now",
                linkType: formData.get("linkType")?.toString() || "",
                category: formData.get("category")?.toString() || "",
                storeId: formData.get("storeId")?.toString() || "",
                productId: formData.get("productId")?.toString() || "",
                href: formData.get("href")?.toString() || "",
            };

            if (existingBanner) {
                Object.assign(existingBanner, nextBanner);
            } else {
                siteContent.promoBanners.push(nextBanner);
            }

            siteContent.promoBanner = siteContent.promoBanners[0] || siteContent.promoBanner;
            await siteContent.save();
            return respondWithContent(siteContent, "Promo offer saved successfully");
        }

        if (action === "deletePromoBanner") {
            const itemId = formData.get("itemId")?.toString();
            siteContent.promoBanners = siteContent.promoBanners.filter((banner) => String(banner._id) !== itemId);
            siteContent.promoBanner = siteContent.promoBanners[0] || siteContent.promoBanner;
            await siteContent.save();
            return respondWithContent(siteContent, "Promo offer deleted");
        }

        if (action === "saveNewsletter") {
            siteContent.newsletter = {
                title: formData.get("title")?.toString() || "",
                description: formData.get("description")?.toString() || "",
                buttonText: formData.get("buttonText")?.toString() || "Subscribe",
            };

            await siteContent.save();
            return respondWithContent(siteContent, "Newsletter content updated successfully");
        }

        return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
