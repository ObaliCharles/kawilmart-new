import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import authSeller from "@/lib/authSeller";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { getRequestUserId } from "@/lib/requestAuth";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
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

        const { productId } = await request.json();

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
                    message: access.reason || "Seller access is inactive. Renew subscription to manage products.",
                }, { status: 403 });
            }
        }

        const deletedProduct = await Product.findOneAndDelete({ _id: productId, userId });

        if (!deletedProduct) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
