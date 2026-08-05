'use client'

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { CUSTOMER_TRACKING_STEPS, getCustomerTrackingStepIndex } from "@/lib/orderTracking";
import { isTerminalOrderStatus } from "@/lib/orderLifecycle";
import { getOrderStatusBadgeClass, getOrderStatusDisplay } from "@/lib/orderUi";

const formatDateTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const OrderCode = ({ order }) => `#${String(order?._id || "").slice(-8).toUpperCase()}`;

const TrackOrderPage = () => {
  const { authReady, user, getToken, navigate, formatCurrency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate("/sign-in?redirect_url=/track-order");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await axios.get("/api/order/list", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          const nextOrders = data.orders || [];
          setOrders(nextOrders);
          setSelectedOrderId((current) => current || nextOrders.find((order) => !isTerminalOrderStatus(order.status))?._id || nextOrders[0]?._id || "");
        } else {
          toast.error(data.message || "Unable to load orders");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message || "Unable to load orders");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const currentStepIndex = selectedOrder ? getCustomerTrackingStepIndex(selectedOrder.status) : -1;
  const events = (selectedOrder?.trackingEvents || []).slice().reverse();

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Track Order" showMobilePageSearch={false} />
      <main className="min-h-screen bg-[#f6f7fb] px-3 pb-10 pt-4 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <header className="reveal-up overflow-hidden rounded-2xl bg-gray-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.22)] md:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">Live order tracking</p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-4xl">Follow every handoff</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  See where your order is, who is handling it, and what changed most recently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/my-orders")}
                className="w-fit rounded-full bg-white px-5 py-2.5 text-xs font-bold text-gray-950 hover:bg-orange-50"
              >
                View all orders
              </button>
            </div>
          </header>

          {loading ? (
            <section className="mt-4 rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm ring-1 ring-gray-100">
              Loading your orders...
            </section>
          ) : !orders.length ? (
            <section className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-sm font-semibold text-gray-900">No orders to track yet</p>
              <button type="button" onClick={() => navigate("/all-products")} className="mt-3 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-bold text-white">
                Start shopping
              </button>
            </section>
          ) : (
            <section className="mt-4 grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
              <aside className="reveal-up rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
                <h2 className="px-1 text-xs font-black uppercase tracking-[0.12em] text-gray-400">Orders</h2>
                <div className="mt-2 space-y-1.5">
                  {orders.map((order) => (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() => setSelectedOrderId(order._id)}
                      className={`w-full rounded-xl p-3 text-left ${selectedOrder?._id === order._id ? "bg-gray-950 text-white shadow-lg" : "bg-gray-50 text-gray-800 hover:bg-orange-50"}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold"><OrderCode order={order} /></span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedOrder?._id === order._id ? "bg-white/15 text-white" : getOrderStatusBadgeClass(order.status)}`}>
                          {getOrderStatusDisplay(order.status)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[11px] opacity-70">{order.items?.[0]?.product?.name || "Order items"}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <article className="reveal-up min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-orange-600"><OrderCode order={selectedOrder} /></p>
                    <h2 className="mt-1 truncate text-xl font-black text-gray-950">{selectedOrder.items?.[0]?.product?.name || "Your order"}</h2>
                    <p className="mt-1 text-xs text-gray-500">{formatDateTime(selectedOrder.date)} · {selectedOrder.deliveryModeLabel}</p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-gray-50 px-4 py-3 text-right">
                    <p className="text-[11px] text-gray-500">Total</p>
                    <p className="text-lg font-black text-gray-950">{formatCurrency(selectedOrder.amount)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-6">
                  {CUSTOMER_TRACKING_STEPS.map((step, index) => {
                    const isDone = index <= currentStepIndex && selectedOrder.status !== "CANCELLED";
                    return (
                      <div key={step.label} className="min-w-0">
                        <div className={`h-1 rounded-full ${isDone ? "bg-orange-600" : "bg-gray-200"}`} />
                        <p className={`mt-2 text-[11px] font-bold ${isDone ? "text-gray-950" : "text-gray-400"}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
                  <div>
                    <h3 className="text-sm font-black text-gray-950">Tracking activity</h3>
                    <div className="mt-3 space-y-3">
                      {events.length ? events.map((event) => (
                        <div key={event.id || `${event.title}-${event.timestamp}`} className="flex gap-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500 shadow-[0_0_0_5px_rgba(234,88,12,0.12)]" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-950">{event.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-gray-600">{event.description}</p>
                            <p className="mt-1 text-[11px] text-gray-400">{formatDateTime(event.timestamp)}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No tracking activity yet.</p>
                      )}
                    </div>
                  </div>

                  <aside className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="text-sm font-black text-gray-950">Delivery details</h3>
                    <div className="mt-3 space-y-3 text-xs text-gray-600">
                      <p><span className="font-bold text-gray-950">Seller:</span> {selectedOrder.seller?.name || "Seller"}</p>
                      <p><span className="font-bold text-gray-950">Rider:</span> {selectedOrder.rider?.name || "Not assigned yet"}</p>
                      <p><span className="font-bold text-gray-950">Address:</span> {[selectedOrder.address?.area, selectedOrder.address?.city, selectedOrder.address?.state].filter(Boolean).join(", ") || "Pickup or address pending"}</p>
                    </div>
                  </aside>
                </div>
              </article>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TrackOrderPage;
