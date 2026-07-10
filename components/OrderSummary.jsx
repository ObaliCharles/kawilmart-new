'use client'

import { useAppContext } from "@/context/AppContext";
import { DELIVERY_MODES, calculateDeliveryFee } from "@/lib/orderLifecycle";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {
  const {
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    products,
    resolvedCartItems,
    setCartItems,
    authReady,
    formatCurrency,
    fetchUserData,
    loadingProducts,
  } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(DELIVERY_MODES.DELIVERY);
  const cartAmount = getCartAmount();

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

    try {
      if (loadingProducts) return toast.error("Cart items are still loading. Please wait a moment.");
      if (!selectedAddress) return toast.error("Please select an address");

      const cartItemsArray = Object.entries(resolvedCartItems)
        .filter(([key, quantity]) => quantity > 0)
        .map(([key, quantity]) => ({ product: key, quantity }));

      if (cartItemsArray.length === 0) return toast.error("Cart is empty");

      setIsPlacingOrder(true);
      const token = await getToken();
      const { data } = await axios.post(
        "/api/order/create",
        {
          address: selectedAddress._id,
          items: cartItemsArray,
          deliveryMode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setCartItems({});
        await fetchUserData();
        toast.success(data.message);
        router.replace("/order-placed");
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
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    void fetchUserAddresses();
  }, [authReady, getToken, user]);

  return (
    <aside className="h-fit w-full min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-5">
      <h2 className="text-lg font-bold text-gray-950">Order Summary</h2>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-gray-700">Select Address</label>
          <div className="relative inline-block w-full rounded-md border border-gray-200 text-sm">
            <button
              type="button"
              className="peer flex w-full items-center gap-2 bg-white px-3 py-2.5 text-left text-gray-700 focus:outline-none sm:px-3.5"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isPlacingOrder}
            >
              <span className="min-w-0 flex-1 truncate">
                {selectedAddress
                  ? [
                    selectedAddress.fullName,
                    selectedAddress.village || selectedAddress.area,
                    selectedAddress.district || selectedAddress.city,
                    selectedAddress.region || selectedAddress.state,
                  ].filter(Boolean).join(", ")
                  : "Select Address"}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-md">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="cursor-pointer px-3 py-2 [overflow-wrap:anywhere] hover:bg-gray-500/10"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <p className="text-[13px] font-semibold text-gray-900">{address.fullName}</p>
                    <p className="text-[12px] text-gray-500">
                      {[address.village || address.area, address.district || address.city, address.region || address.state].filter(Boolean).join(", ")}
                    </p>
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="cursor-pointer px-3 py-2 text-center text-[13px] font-medium text-orange-600 hover:bg-gray-500/10"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-gray-700">Fulfillment</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeliveryMode(DELIVERY_MODES.DELIVERY)}
              className={`rounded-md border px-3 py-2.5 text-left transition ${
                deliveryMode === DELIVERY_MODES.DELIVERY
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-orange-200"
              }`}
            >
              <p className="text-[13px] font-semibold">Delivery</p>
              <p className="mt-1 text-[11px] text-gray-500">One rider will be assigned and must accept before contacts unlock.</p>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode(DELIVERY_MODES.PICKUP)}
              className={`rounded-md border px-3 py-2.5 text-left transition ${
                deliveryMode === DELIVERY_MODES.PICKUP
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-orange-200"
              }`}
            >
              <p className="text-[13px] font-semibold">Pickup</p>
              <p className="mt-1 text-[11px] text-gray-500">Collect directly from the seller after they accept your order.</p>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <label className="mb-2 block text-[13px] font-semibold text-gray-700">Promo Code</label>
          <div className="flex min-w-0 gap-2">
            <input
              type="text"
              placeholder="Enter promo code"
              className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-600 outline-none focus:border-orange-500"
            />
            <button type="button" className="shrink-0 rounded-md border border-orange-600 px-3.5 text-[13px] font-semibold text-orange-600 hover:bg-orange-50 sm:px-4">Apply</button>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-5">
          <div className="flex min-w-0 justify-between gap-3 text-sm">
            <p className="text-gray-600">Subtotal</p>
            <p className="min-w-0 text-right text-gray-800 [overflow-wrap:anywhere]">{formatCurrency(cartAmount)}</p>
          </div>
          <div className="flex min-w-0 justify-between gap-3 text-sm">
            <p className="text-gray-600">{deliveryMode === DELIVERY_MODES.PICKUP ? "Pickup Fee" : "Estimated Delivery Fee"}</p>
            <p className="min-w-0 text-right font-medium text-green-600 [overflow-wrap:anywhere]">{estimatedDeliveryFee === 0 ? "Free" : formatCurrency(estimatedDeliveryFee)}</p>
          </div>
          <div className="flex min-w-0 justify-between gap-3 border-t border-gray-200 pt-5 text-xl font-bold text-gray-950">
            <p>Total</p>
            <p className="min-w-0 text-right [overflow-wrap:anywhere]">{formatCurrency(totalAmount)}</p>
          </div>
          <p className="text-xs text-gray-500">
            Seller contact stays hidden until the seller accepts the order. Completed orders are confirmed inside the app.
          </p>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={isPlacingOrder || loadingProducts}
        className="mt-5 w-full rounded-md bg-orange-600 py-3 text-[15px] font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          {(isPlacingOrder || loadingProducts) && (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          )}
          {isPlacingOrder ? "Placing Order..." : loadingProducts ? "Loading cart..." : "Place Order"}
        </span>
      </button>
      <div className="mt-4 text-center">
        <p className="text-[11px] text-gray-400">We accept</p>
        <div className="mt-2 flex justify-center gap-2">
          {["VISA", "MC", "Pay"].map((item) => (
            <span key={item} className="rounded border border-gray-200 px-2.5 py-0.5 text-[11px] font-bold text-gray-500">{item}</span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
