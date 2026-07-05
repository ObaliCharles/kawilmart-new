import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address"; // Import so Mongoose registers the model
import User from "@/models/User";
import { serializeCustomerOrder } from "@/lib/orderSerialization";

export async function GET(request) {
  try {
    // Get the logged-in userId
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch orders for this user and populate product and address details
    const orders = await Order.find({ userId })
      .populate({
        path: "items.product",
        model: Product // ensures correct model reference
      })
      .populate({
        path: "address",
        model: Address // ensures correct model reference
      })
      .sort({ date: -1 })
      .lean();

    const relatedUserIds = [...new Set(
      orders.flatMap((order) => [order.sellerId, order.riderId].filter(Boolean))
    )];

    const relatedUsers = relatedUserIds.length
      ? await User.find({ _id: { $in: relatedUserIds } })
        .select("_id name phoneNumber businessName businessLocation imageUrl sellerRatingSummary")
        .lean()
      : [];

    const relatedUsersMap = new Map(relatedUsers.map((account) => [String(account._id), account]));

    const serializedOrders = orders.map((order) => {
      const seller = relatedUsersMap.get(String(order.sellerId));
      const rider = order.riderId ? relatedUsersMap.get(String(order.riderId)) : null;
      const firstProduct = order.items.find((item) => item.product)?.product || null;

      return serializeCustomerOrder({
        order,
        seller,
        rider,
        productFallback: firstProduct,
      });
    });

    return NextResponse.json({ success: true, orders: serializedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
