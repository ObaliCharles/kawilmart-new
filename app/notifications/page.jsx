'use client'
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { NotificationsPageSkeleton } from "@/components/PageSkeletons";
import { useAppContext } from "@/context/AppContext";
import { getApiErrorMessage } from "@/lib/apiErrors";

const formatDateTime = (value) => {
  if (!value) {
    return "Now";
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "Now";
  }

  return date.toLocaleString();
};

const TabButton = ({ active, onClick, children, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-gray-900 text-white"
        : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    {children}
    {badge ? (
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white/15 text-white" : "bg-orange-100 text-orange-700"}`}>
        {badge}
      </span>
    ) : null}
  </button>
);

const InboxPage = () => {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "support" ? "support" : "inbox";
  const initialSupportDraft = {
    subject: searchParams.get("subject") || "",
    content: searchParams.get("content") || "",
  };
  const {
    user,
    authReady,
    isAdmin,
    recentNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setUnreadNotificationsCount,
    refreshNotifications,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportParticipant, setSupportParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [supportDraft, setSupportDraft] = useState(initialSupportDraft);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const usesAdminSupportQueue = Boolean(isAdmin);

  const notifications = recentNotifications;
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const fetchSupportThread = async () => {
    if (usesAdminSupportQueue) {
      setSupportMessages([]);
      setSupportParticipant(null);
      setSupportLoading(false);
      return;
    }

    try {
      setSupportLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/support/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setSupportMessages(data.messages || []);
        setSupportParticipant(data.participant || null);
      } else {
        toast.error(data.message || 'Failed to load support chat');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load support chat'));
    } finally {
      setSupportLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const data = await markNotificationAsRead(notificationId);

      if (!data?.success) {
        toast.error(data?.message || 'Failed to mark as read');
        return;
      }

      setUnreadNotificationsCount(typeof data.unreadCount === "number" ? data.unreadCount : unreadCount);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }

    setMarkingAll(true);

    try {
      const data = await markAllNotificationsAsRead();

      if (!data?.success) {
        toast.error(data?.message || 'Failed to mark all as read');
        return;
      }

      setUnreadNotificationsCount(0);
      toast.success(data.message || 'All inbox messages marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const sendSupportMessage = async () => {
    if (usesAdminSupportQueue) {
      toast.error('Open the admin support queue to reply to customers');
      return;
    }

    if (!supportDraft.content.trim()) {
      return;
    }

    try {
      setSendingSupport(true);
      const token = await getToken();
      const { data } = await axios.post('/api/support/messages', {
        subject: supportDraft.subject,
        content: supportDraft.content,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data.success) {
        toast.error(data.message || 'Failed to send support message');
        return;
      }

      toast.success('Support message sent');
      setSupportDraft({ subject: "", content: "" });
      await fetchSupportThread();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send support message'));
    } finally {
      setSendingSupport(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSupportDraft(initialSupportDraft);
  }, [initialSupportDraft.content, initialSupportDraft.subject]);

  useEffect(() => {
    if (authReady && user) {
      const pendingRequests = [refreshNotifications({ silent: true })];

      if (usesAdminSupportQueue) {
        setSupportMessages([]);
        setSupportParticipant(null);
        setSupportLoading(false);
      } else {
        pendingRequests.push(fetchSupportThread());
      }

      void Promise.all(pendingRequests).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, usesAdminSupportQueue, refreshNotifications]);

  useEffect(() => {
    if (notifications.length && !selectedNotificationId) {
      setSelectedNotificationId(notifications[0]._id);
    }
  }, [notifications, selectedNotificationId]);

  if (loading && supportLoading) {
    return (
      <>
        <Navbar />
        <NotificationsPageSkeleton />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 py-8 sm:px-6 md:px-12 lg:px-24 xl:px-32">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inbox & Support</h1>
            <p className="mt-1 text-sm text-gray-500">
              Keep up with order updates and chat with KawilMart support from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TabButton active={activeTab === "inbox"} onClick={() => setActiveTab("inbox")} badge={unreadCount || undefined}>
              Inbox
            </TabButton>
            <TabButton active={activeTab === "support"} onClick={() => setActiveTab("support")}>
              Support Chat
            </TabButton>
          </div>
        </div>

        {activeTab === "inbox" ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600">
                  <span className="h-3.5 w-3.5 rounded-[3px] border border-gray-400" />
                </button>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600">
                  ↻
                </button>
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll || unreadCount === 0}
                  className={`rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition ${
                    markingAll || unreadCount === 0
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {markingAll ? 'Marking...' : 'Mark all as read'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none">
                  <option>Filter</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
              </div>
            </div>

            <div className="grid min-h-[38rem] xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
              <div className="border-b border-gray-200 xl:border-b-0 xl:border-r">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-500">Inbox updates</p>
                  <p className="text-[12px] text-gray-400">{notifications.length} total</p>
                </div>
                <div className="max-h-[34.5rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex min-h-[22rem] items-center justify-center px-4 text-center text-sm text-gray-500">
                      Your inbox is empty
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isSelected = selectedNotificationId === notification._id;
                      return (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => setSelectedNotificationId(notification._id)}
                          className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                          />
                          <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="truncate text-[13px] font-semibold text-gray-950">{notification.title}</h3>
                              <span className="shrink-0 text-[11px] text-gray-500">{formatDateTime(notification.date)}</span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-[12px] text-gray-500">{notification.message}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-[#fbfbfc] px-5 py-5">
                {notifications.length === 0 ? (
                  <div className="flex h-full min-h-[22rem] items-center justify-center rounded-[1.25rem] border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                    Select a notification to preview it here.
                  </div>
                ) : (
                  (() => {
                    const selectedNotification = notifications.find((notification) => notification._id === selectedNotificationId) || notifications[0];
                    return (
                      <div className="rounded-[1.25rem] border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Notification</p>
                            <h3 className="mt-2 text-[20px] font-semibold text-gray-950">{selectedNotification.title}</h3>
                            <p className="mt-1 text-[12px] text-gray-500">{formatDateTime(selectedNotification.date)}</p>
                          </div>
                          {!selectedNotification.read ? (
                            <button
                              onClick={() => markAsRead(selectedNotification._id)}
                              className="rounded-full bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-500">
                              Read
                            </span>
                          )}
                        </div>
                        <div className="space-y-4 py-5">
                          <p className="text-[14px] leading-7 text-gray-700">{selectedNotification.message}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => markAsRead(selectedNotification._id)}
                            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-800 hover:border-gray-300"
                          >
                            Mark as read
                          </button>
                          <Link href="/inbox?tab=support" className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[12px] font-semibold text-blue-700">
                            Open support
                          </Link>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        ) : usesAdminSupportQueue ? (
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Admin Support Queue</p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">Support conversations are managed from Admin Management</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              This inbox page is reserved for your notification feed. To reply to sellers, riders, and customers, open the management support queue where each conversation is tied to a specific account.
            </p>
            <div className="mt-5">
              <Link
                href="/admin/management"
                className="inline-flex rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                Open Admin Management
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Support Line</p>
                <h2 className="mt-3 text-xl font-semibold text-gray-900">{supportParticipant?.name || 'KawilMart Support'}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Ask about seller subscription access, store verification, account changes, orders, or any marketplace support need.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supportParticipant?.badgeLabel ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {supportParticipant.badgeLabel}
                    </span>
                  ) : null}
                  {supportParticipant?.supportPriority ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {supportParticipant.supportPriority} support
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Send a message</h3>
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={supportDraft.subject}
                    onChange={(event) => setSupportDraft((current) => ({ ...current, subject: event.target.value }))}
                    placeholder="Subject, for example: Subscription payment"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  />
                  <textarea
                    value={supportDraft.content}
                    onChange={(event) => setSupportDraft((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Describe what you need help with..."
                    className="h-36 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={sendSupportMessage}
                    disabled={sendingSupport || !supportDraft.content.trim()}
                    className={`w-full rounded-full px-4 py-3 text-sm font-medium transition ${
                      sendingSupport || !supportDraft.content.trim()
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {sendingSupport ? 'Sending...' : 'Send to support'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
                  <p className="mt-1 text-sm text-gray-500">Replies from support appear here automatically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchSupportThread()}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-900 hover:text-gray-900"
                >
                  Refresh chat
                </button>
              </div>

              <div className="mt-5 h-[540px] overflow-y-auto rounded-3xl bg-gray-50 p-4">
                {supportLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Loading support conversation...
                  </div>
                ) : supportMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
                    No support messages yet. Your first message will start the conversation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportMessages.map((message) => (
                      <div
                        key={message._id || message.messageId}
                        className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                            message.isOwnMessage
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {message.subject ? (
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              message.isOwnMessage ? 'text-white/70' : 'text-gray-400'
                            }`}>
                              {message.subject}
                            </p>
                          ) : null}
                          <p className="mt-1 whitespace-pre-wrap leading-6">{message.content}</p>
                          <p className={`mt-2 text-[11px] ${
                            message.isOwnMessage ? 'text-white/60' : 'text-gray-400'
                          }`}>
                            {message.senderLabel || (message.isOwnMessage ? user?.firstName || 'You' : supportParticipant?.name || 'Support')} · {formatDateTime(message.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default InboxPage;
