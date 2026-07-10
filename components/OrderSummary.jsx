'use client'

import { useAppContext } from "@/context/AppContext";
import { DELIVERY_MODES, calculateDeliveryFee } from "@/lib/orderLifecycle";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {
  const {
    router,
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

  const formatAddressLine = (address) => [
    address.village || address.area,
    address.district || address.city,
    address.region || address.state,
  ].filter(Boolean).join(", ");

  return (
    <aside className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-gray-950">Order summary</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery address</label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/40 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:border-gray-300"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isPlacingOrder}
            >
              <span className="min-w-0 flex-1">
                {selectedAddress ? (
                  <>
                    <span className="block truncate font-medium text-gray-900">{selectedAddress.fullName}</span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">{formatAddressLine(selectedAddress)}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Select address</span>
                )}
              </span>
              <svg
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="cursor-pointer px-3 py-2.5 hover:bg-gray-50"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
                    <p className="text-xs text-gray-500">{formatAddressLine(address)}</p>
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="cursor-pointer border-t border-gray-100 px-3 py-2.5 text-center text-sm font-medium text-orange-600 hover:bg-orange-50"
                >
                  + Add new address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Fulfillment</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMode(DELIVERY_MODES.DELIVERY)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                deliveryMode === DELIVERY_MODES.DELIVERY
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold">Delivery</p>
              <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Rider assigned after seller accepts</p>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode(DELIVERY_MODES.PICKUP)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                deliveryMode === DELIVERY_MODES.PICKUP
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold">Pickup</p>
              <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Collect from seller after acceptance</p>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(cartAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{deliveryMode === DELIVERY_MODES.PICKUP ? "Pickup fee" : "Delivery fee"}</span>
            <span className="font-medium text-emerald-600">{estimatedDeliveryFee === 0 ? "Free" : formatCurrency(estimatedDeliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <span className="text-base font-bold text-gray-950">Total</span>
            <span className="text-base font-bold text-gray-950">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <p className="text-[11px] leading-4 text-gray-400">
          Seller contact unlocks after order acceptance. Confirm delivery in-app once you receive your items.
        </p>
      </div>

      <button
        onClick={createOrder}
        disabled={isPlacingOrder || loadingProducts}
        className="mt-4 w-full rounded-lg bg-orange-600 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          {(isPlacingOrder || loadingProducts) && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isPlacingOrder ? "Placing order..." : loadingProducts ? "Loading cart..." : "Place order"}
        </span>
      </button>
    </aside>
  );
};

export default OrderSummary;
