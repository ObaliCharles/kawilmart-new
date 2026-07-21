'use client'

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import { useAppContext } from "@/context/AppContext";
import { useClerk, useUser } from "@clerk/nextjs";

const Icon = ({ type, className = "h-5 w-5" }) => {
  const paths = {
    home: "M4 11.5 12 5l8 6.5V20H4v-8.5ZM9.5 20v-5h5v5",
    work: "M3.5 8.5h17v11h-17v-11Zm5.5 0V6.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6.5v2",
    other: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    pin: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    phone: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z",
    edit: "m4 20 4.5-1L20 7.5a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z",
    trash: "M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0v12.5A1.5 1.5 0 0 1 15.5 21h-7A1.5 1.5 0 0 1 7 19.5V7",
    plus: "M12 5v14M5 12h14",
    shield: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Zm-2.6 8.6 2 2 3.8-4",
    star: "M12 4.2 14.4 9l5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 9.8 9.6 9 12 4.2Z",
    empty: "M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Zm0 0L12 13m0 0 8-4.5M12 13v7",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Each label gets its own icon and tint so the cards are scannable at a glance
// rather than three identical grey blocks.
const labelStyles = {
  Home: { icon: "home", tone: "bg-emerald-50 text-emerald-600" },
  Work: { icon: "work", tone: "bg-indigo-50 text-indigo-600" },
  Other: { icon: "other", tone: "bg-amber-50 text-amber-600" },
};

const getLabelStyle = (label) => labelStyles[label] || labelStyles.Other;

const formatLocationLines = (address) => {
  const line1 = [address.village, address.parish, address.subCounty].filter(Boolean).join(", ");
  const line2 = [address.city || address.area, address.district].filter(Boolean).join(", ");
  const line3 = [address.region || address.state, "Uganda"].filter(Boolean).join(", ");
  return [line1, line2, line3].filter(Boolean);
};

const AddressCardSkeleton = () => (
  <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
    <div className="flex gap-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
    </div>
  </div>
);

const AddressBookPage = () => {
  const { navigate, getToken } = useAppContext();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");

  const loadAddresses = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-address", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(data.success && Array.isArray(data.addresses) ? data.addresses : []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadAddresses();
  }, [isLoaded, user, loadAddresses]);

  const makeDefault = async (addressId) => {
    if (busyId) return;
    setBusyId(addressId);

    // Optimistic: the card badge moves immediately, and we reload from the
    // server afterwards so a failed write cannot leave a false default.
    setAddresses((current) => current.map((entry) => ({ ...entry, isDefault: entry._id === addressId })));

    try {
      const token = await getToken();
      const { data } = await axios.patch(`/api/user/address/${addressId}`, { isDefault: true }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) toast.error(data.message || "Could not update address");
      else toast.success("Default address updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update address");
    } finally {
      await loadAddresses();
      setBusyId("");
    }
  };

  const deleteAddress = async (addressId) => {
    if (busyId) return;
    setBusyId(addressId);

    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/user/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Address removed");
        setConfirmDeleteId("");
      } else {
        toast.error(data.message || "Could not remove address");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not remove address");
    } finally {
      await loadAddresses();
      setBusyId("");
    }
  };

  const addButton = (
    <button
      type="button"
      onClick={() => navigate("/add-address")}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-orange-700 active:scale-[0.99]"
    >
      <Icon type="plus" className="h-4 w-4" />
      Add New Address
    </button>
  );

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Address Book" showMobilePageSearch={false} />
      <main className="min-h-screen bg-[#f7f8fb] px-3 pb-8 pt-3 sm:px-6 md:pt-6">
        <div className="mx-auto max-w-3xl">
          <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl">Address Book</h1>
              <p className="mt-1 text-[12.5px] leading-5 text-gray-500">
                Manage your delivery addresses for a faster checkout experience.
              </p>
            </div>
            <span className="hidden sm:block">{addButton}</span>
          </header>

          {!isLoaded || loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => <AddressCardSkeleton key={index} />)}
            </div>
          ) : !user ? (
            <section className="rounded-2xl bg-white px-5 py-14 text-center ring-1 ring-gray-100">
              <p className="text-sm font-medium text-gray-700">Sign in to manage your addresses</p>
              <p className="mt-1 text-xs text-gray-500">Saved addresses make checkout a lot faster.</p>
              <button
                type="button"
                onClick={() => openSignIn()}
                className="mt-4 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700"
              >
                Sign in
              </button>
            </section>
          ) : addresses.length === 0 ? (
            <section className="rounded-2xl bg-white px-5 py-14 text-center ring-1 ring-gray-100">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Icon type="empty" className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-semibold text-gray-800">No saved addresses yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-500">
                Add one and it will be ready to pick at checkout.
              </p>
              <div className="mt-4 flex justify-center">{addButton}</div>
            </section>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => {
                const style = getLabelStyle(address.label);
                const lines = formatLocationLines(address);
                const isBusy = busyId === address._id;

                return (
                  <article
                    key={address._id}
                    className={`rounded-2xl bg-white p-4 shadow-sm ring-1 transition ${
                      address.isDefault ? "ring-orange-200" : "ring-gray-100"
                    } ${isBusy ? "opacity-60" : ""}`}
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.tone}`}>
                        <Icon type={style.icon} className="h-6 w-6" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            {address.isDefault ? (
                              <span className="mb-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Default
                              </span>
                            ) : null}
                            <h2 className="truncate text-[15px] font-bold text-gray-950">{address.label || "Address"}</h2>
                            <p className="truncate text-[12px] text-gray-500">{address.fullName}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => navigate(`/add-address?edit=${address._id}`)}
                              aria-label={`Edit ${address.label || "address"}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-orange-600 disabled:opacity-50"
                            >
                              <Icon type="edit" className="h-[17px] w-[17px]" />
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteId(address._id)}
                              aria-label={`Delete ${address.label || "address"}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Icon type="trash" className="h-[17px] w-[17px]" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex min-w-0 gap-2">
                          <span className="mt-0.5 shrink-0 text-gray-400"><Icon type="pin" className="h-4 w-4" /></span>
                          <div className="min-w-0 space-y-0.5">
                            {lines.map((line) => (
                              <p key={line} className="break-words text-[12.5px] leading-[18px] text-gray-600">{line}</p>
                            ))}
                          </div>
                        </div>

                        {address.phoneNumber ? (
                          <div className="mt-2 flex min-w-0 items-center gap-2">
                            <span className="shrink-0 text-gray-400"><Icon type="phone" className="h-4 w-4" /></span>
                            <p className="truncate text-[12.5px] text-gray-600">{address.phoneNumber}</p>
                          </div>
                        ) : null}

                        {address.landmark ? (
                          <p className="mt-2 break-words rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11.5px] leading-[16px] text-gray-500">
                            Landmark: {address.landmark}
                          </p>
                        ) : null}

                        {!address.isDefault ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => makeDefault(address._id)}
                            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-orange-600 transition hover:text-orange-700 disabled:opacity-50"
                          >
                            <Icon type="star" className="h-3.5 w-3.5" />
                            Set as default
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {confirmDeleteId === address._id ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-100">
                        <p className="min-w-0 text-[12px] font-medium text-red-800">Delete this address?</p>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId("")}
                            className="rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-gray-600 ring-1 ring-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void deleteAddress(address._id)}
                            className="rounded-full bg-red-600 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {isBusy ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          {user && addresses.length > 0 ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-[12px] leading-[17px] text-emerald-800 ring-1 ring-emerald-100">
              <span className="mt-px shrink-0 text-emerald-600"><Icon type="shield" className="h-4 w-4" /></span>
              Your addresses are safe and only used to deliver your orders.
            </p>
          ) : null}

          {/* On phones the primary action lives at the bottom, within thumb
              reach, matching the mobile layout. */}
          {user ? <div className="mt-4 sm:hidden">{React.cloneElement(addButton, { className: `${addButton.props.className} w-full` })}</div> : null}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AddressBookPage;
