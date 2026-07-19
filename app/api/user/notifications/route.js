import connectDB from "@/config/db";
import { sanitizeApiErrorMessage } from "@/lib/apiErrors";
import { getOrSyncDatabaseUser } from "@/lib/clerkUserSync";
import { getRequestUserId } from "@/lib/requestAuth";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request)
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" })
        }

        const user = await getOrSyncDatabaseUser(userId, { select: "notifications", lean: true })

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" })
        }

        const { searchParams } = new URL(request.url)
        const limit = Math.max(0, Number(searchParams.get("limit")) || 0)
        const allNotifications = user.notifications || []
        const unreadCount = allNotifications.filter((notification) => !notification.read).length
        const notifications = [...allNotifications].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        return NextResponse.json({
            success: true,
            notifications: limit ? notifications.slice(0, limit) : notifications,
            unreadCount,
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: sanitizeApiErrorMessage(error?.message, "Unable to load notifications"),
        })
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request)
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" })
        }

        const { notificationId, markAllRead = false } = await request.json()

        const user = await getOrSyncDatabaseUser(userId, { select: "_id" })

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" })
        }

        await connectDB()

        if (markAllRead) {
            await User.findByIdAndUpdate(userId, {
                $set: { 'notifications.$[elem].read': true }
            }, {
                arrayFilters: [{ 'elem.read': false }]
            })
        } else {
            if (!notificationId) {
                return NextResponse.json({ success: false, message: "Notification ID is required" }, { status: 400 })
            }

            await User.findByIdAndUpdate(userId, {
                $set: { 'notifications.$[elem].read': true }
            }, {
                arrayFilters: [{ 'elem._id': notificationId }]
            })
        }

        const updatedUser = await User.findById(userId).select('notifications')
        const unreadCount = (updatedUser?.notifications || []).filter((notification) => !notification.read).length

        return NextResponse.json({
            success: true,
            message: markAllRead ? "All inbox messages marked as read" : "Inbox message marked as read",
            unreadCount,
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: sanitizeApiErrorMessage(error?.message, "Unable to update notifications"),
        })
    }
}
