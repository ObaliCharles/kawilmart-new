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

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);

        const [isSeller, isAdmin] = await Promise.all([
            authSeller(userId),
            authAdmin(userId),
        ]);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        await connectDB();

        if (!isAdmin) {
            const seller = await User.findById(userId).lean();
            const access = getSellerAccessState(seller);

            if (!access.hasAccess) {
                return NextResponse.json({
                    success: false,
                    message: access.reason || 'Seller access is inactive. Renew subscription to add products.',
                }, { status: 403 });
            }
        }

        const formData = await request.formData();

        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const stock = parseProductStockInput(formData.get('stock'));
        const location = formData.get('location');
        const sellerContact = formData.get('sellerContact');
        const sellerLocation = formData.get('sellerLocation');

        const files = formData.getAll('images');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'no files uploaded' });
        }

        const result = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto' },
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
            })
        );

        const image = result.map((r) => r.secure_url);

        const newProduct = await Product.create({
            userId,
            name,
            description,
            category,
            price: Number(price),
            offerPrice: Number(offerPrice),
            stock,
            image,
            location,
            sellerContact,
            sellerLocation,
            date: Date.now(),
        });

        return NextResponse.json({
            success: true,
            message: 'upload successful',
            newProduct,
        });

    } catch (error) {
        //  fixed: ensure correct use of NextResponse.json (no “new” keyword)
        return NextResponse.json({ success: false, message: error.message });
    }
}
