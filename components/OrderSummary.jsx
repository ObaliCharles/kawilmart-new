'use client'

import { useAppContext } from "@/context/AppContext";
import { DELIVERY_MODES, PAYMENT_METHODS, calculateDeliveryFee } from "@/lib/orderLifecycle";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const PAYMENT_METHOD_SAVE_KEY = "kw_checkout_payment_method";

const PAYMENT_OPTIONS = [
  {
    value: PAYMENT_METHODS.COD,
    label: "Cash on Delivery",
    hint: "Pay when you receive it",
    mark: <span className="text-[9px] font-bold text-gray-600">CASH</span>,
  },
  {
    value: PAYMENT_METHODS.MTN_MOMO,
    label: "MTN Mobile Money",
    hint: "Pay the rider via MoMo",
    mark: <span className="rounded-sm bg-[#FFCC00] px-1 py-0.5 text-[8px] font-black leading-none text-black">MTN</span>,
  },
  {
    value: PAYMENT_METHODS.AIRTEL_MONEY,
    label: "Airtel Money",
    hint: "Pay the rider via Airtel",
    mark: <span className="text-[9px] font-black lowercase text-[#E40000]">airtel</span>,
  },
];

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
};

const OrderSummary = () => {
  const {
    navigate,
    getCartAmount,
    getToken,
    user,
    authReady,
    products,
    resolvedCartItems,
    setCartItems,
    formatCurrency,
    fetchUserData,
  } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(DELIVERY_MODES.DELIVERY);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  // One idempotency key per checkout attempt: reused across retries of the
  // same cart, regenerated after a successful order.
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const cartAmount = getCartAmount();

  // Auto-save: restore the shopper's last payment choice.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PAYMENT_METHOD_SAVE_KEY);
      if (saved && Object.values(PAYMENT_METHODS).includes(saved)) {
        setPaymentMethod(saved);
      }
    } catch {
      // Storage unavailable — default stands.
    }
  }, []);

  const choosePaymentMethod = (method) => {
    setPaymentMethod(method);
    try {
      window.localStorage.setItem(PAYMENT_METHOD_SAVE_KEY, method);
    } catch {
      // Best-effort persistence only.
    }
  };
  const cartItemCount = Object.values(resolvedCartItems).filter((quantity) => quantity > 0).length;

  const estimatedDeliveryFee = useMemo(() => {
    if (!selectedAddress || deliveryMode === DELIVERY_MODES.PICKUP) {
      return 0;
    }

    const sellerLocations = new Map();

    Object.entries(resolvedCartItems).forEach(([productId, quantity]) => {
      if (quantity <= 0) {
        return;
      }

      const product = products.find((entry) => entry._id === productId);
      if (!product?.userId) {
        return;
      }

      if (!sellerLocations.has(product.userId)) {
        sellerLocations.set(product.userId, product.sellerLocation || product.location || "");
      }
    });

    return Array.from(sellerLocations.values()).reduce((sum, sellerLocation) => sum + calculateDeliveryFee({
      deliveryMode,
      sellerLocation,
      address: selectedAddress,
    }), 0);
  }, [deliveryMode, products, resolvedCartItems, selectedAddress]);

  const totalAmount = cartAmount + estimatedDeliveryFee;

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const createOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    if (!authReady) {
      return;
    }

    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/sign-in");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select an address");
      return;
    }

    const cartItemsArray = Object.entries(resolvedCartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => ({ product: key, quantity }));

    if (cartItemsArray.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/order/create",
        {
          address: selectedAddress._id,
          items: cartItemsArray,
          deliveryMode,
          paymentMethod,
          idempotencyKey: idempotencyKeyRef.current,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.requiresPayment && data.redirectUrl) {
        // Gateway checkout: the order is not confirmed yet, so leave the cart
        // and the idempotency key alone — if the shopper abandons the payment
        // page, retrying reuses the same key instead of duplicating the order.
        toast.success(data.message || "Redirecting to payment");
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.success) {
        idempotencyKeyRef.current = createIdempotencyKey();
        setCartItems({});
        toast.success(data.message || "Order placed");
        navigate("/order-placed", { scroll: true });
        void fetchUserData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }

    const fetchUserAddresses = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/user/get-address", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          setUserAddresses(data.addresses);
          if (data.addresses.length > 0) {
            setSelectedAddress(data.addresses[0]);
          }
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    void fetchUserAddresses();
  }, [authReady, getToken, user]);

  const formatAddressLine = (address) => [
    address.village || address.area,
    address.district || address.city,
    address.region || address.state,
  ].filter(Boolean).join(", ");

  return (
    <aside className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-950">Summary</h2>
        <span className="text-[11px] text-gray-500">{cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span>
      </div>

      {/* Step indicator: cart → address → payment → place order */}
      <div className="mt-2 flex items-center gap-1">
        {[
          ["Cart", cartItemCount > 0],
          ["Address", Boolean(selectedAddress)],
          ["Payment", Boolean(paymentMethod)],
        ].map(([label, done], index) => (
          <React.Fragment key={label}>
            {index > 0 ? <span className={`h-px flex-1 ${done ? "bg-orange-400" : "bg-gray-200"}`} /> : null}
            <span className="flex items-center gap-1">
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${done ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {done ? "✓" : index + 1}
              </span>
              <span className={`text-[9.5px] font-semibold ${done ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-2.5 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Address</label>
            <button
              type="button"
              onClick={() => navigate("/add-address")}
              className="text-[10px] font-semibold text-orange-600"
            >
              + Add
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-left text-[11px] text-gray-700"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isPlacingOrder}
            >
              <span className="min-w-0 flex-1 truncate">
                {selectedAddress
                  ? `${selectedAddress.fullName} · ${formatAddressLine(selectedAddress)}`
                  : userAddresses.length === 0
                    ? "No address — add one"
                    : "Select address"}
              </span>
              <svg className={`h-3 w-3 shrink-0 text-gray-400 ${isDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-100">
                {userAddresses.map((address, index) => (
                  <li
                    key={address._id || index}
                    className="cursor-pointer px-2 py-1.5 hover:bg-gray-50"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <p className="truncate text-[11px] font-medium text-gray-900">{address.fullName}</p>
                    <p className="truncate text-[10px] text-gray-500">{formatAddressLine(address)}</p>
                  </li>
                ))}
                {userAddresses.length === 0 ? (
                  <li
                    onClick={() => navigate("/add-address")}
                    className="cursor-pointer px-2 py-1.5 text-center text-[11px] font-medium text-orange-600 hover:bg-orange-50"
                  >
                    Add delivery address
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Fulfillment</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              [DELIVERY_MODES.DELIVERY, "Delivery"],
              [DELIVERY_MODES.PICKUP, "Pickup"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDeliveryMode(mode)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                  deliveryMode === mode
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Payment</label>
          <div className="space-y-1.5">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = paymentMethod === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => choosePaymentMethod(option.value)}
                  disabled={isPlacingOrder}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                    isSelected ? "bg-orange-50 ring-1 ring-orange-300" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-orange-600" : "border-gray-300"}`}>
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-orange-600" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-gray-900">{option.label}</span>
                    <span className="block truncate text-[9.5px] text-gray-500">{option.hint}</span>
                  </span>
                  <span className="flex h-5 shrink-0 items-center rounded bg-white px-1.5 shadow-sm">{option.mark}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-100 pt-2 text-[11px]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(cartAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{deliveryMode === DELIVERY_MODES.PICKUP ? "Pickup" : "Delivery"}</span>
            <span className="font-medium text-emerald-600">{estimatedDeliveryFee === 0 ? "Free" : formatCurrency(estimatedDeliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1.5 text-sm font-bold text-gray-950">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={createOrder}
        disabled={isPlacingOrder || cartItemCount === 0}
        className="mt-2.5 w-full rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center justify-center gap-2">
          {isPlacingOrder ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Placing...
            </>
          ) : (
            "Place order"
          )}
        </span>
      </button>

      {/* Payment trust row: recognized payment marks + security note lift
          checkout confidence right at the point of commitment. */}
      <div className="mt-2.5 border-t border-gray-100 pt-2.5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="flex h-6 items-center rounded bg-gray-50 px-1.5 text-[9px] font-black italic tracking-tight text-[#1A1F71]">VISA</span>
          <span className="flex h-6 items-center rounded bg-gray-50 px-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EB001B]" />
            <span className="-ml-1 h-3 w-3 rounded-full bg-[#F79E1B] mix-blend-multiply" />
          </span>
          <span className="flex h-6 items-center rounded bg-[#FFCC00] px-1.5 text-[8px] font-black text-black">MTN MoMo</span>
          <span className="flex h-6 items-center rounded bg-gray-50 px-1.5 text-[9px] font-black lowercase text-[#E40000]">airtel money</span>
          <span className="flex h-6 items-center rounded bg-gray-50 px-1.5 text-[8.5px] font-bold text-gray-600">Cash on delivery</span>
        </div>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[10px] text-gray-400">
          <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Secure checkout · Your details are protected
        </p>
      </div>
    </aside>
  );
};

export default OrderSummary;