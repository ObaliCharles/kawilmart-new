import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import { syncUserFromClerk } from "@/lib/clerkUserSync";
import { notifyUsers } from "@/lib/notifyUsers";
import { getRequestUserId } from "@/lib/requestAuth";
import User from "@/models/User";
import {
    createSupportMessageRecord,
    isSupportMessage,
    serializeSupportMessage,
    sortMessagesByDate,
} from "@/lib/supportChat";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const ensureMessageThread = (user) => {
    if (!user) {
        return;
    }

    if (!Array.isArray(user.messages)) {
        user.messages = [];
    }
};

const inferSupportRole = (user = {}, isAdmin = false) => {
    if (isAdmin) {
        return "admin";
    }

    if (user?.businessName) {
        return "seller";
    }

    if (user?.vehicleType || user?.riderBaseLocation) {
        return "rider";
    }

    return "buyer";
};

const getSupportInboxPath = (role = "") => {
    if (role === "rider") {
        return "/admin/management?tab=rider";
    }

    if (role === "seller") {
        return "/admin/management?tab=seller";
    }

    return "/admin/management";
};

const getSupportParticipant = ({ isAdmin, targetUser = null }) => {
    if (isAdmin) {
        return {
            id: String(targetUser?._id || ""),
            name: targetUser?.businessName || targetUser?.name || "Account",
            email: targetUser?.email || "",
            imageUrl: targetUser?.imageUrl || "",
            isVerified: Boolean(targetUser?.isVerified),
            badgeLabel: targetUser?.sellerBadgeLabel || "",
            supportPriority: targetUser?.sellerSupportPriority || "standard",
        };
    }

    return {
        id: "support",
        name: "KawilMart Support",
        email: "",
        imageUrl: "",
        isVerified: true,
        badgeLabel: "Support",
        supportPriority: targetUser?.sellerSupportPriority || "standard",
    };
};

export async function GET(request) {
    try {
        const currentUserId = await getRequestUserId(request);
        if (!currentUserId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await authAdmin(currentUserId);
        const { searchParams } = new URL(request.url);
        const participantId = normalizeString(searchParams.get("participantId"));
        const targetUserId = isAdmin ? participantId : currentUserId;

        if (isAdmin && !targetUserId) {
            return NextResponse.json({
                success: true,
                message: "Select an account to open support chat",
                participant: null,
                messages: [],
                requiresParticipantSelection: true,
            });
        }

        if (!targetUserId) {
            return NextResponse.json({ success: false, message: "Select an account to open support chat" }, { status: 400 });
        }

        await connectDB();
        await Promise.allSettled([syncUserFromClerk(currentUserId), syncUserFromClerk(targetUserId)]);

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return NextResponse.json({ success: false, message: "Support thread not found" }, { status: 404 });
        }

        ensureMessageThread(targetUser);

        let messagesChanged = false;
        const supportMessages = sortMessagesByDate(
            (targetUser.messages || []).filter((message) => isSupportMessage(message, targetUserId))
        ).map((message) => {
            const isIncomingForViewer = isAdmin
                ? String(message.from || "") === targetUserId
                : String(message.from || "") !== currentUserId;

            if (isIncomingForViewer && !message.read) {
                message.read = true;
                messagesChanged = true;
            }

            return message;
        });

        if (messagesChanged) {
            await targetUser.save();
        }

        return NextResponse.json({
            success: true,
            participant: getSupportParticipant({ isAdmin, targetUser }),
            messages: supportMessages.map((message) => serializeSupportMessage(message, currentUserId)),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const currentUserId = await getRequestUserId(request);
        if (!currentUserId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await authAdmin(currentUserId);
        const { to, subject, content } = await request.json();
        const safeContent = normalizeString(content);
        const safeSubject = normalizeString(subject);
        const targetUserId = isAdmin ? normalizeString(to) : currentUserId;

        if (!targetUserId) {
            return NextResponse.json({ success: false, message: "A support recipient is required" }, { status: 400 });
        }

        if (!safeContent) {
            return NextResponse.json({ success: false, message: "Please write a support message" }, { status: 400 });
        }

        await connectDB();
        await Promise.allSettled([syncUserFromClerk(currentUserId), syncUserFromClerk(targetUserId)]);

        const [targetUser, senderUser] = await Promise.all([
            User.findById(targetUserId),
            User.findById(currentUserId),
        ]);

        if (!targetUser) {
            return NextResponse.json({ success: false, message: "Support recipient not found" }, { status: 404 });
        }

        ensureMessageThread(targetUser);

        const messageRecord = createSupportMessageRecord({
            senderId: currentUserId,
            recipientId: isAdmin ? targetUserId : "support",
            ownerUserId: targetUserId,
            senderRole: inferSupportRole(senderUser || targetUser, isAdmin),
            senderLabel: senderUser?.businessName || senderUser?.name || (isAdmin ? "KawilMart Support" : "Customer"),
            subject: safeSubject || (isAdmin ? "Support reply" : "Support request"),
            content: safeContent,
        });

        targetUser.messages.push(messageRecord);
        await targetUser.save();

        if (isAdmin) {
            await notifyUsers([
                {
                    userId: targetUserId,
                    notification: {
                        type: "support",
                        title: safeSubject || "Support reply",
                        message: safeContent.length > 120 ? `${safeContent.slice(0, 120)}...` : safeContent,
                        read: false,
                        date: new Date(),
                    },
                    emailTitle: safeSubject || "KawilMart support replied",
                    emailMessage: safeContent,
                    ctaLabel: "Open support chat",
                    ctaPath: "/inbox?tab=support",
                },
            ]);
        } else {
            const client = await clerkClient();
            const clerkUsers = await client.users.getUserList({ limit: 100 });
            const adminIds = clerkUsers.data
                .filter((user) => (user.publicMetadata?.role || user.metadata?.role) === "admin")
                .map((user) => user.id)
                .filter(Boolean);
            const senderRole = inferSupportRole(senderUser || targetUser, false);
            const senderLabel = senderUser?.businessName || senderUser?.name || "A customer";
            const preview = safeContent.length > 120 ? `${safeContent.slice(0, 120)}...` : safeContent;

            if (adminIds.length > 0) {
                await notifyUsers(adminIds.map((adminId) => ({
                    userId: adminId,
                    notification: {
                        type: "support",
                        title: safeSubject || "New support request",
                        message: `${senderLabel}: ${preview}`,
                        read: false,
                        date: new Date(),
                    },
                    emailTitle: safeSubject || `New support request from ${senderLabel}`,
                    emailMessage: `${senderLabel} sent a new support request: ${safeContent}`,
                    ctaLabel: "Open support queue",
                    ctaPath: getSupportInboxPath(senderRole),
                })));
            }
        }

        return NextResponse.json({
            success: true,
            message: "Support message sent",
            supportMessage: serializeSupportMessage(messageRecord, currentUserId),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
