import mongoose from "mongoose";

export const SUPPORT_CHANNEL = "support";

export const buildSupportConversationKey = (userId = "") => `support:${String(userId || "").trim()}`;

export const isSupportMessage = (message = {}, participantId = "") => {
    if (message?.channel !== SUPPORT_CHANNEL) {
        return false;
    }

    if (!participantId) {
        return true;
    }

    return message?.conversationKey === buildSupportConversationKey(participantId);
};

export const sortMessagesByDate = (messages = []) => (
    [...messages].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime())
);

export const createSupportMessageRecord = ({
    senderId = "",
    recipientId = "",
    ownerUserId = "",
    senderRole = "",
    senderLabel = "",
    subject = "",
    content = "",
    date = new Date(),
} = {}) => {
    const conversationOwner = ownerUserId || recipientId || senderId;

    return {
        messageId: new mongoose.Types.ObjectId().toString(),
        from: senderId,
        to: recipientId,
        subject: subject || "Support message",
        content,
        read: false,
        date,
        channel: SUPPORT_CHANNEL,
        conversationKey: buildSupportConversationKey(conversationOwner),
        senderLabel,
        senderRole,
    };
};

export const serializeSupportMessage = (message = {}, currentUserId = "") => ({
    _id: message?._id ? String(message._id) : message?.messageId || "",
    messageId: message?.messageId || "",
    from: String(message?.from || ""),
    to: String(message?.to || ""),
    subject: message?.subject || "",
    content: message?.content || "",
    read: Boolean(message?.read),
    date: message?.date,
    channel: message?.channel || SUPPORT_CHANNEL,
    senderLabel: message?.senderLabel || "",
    senderRole: message?.senderRole || "",
    isOwnMessage: String(message?.from || "") === String(currentUserId || ""),
});
