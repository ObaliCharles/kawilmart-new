'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { ProductGridPageSkeleton } from '@/components/dashboard/DashboardSkeletons';

export default function AdminProducts() {
    const { products, fetchProductData, router, formatCurrency } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setLoading(true);
            try {
                await fetchProductData();
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

    const filtered = products.filter(p => {
        const matchCat = filterCat === 'All' || p.category === filterCat;
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

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
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-orange-600 font-bold text-sm">{formatCurrency(product.offerPrice)}</p>
                                    {product.price > product.offerPrice && (
                                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => router.push('/product/' + product._id)}
                                    className="mt-2 w-full rounded-full bg-orange-50 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                                >
                                    View Product
                                </button>
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
