'use client'

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";
import { getDistrictProfile, getRegionMeta, ugandaRegions } from "@/lib/ugandaLocations";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const deliveryPillOptions = [
    { label: "Call before arrival", value: "call_before_arrival", icon: "phone" },
    { label: "Leave with security", value: "leave_with_security", icon: "shield" },
    { label: "Deliver to doorstep", value: "deliver_to_doorstep", icon: "door" },
    { label: "Fragile package", value: "fragile_package", icon: "fragile" },
];

const selectedPlaceStyle = "border-orange-500 bg-orange-50 text-orange-700";
const unselectedPlaceStyle = "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50";

const iconMap = {
    truck: "M3 7h9v8H3V7Zm9 2h4l3 3v3h-7V9Zm-6 10a2 2 0 1 0 0 .1m11 0a2 2 0 1 0 0 .1",
    shield: "M12 3l7 3v5c0 4.5-3.2 8.8-7 10-3.8-1.2-7-5.5-7-10V6l7-3Z",
    star: "M12 4.2 14.8 9l5.2.8-3.8 3.8.9 5.2-5.1-2.7-5.1 2.7.9-5.2L4 9.8 9.2 9 12 4.2Z",
    phone: "M6.8 3.8h2.7L11 8.1 9.2 9.6c1.4 3.1 3.8 5.5 6.9 6.9l1.5-1.8 4.3 1.5v2.7c0 1-0.8 1.9-1.8 1.9C9.3 20.8 3.2 14.7 3.2 7.2c0-1 .8-1.9 1.8-1.9Z",
    door: "M6 4h10v16H6V4Zm3 8h2",
    fragile: "M9 3h6l2 5-5 13-5-13 2-5Zm3 5v6m-2 0h4",
    check: "M20 6 9 17l-5-5",
    pin: "M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
    bookmark: "M6.5 4h11v16l-5.5-4-5.5 4V4Z",
};

const SectionCard = ({ index, title, icon = "pin", children }) => (
    <section className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.03)] sm:p-4">
        <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d={iconMap[icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <h3 className="text-[14px] font-extrabold text-gray-950">
                {index ? `${index}. ` : ""}
                {title}
            </h3>
        </div>
        {children}
    </section>
);

const FieldLabel = ({ children, required = false }) => (
    <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
        {children}
        {required ? <span className="ml-1 text-orange-500">*</span> : null}
    </label>
);

const Input = ({ className = "", ...props }) => (
    <input
        {...props}
        className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 ${className}`.trim()}
    />
);

const Select = ({ className = "", ...props }) => (
    <select
        {...props}
        className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 ${className}`.trim()}
    />
);

const TextArea = ({ className = "", ...props }) => (
    <textarea
        {...props}
        className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 ${className}`.trim()}
    />
);

const AddAddress = () => {
    const { getToken, router } = useAppContext();

    const [address, setAddress] = useState({
        label: "Home",
        fullName: "",
        phoneNumber: "",
        alternatePhone: "",
        region: "Central Region",
        district: "Kampala",
        county: "",
        subCounty: "",
        parish: "",
        village: "",
        housePlot: "",
        roadStreet: "",
        landmark: "",
        deliveryNotes: "",
        postalCode: "",
        deliveryPreferences: [],
        isDefault: true,
        latitude: null,
        longitude: null,
    });
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
    const [capturingLocation, setCapturingLocation] = useState(false);

    const captureGpsLocation = () => {
        if (capturingLocation) return;
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            toast.error("Location is not supported on this device");
            return;
        }

        setCapturingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setAddress((current) => ({
                    ...current,
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6)),
                }));
                setCapturingLocation(false);
                toast.success("Location pinned — riders will find you faster");
            },
            () => {
                setCapturingLocation(false);
                toast.error("Could not get your location. Check location permissions.");
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    const selectedRegionMeta = useMemo(() => getRegionMeta(address.region), [address.region]);
    const selectedDistrictProfile = useMemo(() => getDistrictProfile(address.district), [address.district]);
    const districtOptions = selectedRegionMeta.districts;

    useEffect(() => {
        if (!districtOptions.some((district) => district.value === address.district)) {
            setAddress((current) => ({ ...current, district: districtOptions[0]?.value || "" }));
        }
    }, [districtOptions, address.district]);

    useEffect(() => {
        let isMounted = true;

        const loadSavedAddresses = async () => {
            try {
                setLoadingSavedAddresses(true);
                const token = await getToken();
                const { data } = await axios.get("/api/user/get-address", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!isMounted) return;

                if (data.success) {
                    setSavedAddresses(Array.isArray(data.addresses) ? data.addresses : []);
                } else {
                    setSavedAddresses([]);
                }
            } catch (error) {
                if (isMounted) {
                    setSavedAddresses([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingSavedAddresses(false);
                }
            }
        };

        void loadSavedAddresses();

        return () => {
            isMounted = false;
        };
    }, [getToken]);

    const togglePreference = (value) => {
        setAddress((current) => {
            const hasPreference = current.deliveryPreferences.includes(value);
            return {
                ...current,
                deliveryPreferences: hasPreference
                    ? current.deliveryPreferences.filter((entry) => entry !== value)
                    : [...current.deliveryPreferences, value],
            };
        });
    };

    const submitAddress = async (event) => {
        event.preventDefault();

        if (!address.fullName.trim()) return toast.error("Please enter the recipient name");
        if (!address.phoneNumber.trim()) return toast.error("Please enter a phone number");
        if (!address.region.trim()) return toast.error("Please select a region");
        if (!address.district.trim()) return toast.error("Please select a district");
        if (!address.village.trim()) return toast.error("Please enter a village or zone");

        try {
            const token = await getToken();
            const areaParts = [
                address.housePlot,
                address.roadStreet,
                address.village,
                address.parish,
                address.subCounty,
                address.county,
                address.landmark,
            ].filter(Boolean);

            const payload = {
                label: address.label,
                fullName: address.fullName.trim(),
                phoneNumber: address.phoneNumber.trim(),
                alternatePhone: address.alternatePhone.trim(),
                region: address.region,
                district: address.district,
                county: address.county.trim(),
                subCounty: address.subCounty.trim(),
                parish: address.parish.trim(),
                village: address.village.trim(),
                housePlot: address.housePlot.trim(),
                roadStreet: address.roadStreet.trim(),
                landmark: address.landmark.trim(),
                deliveryNotes: address.deliveryNotes.trim(),
                postalCode: address.postalCode.trim(),
                deliveryPreferences: address.deliveryPreferences,
                isDefault: address.isDefault,
                latitude: address.latitude,
                longitude: address.longitude,
                state: address.region,
                city: address.district,
                area: areaParts.join(", ") || `${address.village}, ${address.district}`,
                pincode: address.postalCode.trim(),
            };

            const { data } = await axios.post("/api/user/add-address", { address: payload }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                toast.success(data.message || "Address saved successfully");
                router.push("/address-book");
            } else {
                toast.error(data.message || "Unable to save address");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Something went wrong");
        }
    };

    return (
        <>
            <Navbar hideMobileHeader mobilePageTitle="Add Address" />
            <div className="min-h-screen bg-[#fafafa] px-4 py-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
                <div className="mx-auto max-w-[1540px]">
                    <div className="mb-4 hidden items-center justify-between md:flex">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-orange-600"
                        >
                            <span className="text-lg leading-none text-orange-500">←</span>
                            Back to Address Book
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="min-w-0">
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-sm">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M4 11.5 12 5l8 6.5V20H4v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h1 className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-[1.75rem]">Add Delivery Address</h1>
                                        <p className="mt-0.5 text-[12px] leading-5 text-gray-500 sm:text-[13px]">
                                            Accurate details get your order to the right door.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={submitAddress} className="space-y-4">
                                <SectionCard index={1} title="Contact Information" icon="phone">
                                    {/* Label drives the card icon and title in
                                        the address book, so it is chosen first. */}
                                    <div className="mb-3">
                                        <FieldLabel required>Label this address</FieldLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { value: "Home", icon: "door" },
                                                { value: "Work", icon: "shield" },
                                                { value: "Other", icon: "pin" },
                                            ].map((option) => {
                                                const active = address.label === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setAddress((current) => ({ ...current, label: option.value }))}
                                                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${active ? selectedPlaceStyle : unselectedPlaceStyle}`}
                                                    >
                                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d={iconMap[option.icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        {option.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div>
                                            <FieldLabel required>Full Name</FieldLabel>
                                            <Input
                                                placeholder="e.g. John Okello"
                                                value={address.fullName}
                                                onChange={(event) => setAddress((current) => ({ ...current, fullName: event.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel required>Phone Number</FieldLabel>
                                            <Input
                                                placeholder="+256 7XX XXX XXX"
                                                value={address.phoneNumber}
                                                onChange={(event) => setAddress((current) => ({ ...current, phoneNumber: event.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel>Alternative Phone (Optional)</FieldLabel>
                                            <Input
                                                placeholder="+256 7XX XXX XXX"
                                                value={address.alternatePhone}
                                                onChange={(event) => setAddress((current) => ({ ...current, alternatePhone: event.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard index={2} title="Administrative Location" icon="pin">
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div>
                                            <FieldLabel required>Region</FieldLabel>
                                            <Select
                                                value={address.region}
                                                onChange={(event) => setAddress((current) => ({
                                                    ...current,
                                                    region: event.target.value,
                                                    district: getRegionMeta(event.target.value).districts[0]?.value || "",
                                                }))}
                                            >
                                                {ugandaRegions.map((region) => (
                                                    <option key={region.value} value={region.value}>{region.label}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel required>District</FieldLabel>
                                            <Select
                                                value={address.district}
                                                onChange={(event) => setAddress((current) => ({ ...current, district: event.target.value }))}
                                            >
                                                {districtOptions.map((district) => (
                                                    <option key={district.value} value={district.value}>{district.label}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel>County / Municipality</FieldLabel>
                                            <Input
                                                placeholder="e.g. Nakawa Municipality"
                                                value={address.county}
                                                onChange={(event) => setAddress((current) => ({ ...current, county: event.target.value }))}
                                                list="county-suggestions"
                                            />
                                            <datalist id="county-suggestions">
                                                <option value="Municipality" />
                                                <option value="County" />
                                                <option value="Division" />
                                                <option value="Town Council" />
                                            </datalist>
                                        </div>
                                        <div>
                                            <FieldLabel>Sub County / Division</FieldLabel>
                                            <Input
                                                placeholder="e.g. Makindye Division"
                                                value={address.subCounty}
                                                onChange={(event) => setAddress((current) => ({ ...current, subCounty: event.target.value }))}
                                                list="subcounty-suggestions"
                                            />
                                            <datalist id="subcounty-suggestions">
                                                {selectedDistrictProfile.localities.map((item) => (
                                                    <option key={item} value={item} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <FieldLabel>Parish / Ward</FieldLabel>
                                            <Input
                                                placeholder="e.g. Kisozi Parish"
                                                value={address.parish}
                                                onChange={(event) => setAddress((current) => ({ ...current, parish: event.target.value }))}
                                                list="parish-suggestions"
                                            />
                                            <datalist id="parish-suggestions">
                                                {selectedDistrictProfile.localities.map((item) => (
                                                    <option key={item} value={`${item} Parish`} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <FieldLabel required>Village / Zone</FieldLabel>
                                            <Input
                                                placeholder="e.g. Ntinda Zone / Kisenyi"
                                                value={address.village}
                                                onChange={(event) => setAddress((current) => ({ ...current, village: event.target.value }))}
                                                list="village-suggestions"
                                            />
                                            <datalist id="village-suggestions">
                                                {selectedDistrictProfile.localities.map((item) => (
                                                    <option key={item} value={item} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                </SectionCard>

                                <SectionCard index={3} title="Exact Delivery Address" icon="door">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
                                        <div>
                                            <FieldLabel required>House / Plot / Building Name</FieldLabel>
                                            <Input
                                                placeholder="e.g. House No. 12, Plot 45"
                                                value={address.housePlot}
                                                onChange={(event) => setAddress((current) => ({ ...current, housePlot: event.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel>Road / Street</FieldLabel>
                                            <Input
                                                placeholder="e.g. Acacia Avenue"
                                                value={address.roadStreet}
                                                onChange={(event) => setAddress((current) => ({ ...current, roadStreet: event.target.value }))}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FieldLabel required>Nearest Landmark</FieldLabel>
                                            <Input
                                                placeholder="e.g. Near Total Fuel Station, Opposite Stanbic Bank"
                                                value={address.landmark}
                                                onChange={(event) => setAddress((current) => ({ ...current, landmark: event.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
                                        <span className="min-w-0 flex-1 text-[13px]">
                                            {address.latitude != null && address.longitude != null
                                                ? `GPS pinned: ${address.latitude}, ${address.longitude}`
                                                : "Landmarks help riders find you. Pin your GPS location for door-level accuracy."}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={captureGpsLocation}
                                            disabled={capturingLocation}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                                        >
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d={iconMap.pin} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {capturingLocation ? "Locating..." : address.latitude != null ? "Update pin" : "Use my location"}
                                        </button>
                                    </div>
                                </SectionCard>

                                <SectionCard index={4} title="Delivery Instructions" icon="truck">
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
                                        <div>
                                            <FieldLabel>Delivery Preferences</FieldLabel>
                                            <div className="flex flex-wrap gap-2">
                                                {deliveryPillOptions.map((option) => {
                                                    const active = address.deliveryPreferences.includes(option.value);
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => togglePreference(option.value)}
                                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12px] font-medium transition ${active ? selectedPlaceStyle : unselectedPlaceStyle}`}
                                                        >
                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                                <path d={iconMap[option.icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <FieldLabel>Additional Notes (Optional)</FieldLabel>
                                            <div className="relative">
                                                <TextArea
                                                    rows={5}
                                                    maxLength={250}
                                                    placeholder="Any special instructions for our rider..."
                                                    value={address.deliveryNotes}
                                                    onChange={(event) => setAddress((current) => ({ ...current, deliveryNotes: event.target.value }))}
                                                />
                                                <span className="absolute bottom-2.5 right-3 text-[11px] text-gray-400">
                                                    {address.deliveryNotes.length}/250
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={address.isDefault}
                                                onChange={(event) => setAddress((current) => ({ ...current, isDefault: event.target.checked }))}
                                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            Set as default address
                                        </label>

                                        <button
                                            type="submit"
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:brightness-105"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d="M3 4h3l2 10h9l2-5H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 20h.01M17 20h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Save Delivery Address
                                        </button>
                                    </div>
                                </SectionCard>
                            </form>
                        </div>

                        <aside className="space-y-3 xl:sticky xl:top-6 xl:self-start">
                            {/* Saved addresses lead: this panel is the actual
                                "address book", so it should not sit below three
                                cards of marketing copy. */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-gray-950">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d={iconMap.bookmark} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        Saved addresses
                                    </h3>
                                    <span className="text-[11px] font-semibold text-gray-400">
                                        {loadingSavedAddresses ? "Loading..." : `${savedAddresses.length} saved`}
                                    </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {savedAddresses.length > 0 ? (
                                        savedAddresses.map((saved) => (
                                            <button
                                                key={saved._id}
                                                type="button"
                                                onClick={() => setAddress((current) => ({
                                                    ...current,
                                                    fullName: saved.fullName || current.fullName,
                                                    phoneNumber: saved.phoneNumber || current.phoneNumber,
                                                    alternatePhone: saved.alternatePhone || current.alternatePhone,
                                                    region: saved.region || current.region,
                                                    district: saved.district || current.district,
                                                    county: saved.county || current.county,
                                                    subCounty: saved.subCounty || current.subCounty,
                                                    parish: saved.parish || current.parish,
                                                    village: saved.village || current.village,
                                                    housePlot: saved.housePlot || current.housePlot,
                                                    roadStreet: saved.roadStreet || current.roadStreet,
                                                    landmark: saved.landmark || current.landmark,
                                                    postalCode: saved.postalCode || current.postalCode,
                                                }))}
                                                className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition hover:border-orange-300 hover:bg-orange-50"
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d={iconMap.pin} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[12.5px] font-bold text-gray-950">{saved.fullName}</span>
                                                    <span className="block truncate text-[11.5px] text-gray-500">
                                                        {[saved.area, saved.city, saved.state].filter(Boolean).join(", ")}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-[11px] font-semibold text-orange-600">Use</span>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-[12px] leading-5 text-gray-500">
                                            No saved addresses yet. The one you add here will appear in this list.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Area context, condensed from three separate cards
                                into one. Localities render as chips so the list
                                stays scannable instead of a comma run-on. */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-[14px] font-extrabold text-gray-950">Delivery area</h3>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-700">
                                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d={iconMap.check} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        We deliver here
                                    </span>
                                </div>

                                <dl className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                                        <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Region</dt>
                                        <dd className="mt-0.5 truncate text-[12.5px] font-bold text-gray-950">{selectedRegionMeta.label}</dd>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                                        <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">District</dt>
                                        <dd className="mt-0.5 truncate text-[12.5px] font-bold text-gray-950">{address.district}</dd>
                                    </div>
                                </dl>

                                {selectedDistrictProfile.localities.length > 0 ? (
                                    <div className="mt-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Common areas</p>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {selectedDistrictProfile.localities.slice(0, 5).map((locality) => (
                                                <button
                                                    key={locality}
                                                    type="button"
                                                    onClick={() => setAddress((current) => ({ ...current, village: locality }))}
                                                    className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                                                >
                                                    {locality}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Three tips, three distinct icons, one line each. */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                                <h3 className="text-[14px] font-extrabold text-gray-950">Getting it right</h3>
                                <ul className="mt-3 space-y-2.5">
                                    {[
                                        { icon: "clock", tone: "bg-sky-50 text-sky-600", body: "A precise village and landmark cuts delivery time." },
                                        { icon: "pin", tone: "bg-orange-50 text-orange-600", body: "Pin your GPS for door-level accuracy." },
                                        { icon: "phone", tone: "bg-emerald-50 text-emerald-600", body: "Riders call before arriving — keep your number reachable." },
                                    ].map((item) => (
                                        <li key={item.icon} className="flex items-start gap-2.5">
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}>
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d={iconMap[item.icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                            <span className="text-[12px] leading-[17px] text-gray-600">{item.body}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;
