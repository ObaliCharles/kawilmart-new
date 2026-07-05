import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import authSeller from "@/lib/authSeller";
import { parseProductStockInput } from "@/lib/productStock";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { getRequestUserId } from "@/lib/requestAuth";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import Product from "@/models/Product";
import User from "@/models/User";

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

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const [isSeller, isAdmin] = await Promise.all([
            authSeller(userId),
            authAdmin(userId),
        ]);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const productId = formData.get("productId");

        if (!productId) {
            return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
        }

        await connectDB();

        if (!isAdmin) {
            const seller = await User.findById(userId).lean();
            const access = getSellerAccessState(seller);

            if (!access.hasAccess) {
                return NextResponse.json({
                    success: false,
                    message: access.reason || "Seller access is inactive. Renew subscription to update products.",
                }, { status: 403 });
            }
        }

        const existingProduct = await Product.findOne({ _id: productId, userId });
        if (!existingProduct) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        let existingImages = existingProduct.image || [];
        const existingImagesRaw = formData.get("existingImages");

        if (typeof existingImagesRaw === "string" && existingImagesRaw) {
            try {
                const parsedImages = JSON.parse(existingImagesRaw);
                if (Array.isArray(parsedImages)) {
                    existingImages = parsedImages;
                }
            } catch {
                existingImages = existingProduct.image || [];
            }
        }

        const nextImages = [...existingImages];

        for (let index = 0; index < 4; index += 1) {
            const file = formData.get(`image_${index}`);
            if (isUploadedFile(file)) {
                const uploadResult = await uploadFileToCloudinary(file);
                nextImages[index] = uploadResult.secure_url;
            }
        }

        const image = nextImages.filter(Boolean);

        if (!image.length) {
            return NextResponse.json({ success: false, message: "At least one product image is required" }, { status: 400 });
        }

        existingProduct.name = formData.get("name");
        existingProduct.description = formData.get("description");
        existingProduct.category = formData.get("category");
        existingProduct.price = Number(formData.get("price"));
        existingProduct.offerPrice = Number(formData.get("offerPrice"));
        existingProduct.stock = parseProductStockInput(formData.get("stock"));
        existingProduct.location = formData.get("location");
        existingProduct.sellerContact = formData.get("sellerContact");
        existingProduct.sellerLocation = formData.get("sellerLocation");
        existingProduct.image = image;

        await existingProduct.save();

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            product: existingProduct,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
