'use client'
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { NotificationsPageSkeleton } from "@/components/PageSkeletons";
import { useAppContext } from "@/context/AppContext";
import { getApiErrorMessage } from "@/lib/apiErrors";

const formatWhen = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Just now";
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const InboxPage = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "support" ? "support" : tabParam === "chats" ? "chats" : "inbox";
  const initialPeerId = searchParams.get("peer") || "";
  const {
    user,
    authReady,
    getToken,
    isAdmin,
    navigate,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportParticipant, setSupportParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [supportDraft, setSupportDraft] = useState({
    subject: searchParams.get("subject") || "",
    content: searchParams.get("content") || "",
  });
  const [sendingSupport, setSendingSupport] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  // Store chats: direct buyer <-> seller conversations.
  const [chatThreads, setChatThreads] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatPeer, setChatPeer] = useState(null);
  const [activePeerId, setActivePeerId] = useState(initialPeerId);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const usesAdminSupportQueue = Boolean(isAdmin);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [filter, notifications]);

  const loadNotifications = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    const list = await refreshNotifications({ silent: true, full: true });
    setNotifications(list);
    if (background) setRefreshing(false);
    return list;
  }, [refreshNotifications]);

  const fetchSupportThread = useCallback(async () => {
    if (usesAdminSupportQueue) {
      setSupportMessages([]);
      setSupportParticipant(null);
      setSupportLoading(false);
      return;
    }

    try {
      setSupportLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/support/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setSupportMessages(data.messages || []);
        setSupportParticipant(data.participant || null);
      } else {
        toast.error(data.message || "Failed to load support chat");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load support chat"));
    } finally {
      setSupportLoading(false);
    }
  }, [getToken, usesAdminSupportQueue]);

  const fetchChatThreads = useCallback(async () => {
    try {
      setChatLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/store/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setChatThreads(data.threads || []);
      }
    } catch {
      // Quietly keep the previous list; the tab shows an empty state anyway.
    } finally {
      setChatLoading(false);
    }
  }, [getToken]);

  const fetchChatThread = useCallback(async (peerId) => {
    if (!peerId) return;
    try {
      setChatLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`/api/store/chat?peerId=${encodeURIComponent(peerId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setChatMessages(data.messages || []);
        setChatPeer(data.peer || null);
      } else {
        toast.error(data.message || "Failed to load chat");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load chat"));
    } finally {
      setChatLoading(false);
    }
  }, [getToken]);

  const openChatThread = (peerId) => {
    setActivePeerId(peerId);
    setChatMessages([]);
    setChatPeer(null);
    void fetchChatThread(peerId);
  };

  const sendChatMessage = async () => {
    const content = chatDraft.trim();
    if (!content || !activePeerId) return;

    const optimistic = {
      messageId: `temp-${Date.now()}`,
      from: user?.id,
      to: activePeerId,
      content,
      date: new Date().toISOString(),
      read: true,
    };
    setChatMessages((current) => [...current, optimistic]);
    setChatDraft("");
    setSendingChat(true);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/store/chat",
        { peerId: activePeerId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) {
        toast.error(data.message || "Failed to send message");
        setChatMessages((current) => current.filter((m) => m.messageId !== optimistic.messageId));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send message"));
      setChatMessages((current) => current.filter((m) => m.messageId !== optimistic.messageId));
    } finally {
      setSendingChat(false);
    }
  };

  const handleSelectNotification = (notification) => {
    setExpandedId((current) => (current === notification._id ? null : notification._id));
    if (!notification.read) {
      setNotifications((current) =>
        current.map((entry) =>
          entry._id === notification._id ? { ...entry, read: true } : entry
        )
      );
      void markNotificationAsRead(notification._id);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    setNotifications((current) => current.map((entry) => ({ ...entry, read: true })));
    void markAllNotificationsAsRead();
    toast.success("All marked as read");
  };

  const handleRefresh = () => {
    if (activeTab === "inbox") {
      void loadNotifications({ background: true });
      return;
    }
    if (activeTab === "chats") {
      if (activePeerId) void fetchChatThread(activePeerId);
      else void fetchChatThreads();
      return;
    }
    void fetchSupportThread();
  };

  const sendSupportMessage = async () => {
    if (usesAdminSupportQueue) {
      toast.error("Open admin management to reply to customers");
      return;
    }

    const subject = supportDraft.subject;
    const content = supportDraft.content.trim();
    if (!content) return;

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      content,
      subject,
      isOwnMessage: true,
      date: new Date().toISOString(),
      senderLabel: user?.firstName || "You",
    };

    setSupportMessages((current) => [...current, optimisticMessage]);
    setSupportDraft({ subject: "", content: "" });
    setSendingSupport(true);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/support/messages",
        { subject, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        toast.error(data.message || "Failed to send message");
        setSupportMessages((current) => current.filter((m) => m._id !== optimisticMessage._id));
        return;
      }

      toast.success("Message sent");
      void fetchSupportThread();
    } catch (error) {
      setSupportMessages((current) => current.filter((m) => m._id !== optimisticMessage._id));
      toast.error(getApiErrorMessage(error, "Failed to send message"));
    } finally {
      setSendingSupport(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialPeerId) {
      setActivePeerId(initialPeerId);
    }
  }, [initialTab, initialPeerId]);

  useEffect(() => {
    if (!authReady || !user || activeTab !== "chats") return;
    if (activePeerId) {
      void fetchChatThread(activePeerId);
    } else {
      void fetchChatThreads();
    }
  }, [authReady, user, activeTab, activePeerId, fetchChatThread, fetchChatThreads]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setLoading(false);
      setSupportLoading(false);
      return;
    }

    const tasks = [loadNotifications()];
    if (!usesAdminSupportQueue) {
      tasks.push(fetchSupportThread());
    } else {
      setSupportLoading(false);
    }

    void Promise.all(tasks).finally(() => setLoading(false));
  }, [authReady, user, usesAdminSupportQueue, loadNotifications, fetchSupportThread]);

  if (!authReady || loading) {
    return (
      <>
        <Navbar hideMobileHeader mobilePageTitle="Notifications" />
        <NotificationsPageSkeleton />
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar hideMobileHeader mobilePageTitle="Notifications" />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-gray-600">Sign in to view notifications and support.</p>
          <button type="button" onClick={() => navigate("/sign-in")} className="mt-4 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white">
            Sign in
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Notifications" />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6 md:py-6">
        <header className="hidden items-start justify-between gap-3 md:flex">
          <div>
            <h1 className="text-lg font-bold text-gray-950">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || supportLoading}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            {refreshing || supportLoading ? "..." : "Refresh"}
          </button>
        </header>

        <div className="mt-4 inline-flex rounded-full bg-gray-100 p-1">
          {[
            ["inbox", "Inbox", unreadCount || null],
            ["chats", "Chats", chatThreads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0) || null],
            ["support", "Support", null],
          ].map(([tab, label, badge]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"
              }`}
            >
              {label}
              {badge ? ` (${badge})` : ""}
            </button>
          ))}
        </div>

        {activeTab === "inbox" ? (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                {[
                  ["all", "All"],
                  ["unread", "Unread"],
                  ["read", "Read"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      filter === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {unreadCount > 0 ? (
                <button type="button" onClick={handleMarkAllRead} className="text-[11px] font-semibold text-orange-600">
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              {filteredNotifications.length === 0 ? (
                <div className="px-4 py-14 text-center text-sm text-gray-500">No notifications here</div>
              ) : (
                filteredNotifications.map((notification) => {
                  const isExpanded = expandedId === notification._id;
                  return (
                    <div key={notification._id}>
                      <button
                        type="button"
                        onClick={() => handleSelectNotification(notification)}
                        className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition ${
                          !notification.read ? "bg-orange-50/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-gray-300" : "bg-orange-500"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`line-clamp-1 text-sm ${notification.read ? "font-medium text-gray-800" : "font-semibold text-gray-950"}`}>
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-gray-400">{formatWhen(notification.date)}</span>
                          </span>
                          <span className={`mt-0.5 block text-xs text-gray-500 ${isExpanded ? "" : "line-clamp-1"}`}>
                            {notification.message}
                          </span>
                        </span>
                      </button>
                      {isExpanded ? (
                        <div className="border-t border-gray-50 bg-gray-50/60 px-4 py-2.5">
                          <p className="text-xs leading-5 text-gray-700">{notification.message}</p>
                          <div className="mt-2 flex gap-2">
                            {!notification.read ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotifications((current) =>
                                    current.map((entry) =>
                                      entry._id === notification._id ? { ...entry, read: true } : entry
                                    )
                                  );
                                  void markNotificationAsRead(notification._id);
                                }}
                                className="text-[11px] font-semibold text-orange-600"
                              >
                                Mark read
                              </button>
                            ) : null}
                            <button type="button" onClick={() => setActiveTab("support")} className="text-[11px] font-semibold text-gray-600">
                              Get support
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === "chats" ? (
          <div className="mt-4 space-y-3">
            {activePeerId ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
                  <button
                    type="button"
                    onClick={() => { setActivePeerId(""); void fetchChatThreads(); }}
                    aria-label="Back to chats"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    {chatPeer?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={chatPeer.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (chatPeer?.name || "?").slice(0, 1)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-950">{chatPeer?.name || "Chat"}</p>
                    <p className="text-[10px] text-gray-400">{chatPeer?.isSeller ? "Store" : "Buyer"}</p>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
                  {chatLoading && chatMessages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-gray-400">Loading conversation...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-gray-400">No messages yet. Say hello 👋</p>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((message) => {
                        const isOwn = String(message.from) === String(user?.id);
                        return (
                          <div key={message.messageId} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs ${isOwn ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-100"}`}>
                              <p className="whitespace-pre-wrap leading-5">{message.content}</p>
                              <p className={`mt-1 text-[10px] ${isOwn ? "text-white/60" : "text-gray-400"}`}>{formatWhen(message.date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-gray-100">
                  <textarea
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendChatMessage();
                      }
                    }}
                    placeholder="Write a message..."
                    rows={1}
                    className="min-h-[2.25rem] w-full resize-none rounded-lg bg-gray-50 px-3 py-2 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void sendChatMessage()}
                    disabled={sendingChat || !chatDraft.trim()}
                    className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {sendingChat ? "..." : "Send"}
                  </button>
                </div>
              </>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                {chatLoading && chatThreads.length === 0 ? (
                  <p className="px-4 py-12 text-center text-xs text-gray-400">Loading chats...</p>
                ) : chatThreads.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-500">No chats yet</p>
                    <p className="mt-1 text-xs text-gray-400">Open a store and tap Chat to message the seller.</p>
                  </div>
                ) : (
                  chatThreads.map((thread) => (
                    <button
                      key={thread.peerId}
                      type="button"
                      onClick={() => openChatThread(thread.peerId)}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-gray-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                        {thread.peer?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thread.peer.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (thread.peer?.name || "?").slice(0, 1)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${thread.unreadCount ? "font-semibold text-gray-950" : "font-medium text-gray-800"}`}>
                            {thread.peer?.name || "KawilMart user"}
                          </span>
                          <span className="shrink-0 text-[10px] text-gray-400">{formatWhen(thread.lastMessage?.date)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                          {thread.lastMessage?.content || ""}
                        </span>
                      </span>
                      {thread.unreadCount ? (
                        <span className="inline-flex min-w-[1.1rem] shrink-0 items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : usesAdminSupportQueue ? (
          <div className="mt-4 rounded-xl bg-orange-50 p-5 ring-1 ring-orange-100">
            <h2 className="text-sm font-bold text-gray-950">Admin support queue</h2>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              Customer conversations are managed from Admin Management.
            </p>
            <button type="button" onClick={() => navigate("/admin/management")} className="mt-3 rounded-lg bg-gray-950 px-4 py-2 text-xs font-semibold text-white">
              Open management
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-semibold text-gray-950">{supportParticipant?.name || "KawilMart Support"}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">Orders, account, seller access, and general help.</p>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
              {supportLoading ? (
                <p className="py-8 text-center text-xs text-gray-400">Loading conversation...</p>
              ) : supportMessages.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">No messages yet. Send one below.</p>
              ) : (
                <div className="space-y-2">
                  {supportMessages.map((message) => (
                    <div key={message._id || message.messageId} className={`flex ${message.isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs ${message.isOwnMessage ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-100"}`}>
                        {message.subject ? <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{message.subject}</p> : null}
                        <p className="whitespace-pre-wrap leading-5">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${message.isOwnMessage ? "text-white/60" : "text-gray-400"}`}>{formatWhen(message.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
              <input
                type="text"
                value={supportDraft.subject}
                onChange={(event) => setSupportDraft((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Subject (optional)"
                className="mb-2 w-full rounded-lg bg-gray-50 px-3 py-2 text-xs outline-none"
              />
              <textarea
                value={supportDraft.content}
                onChange={(event) => setSupportDraft((current) => ({ ...current, content: event.target.value }))}
                placeholder="Write your message..."
                rows={3}
                className="w-full resize-none rounded-lg bg-gray-50 px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={sendSupportMessage}
                disabled={sendingSupport || !supportDraft.content.trim()}
                className="mt-2 w-full rounded-lg bg-orange-600 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {sendingSupport ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default InboxPage;
