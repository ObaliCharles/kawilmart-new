'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { ProductGridPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminProducts() {
    const { router, formatCurrency, getToken } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [deletingId, setDeletingId] = useState('');
    const [moderatingId, setModeratingId] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const { data } = await axios.get('/api/admin/products', { headers });
                if (isMounted) {
                    if (data.success) {
                        setProducts(data.products || []);
                    } else {
                        toast.error(data.message || 'Failed to load products');
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadProducts();

        return () => {
            isMounted = false;
        };
        // This page should load once on entry; the context recreates fetchProductData on re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categories = ['All', ...new Set(products.map(p => p.category))];
    const statuses = ['All', 'active', 'draft', 'hidden', 'rejected'];

    const filtered = products.filter(p => {
        const matchCat = filterCat === 'All' || p.category === filterCat;
        const matchStatus = filterStatus === 'All' || (p.productStatus || 'active') === filterStatus;
        const searchable = [p.name, p.category, p.seller?.name, p.seller?.email].join(' ').toLowerCase();
        const matchSearch = !search || searchable.includes(search.toLowerCase());
        return matchCat && matchStatus && matchSearch;
    });

    const refreshProducts = async () => {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.get('/api/admin/products', { headers });
        if (data.success) {
            setProducts(data.products || []);
        }
    };

    const deleteProduct = async (productId) => {
        if (!window.confirm('Delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingId(productId);
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post('/api/product/delete', { productId }, { headers });

            if (data.success) {
                toast.success(data.message || 'Product deleted');
                setProducts((current) => current.filter((product) => product._id !== productId));
            } else {
                toast.error(data.message || 'Failed to delete product');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to delete product');
        } finally {
            setDeletingId('');
        }
    };

    const updateModeration = async (productId, productStatus) => {
        try {
            setModeratingId(productId);
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const currentProduct = products.find((product) => product._id === productId);
            const moderationReason = ['hidden', 'rejected'].includes(productStatus)
                ? window.prompt('Reason shown in admin records:', currentProduct?.moderationReason || '')
                : currentProduct?.moderationReason || '';

            if (moderationReason === null) {
                return;
            }

            const { data } = await axios.patch('/api/admin/products', {
                productId,
                productStatus,
                moderationReason,
            }, { headers });

            if (data.success) {
                toast.success(data.message || 'Product updated');
                await refreshProducts();
            } else {
                toast.error(data.message || 'Failed to update product');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update product');
        } finally {
            setModeratingId('');
        }
    };

    if (loading) return <ProductGridPageSkeleton />;

    return (
        <div className="space-y-4 max-w-7xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-gray-950">Products</h1>
                    <p className="text-sm text-gray-500 mt-1">{filtered.length} of {products.length} products</p>
                </div>
                <button
                    onClick={() => router.push('/seller')}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-700 transition"
                >
                    + Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-56 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(cat)}
                            className={`px-3 py-2 rounded-lg text-sm transition ${
                                filterCat === cat
                                    ? 'bg-orange-600 text-white font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-2 rounded-lg text-sm capitalize transition ${
                                filterStatus === status
                                    ? 'bg-gray-950 text-white font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(product => {
                    const discount = product.price > product.offerPrice
                        ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
                        : null;
                    return (
                        <div
                            key={product._id}
                            className="group overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 transition hover:shadow-md"
                        >
                            <div className="relative h-40 bg-gray-50 flex items-center justify-center">
                                {discount && (
                                    <span className="absolute top-2 left-2 bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                                        -{discount}%
                                    </span>
                                )}
                                <Image
                                    src={product.image[0]}
                                    alt={product.name}
                                    width={120}
                                    height={120}
                                    className="h-32 w-auto object-contain group-hover:scale-105 transition"
                                />
                            </div>
                            <div className="p-3">
                                <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400">{product.seller?.name || 'Unknown seller'}</p>
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                    (product.productStatus || 'active') === 'active'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : (product.productStatus || 'active') === 'rejected'
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {product.productStatus || 'active'}
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-orange-600 font-bold text-sm">{formatCurrency(product.offerPrice)}</p>
                                    {product.price > product.offerPrice && (
                                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
                                    )}
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-1.5">
                                    <button
                                        onClick={() => router.push('/product/' + product._id)}
                                        className="rounded-full bg-orange-50 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => router.push('/seller?edit=' + product._id)}
                                        className="rounded-full bg-gray-100 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteProduct(product._id)}
                                        disabled={deletingId === product._id}
                                        className="rounded-full bg-red-50 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                    >
                                        {deletingId === product._id ? '...' : 'Delete'}
                                    </button>
                                </div>
                                <select
                                    value={product.productStatus || 'active'}
                                    disabled={moderatingId === product._id}
                                    onChange={(event) => updateModeration(product._id, event.target.value)}
                                    className="mt-1.5 w-full rounded-full bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700 outline-none ring-1 ring-gray-100 disabled:opacity-60"
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="hidden">Hidden</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                {product.moderationReason ? (
                                    <p className="mt-1 line-clamp-2 text-[10px] text-red-500">{product.moderationReason}</p>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <span className="text-4xl mb-2">🛍️</span>
                    <p>No products found</p>
                </div>
            )}
        </div>
    );
}
