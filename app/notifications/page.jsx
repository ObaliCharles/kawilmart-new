'use client'
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  const {
    getToken,
    user,
    authReady,
    isAdmin,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setUnreadNotificationsCount,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportParticipant, setSupportParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [supportDraft, setSupportDraft] = useState({ subject: "", content: "" });
  const [sendingSupport, setSendingSupport] = useState(false);
  const usesAdminSupportQueue = Boolean(isAdmin);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const nextNotifications = data.notifications || [];
        setNotifications(nextNotifications);
        setUnreadNotificationsCount(nextNotifications.filter((notification) => !notification.read).length);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

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

      setNotifications(prev => prev.map((notification) =>
        notification._id === notificationId ? { ...notification, read: true } : notification
      ));
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

      setNotifications((current) => current.map((notification) => ({
        ...notification,
        read: true,
      })));
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
    if (authReady && user) {
      const pendingRequests = [fetchNotifications()];

      if (usesAdminSupportQueue) {
        setSupportMessages([]);
        setSupportParticipant(null);
        setSupportLoading(false);
      } else {
        pendingRequests.push(fetchSupportThread());
      }

      void Promise.all(pendingRequests);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, usesAdminSupportQueue]);

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
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unread inbox updates</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{unreadCount}</p>
              </div>
              <button
                onClick={markAllAsRead}
                disabled={markingAll || unreadCount === 0}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  markingAll || unreadCount === 0
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-500 shadow-sm">
                Your inbox is empty
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-3xl border p-5 shadow-sm transition ${
                    !notification.read ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{notification.message}</p>
                      <p className="mt-3 text-xs text-gray-400">{formatDateTime(notification.date)}</p>
                    </div>
                    {!notification.read ? (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Mark read
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                        Read
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
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
