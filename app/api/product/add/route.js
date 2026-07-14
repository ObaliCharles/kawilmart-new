import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import authSeller from "@/lib/authSeller";
import { parseProductStockInput } from "@/lib/productStock";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { getRequestUserId } from "@/lib/requestAuth";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
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
            files.map((file) => uploadFileToCloudinary(file))
        );

        const image = result.map((r) => r.secure_url);
        const tags = isAdmin ? await parseTagsInput(formData) : [];

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
            tags,
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
