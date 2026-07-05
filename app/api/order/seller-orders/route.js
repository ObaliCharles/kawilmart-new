import { clerkClient } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { getUserRole } from "@/lib/userRoleCache";
import {
  createAssignmentNotification,
  createPaymentNotification,
  createPaymentTrackingEvent,
  createRiderAssignmentTrackingEvent,
  createStatusNotification,
  createStatusTrackingEvent,
} from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";
import { serializeSellerOrder } from "@/lib/orderSerialization";
import {
  ORDER_STATUSES,
  RIDER_ASSIGNMENT_STATUSES,
} from "@/lib/orderLifecycle";
import {
  applyOrderStatusTransition,
  assignRiderToOrder,
  formatShortOrderId,
} from "@/lib/orderWorkflow";

const toDisplayName = (clerkUser) => {
  const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
  return fullName || clerkUser.emailAddresses[0]?.emailAddress || "Rider";
};

const getRiderNotification = (title, message) => ({
  type: "order",
  title,
  message,
  read: false,
  date: new Date(),
});

const buildSerializedOrder = (order, riderMap) => (
  serializeSellerOrder({
    order,
    rider: riderMap.get(String(order?.riderId || "")) || null,
  })
);

export async function GET(request) {
  try {
    const userId = await getRequestUserId(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();

    const orders = await Order.find({ sellerId: userId })
      .populate({
        path: "items.product",
        model: Product,
      })
      .populate({
        path: "address",
        model: Address,
      })
      .sort({ date: -1 })
      .lean();

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 100 });
    const riderAccounts = clerkUsers.data.filter((account) => {
      const role = account.publicMetadata?.role || account.metadata?.role;
      return role === "rider" || role === "admin";
    });
    const riderIds = riderAccounts.map((account) => account.id);

    const riderUsers = riderIds.length
      ? await User.find({ _id: { $in: riderIds } })
        .select("_id phoneNumber riderAvailability")
        .lean()
      : [];

    const riderUserMap = new Map(riderUsers.map((rider) => [String(rider._id), rider]));
    const riderMap = new Map(
      riderAccounts.map((account) => {
        const riderDoc = riderUserMap.get(account.id);
        return [account.id, {
          id: account.id,
          _id: account.id,
          name: toDisplayName(account),
          email: account.emailAddresses[0]?.emailAddress || "",
          imageUrl: account.imageUrl,
          phoneNumber: riderDoc?.phoneNumber || "",
          riderAvailability: riderDoc?.riderAvailability || "available",
        }];
      })
    );

    const riders = Array.from(riderMap.values())
      .map((rider) => ({
        ...rider,
        isAvailable: rider.riderAvailability === "available",
      }))
      .sort((leftRider, rightRider) => {
        if (leftRider.isAvailable !== rightRider.isAvailable) {
          return leftRider.isAvailable ? -1 : 1;
        }

        return leftRider.name.localeCompare(rightRider.name);
      });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => buildSerializedOrder(order, riderMap)),
      riders,
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}

export async function PUT(request) {
  try {
    const userId = await getRequestUserId(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const { orderId, riderId, paymentStatus, status } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, sellerId: userId })
      .populate({ path: "items.product", model: Product })
      .populate({ path: "address", model: Address });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const previousRiderId = order.riderId || "";
    const previousAssignmentStatus = order.riderAssignmentStatus;
    const previousPaymentStatus = order.paymentStatus || "Pending";
    const validPaymentStatuses = Order.schema.path("paymentStatus")?.enumValues || ["Pending", "Paid", "Failed"];
    const customerNotifications = [];
    const outboundNotifications = [];
    const touchedDocs = [];
    const updatedFields = [];
    let riderMap = new Map();

    if (riderId !== undefined) {
      const nextRiderId = String(riderId || "").trim();

      if (nextRiderId) {
        const riderRole = await getUserRole(nextRiderId);
        if (riderRole !== "rider" && riderRole !== "admin") {
          return NextResponse.json({ success: false, message: "Selected user is not a rider" }, { status: 400 });
        }

        const riderUser = await User.findById(nextRiderId).select("_id name phoneNumber riderAvailability imageUrl");
        if (!riderUser) {
          return NextResponse.json({ success: false, message: "Selected rider is unavailable" }, { status: 400 });
        }

        if (riderUser.riderAvailability === "busy" && nextRiderId !== previousRiderId) {
          return NextResponse.json({ success: false, message: "Selected rider is currently busy" }, { status: 400 });
        }

        riderMap.set(String(riderUser._id), riderUser.toObject());

        const assignmentResult = assignRiderToOrder({ order, riderId: nextRiderId });
        if (assignmentResult.changed) {
          if (previousRiderId && previousRiderId !== nextRiderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
            const previousRiderUser = await User.findById(previousRiderId).select("_id riderAvailability");
            if (previousRiderUser) {
              previousRiderUser.riderAvailability = "available";
              touchedDocs.push(previousRiderUser);
            }
          }

          if (previousRiderId && previousRiderId !== nextRiderId) {
            outboundNotifications.push({
              userId: previousRiderId,
              notification: getRiderNotification(
                "Delivery reassigned",
                `Order #${formatShortOrderId(order._id)} is no longer assigned to you.`
              ),
              emailTitle: `Delivery reassigned: #${formatShortOrderId(order._id)}`,
              emailMessage: `Order #${formatShortOrderId(order._id)} was reassigned to another rider.`,
              ctaLabel: "Open rider dashboard",
              ctaPath: "/dashboard/rider",
            });
          }

          order.trackingEvents = [
            ...(order.trackingEvents || []),
            createRiderAssignmentTrackingEvent({ assigned: true }),
          ];

          customerNotifications.push(createAssignmentNotification(order._id, true));
          outboundNotifications.push({
            userId: nextRiderId,
            notification: getRiderNotification(
              "New delivery assigned",
              `Order #${formatShortOrderId(order._id)} has been assigned to you. Accept it from your rider dashboard to unlock contact details.`
            ),
            emailTitle: `New delivery assigned: #${formatShortOrderId(order._id)}`,
            emailMessage: `Order #${formatShortOrderId(order._id)} has been assigned to you. Open your rider dashboard to accept or decline the job.`,
            ctaLabel: "Open rider dashboard",
            ctaPath: "/dashboard/rider",
          });
          updatedFields.push("rider");
        }
      } else {
        const assignmentResult = assignRiderToOrder({ order, riderId: "" });
        if (assignmentResult.changed) {
          if (previousRiderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
            const previousRiderUser = await User.findById(previousRiderId).select("_id riderAvailability");
            if (previousRiderUser) {
              previousRiderUser.riderAvailability = "available";
              touchedDocs.push(previousRiderUser);
            }
          }

          if (previousRiderId) {
            outboundNotifications.push({
              userId: previousRiderId,
              notification: getRiderNotification(
                "Delivery removed",
                `Order #${formatShortOrderId(order._id)} is no longer assigned to you.`
              ),
              emailTitle: `Delivery removed: #${formatShortOrderId(order._id)}`,
              emailMessage: `Order #${formatShortOrderId(order._id)} was removed from your delivery queue.`,
              ctaLabel: "Open rider dashboard",
              ctaPath: "/dashboard/rider",
            });
          }

          order.trackingEvents = [
            ...(order.trackingEvents || []),
            createRiderAssignmentTrackingEvent({ assigned: false }),
          ];
          customerNotifications.push(createAssignmentNotification(order._id, false));
          updatedFields.push("rider");
        }
      }
    }

    if (typeof status === "string" && status.trim()) {
      const transition = applyOrderStatusTransition({
        order,
        nextStatus: status,
        actorRole: "seller",
      });

      if (transition.changed) {
        order.trackingEvents = [
          ...(order.trackingEvents || []),
          createStatusTrackingEvent(transition.nextStatus),
        ];
        customerNotifications.push(createStatusNotification(transition.nextStatus, order._id));
        updatedFields.push("status");

        if (transition.nextStatus === ORDER_STATUSES.READY && order.riderId) {
          outboundNotifications.push({
            userId: order.riderId,
            notification: getRiderNotification(
              "Order ready for pickup",
              `Order #${formatShortOrderId(order._id)} is packed and ready for pickup.`
            ),
            emailTitle: `Order ready for pickup: #${formatShortOrderId(order._id)}`,
            emailMessage: `Order #${formatShortOrderId(order._id)} is ready for pickup. Open your rider dashboard to continue the delivery flow.`,
            ctaLabel: "Open rider dashboard",
            ctaPath: "/dashboard/rider",
          });
        }

        if ([ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED].includes(transition.nextStatus) && order.riderId) {
          outboundNotifications.push({
            userId: order.riderId,
            notification: getRiderNotification(
              transition.nextStatus === ORDER_STATUSES.CANCELLED ? "Delivery cancelled" : "Delivery closed",
              `Order #${formatShortOrderId(order._id)} is no longer active for delivery.`
            ),
            emailTitle: `${transition.nextStatus === ORDER_STATUSES.CANCELLED ? "Delivery cancelled" : "Delivery closed"}: #${formatShortOrderId(order._id)}`,
            emailMessage: `Order #${formatShortOrderId(order._id)} is no longer active for delivery after a seller status update.`,
            ctaLabel: "Open rider dashboard",
            ctaPath: "/dashboard/rider",
          });
        }

        if (transition.nextStatus === ORDER_STATUSES.FAILED && order.riderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
          const currentRiderUser = await User.findById(order.riderId).select("_id riderAvailability");
          if (currentRiderUser) {
            currentRiderUser.riderAvailability = "available";
            touchedDocs.push(currentRiderUser);
          }
        }
      }
    }

    if (paymentStatus !== undefined) {
      const normalizedPaymentStatus = typeof paymentStatus === "string" ? paymentStatus.trim() : "";

      if (!validPaymentStatuses.includes(normalizedPaymentStatus)) {
        return NextResponse.json({
          success: false,
          message: `Invalid payment status. Allowed values: ${validPaymentStatuses.join(", ")}`,
        }, { status: 400 });
      }

      if (normalizedPaymentStatus !== previousPaymentStatus) {
        order.paymentStatus = normalizedPaymentStatus;
        order.trackingEvents = [
          ...(order.trackingEvents || []),
          createPaymentTrackingEvent(normalizedPaymentStatus),
        ];
        customerNotifications.push(createPaymentNotification(normalizedPaymentStatus, order._id));
        updatedFields.push("payment");
      }
    }

    if (updatedFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No order changes were made",
        order: buildSerializedOrder(order.toObject(), riderMap),
      });
    }

    await Promise.all([
      order.save(),
      ...touchedDocs.map((doc) => doc.save()),
    ]);

    if (customerNotifications.length > 0) {
      outboundNotifications.push(
        ...customerNotifications.map((notification) => ({
          userId: order.userId,
          notification,
          emailTitle: notification.title,
          emailMessage: notification.message,
          ctaLabel: "Track order",
          ctaPath: "/my-orders",
        }))
      );
    }

    if (outboundNotifications.length > 0) {
      await notifyUsers(outboundNotifications);
    }

    const orderForResponse = await Order.findById(order._id)
      .populate({ path: "items.product", model: Product })
      .populate({ path: "address", model: Address })
      .lean();

    if (orderForResponse?.riderId && !riderMap.has(String(orderForResponse.riderId))) {
      const riderUser = await User.findById(orderForResponse.riderId).select("_id name phoneNumber riderAvailability imageUrl").lean();
      if (riderUser) {
        riderMap.set(String(riderUser._id), riderUser);
      }
    }

    return NextResponse.json({
      success: true,
      message: updatedFields.length > 1
        ? "Order updated successfully"
        : updatedFields[0] === "payment"
          ? "Payment status updated successfully"
          : updatedFields[0] === "rider"
            ? (orderForResponse?.riderId ? "Rider assigned successfully" : "Rider removed successfully")
            : "Order status updated successfully",
      order: buildSerializedOrder(orderForResponse, riderMap),
    });
  } catch (error) {
    console.error("Error updating seller order:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
