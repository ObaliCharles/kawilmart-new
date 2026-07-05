import connectDB from "@/config/db";
import Address from "@/models/Address";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  DEFAULT_COMMISSION_RATE,
  DELIVERY_MODES,
  ORDER_STATUSES,
  RIDER_ASSIGNMENT_STATUSES,
  buildOrderFinancials,
  calculateDeliveryFee,
  getDeliveryModeLabel,
  normalizeDeliveryMode,
} from "@/lib/orderLifecycle";
import { getProductStockSnapshot } from "@/lib/productStock";
import { getRequestUserId } from "@/lib/requestAuth";
import { getSellerAccessState } from "@/lib/sellerBilling";
import { NextResponse } from "next/server";
import { inngest } from "@/config/inngest";
import {
  createSellerOrderPlacedNotification,
  createStatusTrackingEvent,
} from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";

const sendOrderEvents = (createdOrders, userId, address) => {
  return Promise.allSettled(
    createdOrders.map((order) =>
      inngest.send({
        name: "order/created",
        data: {
          orderId: order._id.toString(),
          userId,
          sellerId: order.sellerId,
          items: order.items,
          address,
          amount: order.amount,
          date: order.date,
        },
      })
    )
  ).catch((error) => {
    console.error("Failed to queue order event(s):", error);
  });
};

const formatCurrency = (amount) => `UGX ${Number(amount || 0).toLocaleString("en-UG")}`;

export async function POST(request) {
  const reservedStockAdjustments = [];

  try {
    await connectDB();
    const userId = await getRequestUserId(request);
    const { address, items, deliveryMode } = await request.json();

    if (!userId) return NextResponse.json({ success: false, message: "No userId found" });
    if (!address) return NextResponse.json({ success: false, message: "No address provided" });
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty" });
    }

    const normalizedDeliveryMode = normalizeDeliveryMode(deliveryMode);

    const addressDoc = await Address.findById(address);
    if (!addressDoc) {
      return NextResponse.json({ success: false, message: "Selected address not found" });
    }

    const sellerOrders = new Map();
    const sellerAccessCache = new Map();
    const stockAdjustments = new Map();

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }

      const product = await Product.findById(item.product);
      if (!product) continue;

      const sellerId = String(product.userId || "");
      if (!sellerId) {
        continue;
      }

      if (!sellerAccessCache.has(sellerId)) {
        const seller = await User.findById(sellerId)
          .select("_id sellerSubscriptionStatus sellerSubscriptionNextBillingDate sellerAccessUntil")
          .lean();

        sellerAccessCache.set(
          sellerId,
          seller ? getSellerAccessState(seller) : { hasAccess: false, reason: "Seller account is unavailable." }
        );
      }

      const sellerAccess = sellerAccessCache.get(sellerId);
      if (!sellerAccess?.hasAccess) {
        return NextResponse.json({
          success: false,
          message: `${product.name} is unavailable. ${sellerAccess?.reason || "Seller account is paused or inactive."}`,
        }, { status: 409 });
      }

      const stockSnapshot = getProductStockSnapshot(product);
      const reservedStock = stockAdjustments.get(String(product._id)) || 0;

      if (stockSnapshot.hasTrackedStock) {
        const remainingStock = Math.max(0, (stockSnapshot.value || 0) - reservedStock);

        if (remainingStock <= 0) {
          return NextResponse.json({
            success: false,
            message: `${product.name} is currently out of stock`,
          }, { status: 409 });
        }

        if (quantity > remainingStock) {
          return NextResponse.json({
            success: false,
            message: `Only ${remainingStock} item${remainingStock === 1 ? "" : "s"} left for ${product.name}`,
          }, { status: 409 });
        }

        stockAdjustments.set(String(product._id), reservedStock + quantity);
      }

      const price = product.offerPrice || product.price || 0;

      if (!sellerId || price <= 0) {
        continue;
      }

      const sellerBucket = sellerOrders.get(sellerId) || {
        sellerId,
        subtotal: 0,
        items: [],
        sellerLocation: product.sellerLocation || product.location || "",
      };

      sellerBucket.subtotal += price * quantity;
      sellerBucket.items.push({
        product: product._id.toString(),
        quantity,
        price,
      });

      sellerOrders.set(sellerId, sellerBucket);
    }

    const orderPayloads = Array.from(sellerOrders.values())
      .filter(({ items: groupedItems, subtotal, sellerId }) =>
        sellerId && groupedItems.length > 0 && subtotal > 0
      )
      .map(({ sellerId, items: groupedItems, subtotal, sellerLocation }) => {
        const deliveryFee = calculateDeliveryFee({
          deliveryMode: normalizedDeliveryMode,
          sellerLocation,
          address: addressDoc,
        });
        const financials = buildOrderFinancials({
          subtotal,
          deliveryFee,
          commissionRate: DEFAULT_COMMISSION_RATE,
        });

        return {
          userId,
          sellerId,
          items: groupedItems,
          subtotal: financials.subtotal,
          amount: financials.amount,
          deliveryFee: financials.deliveryFee,
          commissionRate: financials.commissionRate,
          commissionAmount: financials.commissionAmount,
          address,
          deliveryMode: normalizedDeliveryMode,
          deliveryRequired: normalizedDeliveryMode === DELIVERY_MODES.DELIVERY,
          riderAssignmentStatus: RIDER_ASSIGNMENT_STATUSES.UNASSIGNED,
          customerPhone: addressDoc.phoneNumber || "",
          status: ORDER_STATUSES.PLACED,
          trackingEvents: [createStatusTrackingEvent(ORDER_STATUSES.PLACED)],
          date: Date.now(),
        };
      });

    if (orderPayloads.length === 0) {
      return NextResponse.json({ success: false, message: "No valid products found" });
    }

    for (const [productId, reservedQuantity] of stockAdjustments.entries()) {
      const result = await Product.updateOne(
        { _id: productId, stock: { $gte: reservedQuantity } },
        { $inc: { stock: -reservedQuantity } }
      );

      if (result.modifiedCount !== 1) {
        await Promise.all(
          reservedStockAdjustments.map(([reservedProductId, quantityReserved]) =>
            Product.updateOne(
              { _id: reservedProductId },
              { $inc: { stock: quantityReserved } }
            )
          )
        );

        return NextResponse.json({
          success: false,
          message: "Some items changed stock while you were checking out. Please review your cart and try again.",
        }, { status: 409 });
      }

      reservedStockAdjustments.push([productId, reservedQuantity]);
    }

    const createdOrders = await Order.create(orderPayloads);
    reservedStockAdjustments.length = 0;
    const totalItems = createdOrders.reduce(
      (sum, order) => sum + order.items.reduce((orderSum, item) => orderSum + item.quantity, 0),
      0
    );

    await User.findByIdAndUpdate(userId, {
      $set: { cartItems: {} },
    });

    const totalAmount = createdOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const totalDeliveryFee = createdOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const customerName = addressDoc.fullName || "Customer";

    const customerNotificationEntry = {
      userId,
      notification: {
        type: "order",
        title: createdOrders.length > 1 ? "Orders placed successfully" : "Order placed successfully",
        message: `Your order for ${totalItems} item${totalItems === 1 ? "" : "s"} totaling ${formatCurrency(totalAmount)} has been received.`,
        read: false,
        date: new Date(),
      },
      emailTitle: createdOrders.length > 1 ? "Your KawilMart orders were placed" : "Your KawilMart order was placed",
      emailMessage: `We received your ${getDeliveryModeLabel(normalizedDeliveryMode)} order for ${totalItems} item${totalItems === 1 ? "" : "s"} totaling ${formatCurrency(totalAmount)}. You can track progress from your orders page.`,
      ctaLabel: "Track my order",
      ctaPath: "/my-orders",
      emailDetails: [
        { label: "orders", value: String(createdOrders.length) },
        { label: "items", value: String(totalItems) },
        { label: "total", value: formatCurrency(totalAmount) },
        { label: "delivery_fee", value: formatCurrency(totalDeliveryFee) },
      ],
    };

    const sellerNotificationEntries = createdOrders
      .filter((order) => order?.sellerId)
      .map((order) => {
        const sellerItemCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const shortOrderId = String(order._id).slice(-8).toUpperCase();
        const sellerTotal = formatCurrency(order.amount);
        const sellerNotification = createSellerOrderPlacedNotification({
          orderId: order._id,
          customerName,
          totalItems: sellerItemCount,
          totalAmount: sellerTotal,
        });

        return {
          userId: order.sellerId,
          notification: sellerNotification,
          emailTitle: `New customer order: #${shortOrderId}`,
          emailMessage: `${customerName} placed order #${shortOrderId} for ${sellerItemCount} item${sellerItemCount === 1 ? "" : "s"} totaling ${sellerTotal}. Open your seller dashboard to review and fulfill it.`,
          ctaLabel: "Open seller orders",
          ctaPath: "/seller/orders",
          emailDetails: [
            { label: "order_id", value: `#${shortOrderId}` },
            { label: "customer", value: customerName },
            { label: "items", value: String(sellerItemCount) },
            { label: "total", value: sellerTotal },
          ],
        };
      });

    await notifyUsers([customerNotificationEntry, ...sellerNotificationEntries]);

    void sendOrderEvents(createdOrders, userId, address);

    return NextResponse.json({
      success: true,
      message: createdOrders.length > 1 ? "Orders placed successfully" : "Order placed successfully",
      orderCount: createdOrders.length,
      deliveryMode: normalizedDeliveryMode,
    });
  } catch (error) {
    if (reservedStockAdjustments.length) {
      await Promise.allSettled(
        reservedStockAdjustments.map(([productId, reservedQuantity]) =>
          Product.updateOne(
            { _id: productId },
            { $inc: { stock: reservedQuantity } }
          )
        )
      );
    }

    console.error("Order API error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
