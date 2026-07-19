'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";

const STATUS_META = {
    UNVERIFIED: { label: "Not verified", className: "bg-gray-100 text-gray-600" },
    PENDING: { label: "Under review", className: "bg-amber-50 text-amber-700" },
    VERIFIED: { label: "Verified", className: "bg-emerald-50 text-emerald-700" },
    REJECTED: { label: "Rejected", className: "bg-rose-50 text-rose-700" },
};

const SellerVerificationPage = () => {
    const { getToken, user, authReady } = useAppContext();
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchVerification = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/seller/verification', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) setVerification(data.verification);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) void fetchVerification();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || uploading) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please choose a JPEG, PNG, or WebP image');
            return;
        }
        if (file.size > 6 * 1024 * 1024) {
            toast.error('Image must be under 6MB');
            return;
        }

        setUploading(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('document', file);
            const { data } = await axios.post('/api/seller/verification', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                toast.success(data.message);
                await fetchVerification();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    const statusMeta = STATUS_META[verification?.status] || STATUS_META.UNVERIFIED;

    return (
        <div className="flex min-h-screen flex-1 flex-col justify-between">
            <div className="w-full max-w-2xl space-y-4 p-4 md:p-10">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-gray-950">Store Verification</h1>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Verified stores get a trust badge on their products and store page, priority support, and better conversion.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-xl bg-white p-6 text-sm text-gray-500 ring-1 ring-gray-100">Loading verification status...</div>
                ) : (
                    <>
                        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-gray-950">Status</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                    {statusMeta.label}
                                </span>
                            </div>
                            {verification?.notes ? (
                                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    <span className="font-semibold text-gray-800">Reviewer note:</span> {verification.notes}
                                </p>
                            ) : null}
                        </div>

                        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                            <p className="text-sm font-semibold text-gray-950">Verification documents</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Upload a clear photo of your national ID, business licence, or trading certificate. Up to 5 images, 6MB each.
                            </p>

                            {verification?.documents?.length ? (
                                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                                    {verification.documents.map((url, index) => (
                                        <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg ring-1 ring-gray-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`Verification document ${index + 1}`} className="aspect-square w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
                                    No documents uploaded yet
                                </p>
                            )}

                            {verification?.status !== 'VERIFIED' ? (
                                <label className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${uploading ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700'}`}>
                                    {uploading ? 'Uploading...' : '+ Upload document'}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={handleUpload} />
                                </label>
                            ) : (
                                <p className="mt-3 text-xs font-medium text-emerald-700">Your store is verified — no further action needed.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default SellerVerificationPage;
