import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";
import { getRequestUserId } from "@/lib/requestAuth";
import { notifyUsers } from "@/lib/notifyUsers";
import { sortMessagesByDate } from "@/lib/supportChat";

// Direct buyer <-> seller store chat. Each participant keeps their own copy of
// the thread inside their `messages` array (channel: "direct"), keyed by a
// stable pair conversation key so both sides read the same thread.
const buildDmKey = (a = "", b = "") => `dm:${[String(a), String(b)].sort().join(":")}`;

const MAX_MESSAGES_PER_USER = 400;

const serializeDm = (message = {}) => ({
  messageId: message?.messageId || (message?._id ? String(message._id) : ""),
  from: String(message?.from || ""),
  to: String(message?.to || ""),
  content: message?.content || "",
  senderLabel: message?.senderLabel || "",
  read: Boolean(message?.read),
  date: message?.date,
});

const getPeerSummary = (peer) => ({
  id: String(peer?._id || ""),
  name: peer?.businessName || peer?.name || "KawilMart user",
  imageUrl: peer?.imageUrl || "",
  isSeller: Boolean(peer?.businessName),
});

export async function GET(request) {
  try {
    const currentUserId = await getRequestUserId(request);
    if (!currentUserId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const peerId = (searchParams.get("peerId") || "").trim();

    const currentUser = await User.findById(currentUserId).select("messages name").lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const directMessages = (currentUser.messages || []).filter((message) => message?.channel === "direct");

    if (!peerId) {
      // Thread list: group by conversation, newest first, with unread counts.
      const threads = new Map();
      for (const message of directMessages) {
        const otherId = String(message.from) === String(currentUserId) ? String(message.to) : String(message.from);
        if (!otherId) continue;
        const existing = threads.get(otherId);
        const isNewer = !existing || new Date(message.date || 0) > new Date(existing.lastMessage.date || 0);
        threads.set(otherId, {
          peerId: otherId,
          lastMessage: isNewer ? serializeDm(message) : existing.lastMessage,
          unreadCount: (existing?.unreadCount || 0)
            + (!message.read && String(message.to) === String(currentUserId) ? 1 : 0),
        });
      }

      const peerIds = [...threads.keys()];
      const peers = peerIds.length
        ? await User.find({ _id: { $in: peerIds } }).select("name businessName imageUrl").lean()
        : [];
      const peersById = new Map(peers.map((peer) => [String(peer._id), peer]));

      const threadList = [...threads.values()]
        .map((thread) => ({ ...thread, peer: getPeerSummary(peersById.get(thread.peerId)) }))
        .sort((a, b) => new Date(b.lastMessage.date || 0) - new Date(a.lastMessage.date || 0));

      return NextResponse.json({ success: true, threads: threadList });
    }

    // Single thread: return messages and mark incoming ones read.
    const dmKey = buildDmKey(currentUserId, peerId);
    const threadMessages = sortMessagesByDate(
      directMessages.filter((message) => message?.conversationKey === dmKey)
    ).map(serializeDm);

    await User.updateOne(
      { _id: currentUserId },
      { $set: { "messages.$[msg].read": true } },
      { arrayFilters: [{ "msg.conversationKey": dmKey, "msg.to": String(currentUserId), "msg.read": false }] }
    );

    const peer = await User.findById(peerId).select("name businessName imageUrl").lean();

    return NextResponse.json({
      success: true,
      peer: getPeerSummary(peer),
      messages: threadMessages,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Unable to load chat" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUserId = await getRequestUserId(request);
    if (!currentUserId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { peerId, content } = await request.json();
    const trimmedContent = typeof content === "string" ? content.trim().slice(0, 2000) : "";

    if (!peerId || typeof peerId !== "string" || String(peerId) === String(currentUserId)) {
      return NextResponse.json({ success: false, message: "Invalid recipient" }, { status: 400 });
    }
    if (!trimmedContent) {
      return NextResponse.json({ success: false, message: "Message cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const [sender, recipient] = await Promise.all([
      User.findById(currentUserId).select("name businessName").lean(),
      User.findById(peerId).select("name businessName").lean(),
    ]);

    if (!sender || !recipient) {
      return NextResponse.json({ success: false, message: "Recipient not found" }, { status: 404 });
    }

    const dmKey = buildDmKey(currentUserId, peerId);
    const senderLabel = sender.businessName || sender.name || "KawilMart user";
    const baseRecord = {
      messageId: new mongoose.Types.ObjectId().toString(),
      from: String(currentUserId),
      to: String(peerId),
      subject: "Store chat",
      content: trimmedContent,
      date: new Date(),
      channel: "direct",
      conversationKey: dmKey,
      senderLabel,
      senderRole: sender.businessName ? "seller" : "buyer",
    };

    await Promise.all([
      // Sender's copy is already read; recipient's copy starts unread.
      User.updateOne(
        { _id: currentUserId },
        { $push: { messages: { $each: [{ ...baseRecord, read: true }], $slice: -MAX_MESSAGES_PER_USER } } }
      ),
      User.updateOne(
        { _id: peerId },
        { $push: { messages: { $each: [{ ...baseRecord, read: false }], $slice: -MAX_MESSAGES_PER_USER } } }
      ),
    ]);

    await notifyUsers([
      {
        userId: String(peerId),
        notification: {
          type: "message",
          title: `New message from ${senderLabel}`,
          message: trimmedContent.length > 120 ? `${trimmedContent.slice(0, 120)}...` : trimmedContent,
          read: false,
          date: new Date(),
        },
        emailTitle: `New KawilMart message from ${senderLabel}`,
        emailMessage: trimmedContent,
        ctaLabel: "Open chat",
        ctaPath: `/inbox?tab=chats&peer=${encodeURIComponent(String(currentUserId))}`,
      },
    ]);

    return NextResponse.json({ success: true, message: "Message sent", sent: serializeDm({ ...baseRecord, read: true }) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Unable to send message" }, { status: 500 });
  }
}
