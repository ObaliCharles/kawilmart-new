import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import authSeller from "@/lib/authSeller";
import { parseProductStockInput } from "@/lib/productStock";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import { parseTagsInput } from "@/lib/parseTagsInput";
import { NextResponse } from "next/server";
import Product from "@/models/Product";
import User from "@/models/User";

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
        if (isAdmin) {
            existingProduct.tags = await parseTagsInput(formData);
        }

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
