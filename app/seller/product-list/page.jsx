'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import toast from "react-hot-toast";
import axios from 'axios';
import { ProductTablePageSkeleton } from "@/components/dashboard/DashboardSkeletons";

const ProductList = () => {
  const { router, getToken, user, authReady, formatCurrency } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSellerProduct = async () => {
    try {
      setLoading(true);
      setProducts([]);
      const token = await getToken();
      const { data } = await axios.get('/api/product/seller-list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setProducts(data.products || []);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }

    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady && user) {
      fetchSellerProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  const handleDeleteProduct = async (productId) => {
    const shouldDelete = window.confirm("Delete this product? This action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(productId);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post('/api/product/delete', { productId }, { headers });

      if (data.success) {
        setProducts((prevProducts) => prevProducts.filter((product) => product._id !== productId));
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const productRows = Array.isArray(products) ? products : [];

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <ProductTablePageSkeleton /> : (
        <div className="w-full space-y-4 p-3 sm:p-4 md:p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-950">All Products</h2>
            <p className="mt-0.5 text-xs text-gray-500">{productRows.length} listing{productRows.length === 1 ? '' : 's'}</p>
          </div>

          {/* Mobile: compact card list */}
          <div className="space-y-2 sm:hidden">
            {productRows.length === 0 ? (
              <div className="rounded-xl bg-white py-12 text-center text-sm text-gray-400 ring-1 ring-gray-100">
                No products found
              </div>
            ) : productRows.map((product, index) => (
              <div key={product._id || index} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-gray-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                  {product.image?.[0] ? (
                    <Image
                      src={product.image[0]}
                      alt={product.name || "product image"}
                      className="h-full w-full object-contain p-1"
                      width={48}
                      height={48}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-semibold text-gray-950">{product.name}</p>
                  <p className="text-[10px] text-gray-500">{product.category} · {formatCurrency(product.offerPrice)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => router.push(`/seller?edit=${product._id}`)}
                    className="rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-medium text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    disabled={deletingId === product._id}
                    className="rounded-full bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-700 disabled:opacity-60"
                  >
                    {deletingId === product._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden w-full max-w-5xl overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:block">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[640px] table-fixed">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="w-2/5 px-4 py-2.5 truncate">Product</th>
                    <th className="px-4 py-2.5 truncate">Category</th>
                    <th className="px-4 py-2.5 truncate">Price</th>
                    <th className="px-4 py-2.5 truncate">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-500">
                  {productRows.length > 0 ? (
                    productRows.map((product, index) => (
                      <tr key={product._id || index} className="transition hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                              {product.image?.[0] && (
                                <Image
                                  src={product.image[0]}
                                  alt={product.name || "product image"}
                                  className="h-full w-full object-contain p-1"
                                  width={44}
                                  height={44}
                                />
                              )}
                            </div>
                            <span className="min-w-0 truncate text-xs font-medium text-gray-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{product.category}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{formatCurrency(product.offerPrice)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => router.push(`/product/${product._id}`)}
                              className="flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-orange-700"
                            >
                              <span>Visit</span>
                              <Image
                                className="h-3"
                                src={assets.redirect_icon}
                                alt="redirect_icon"
                              />
                            </button>
                            <button
                              onClick={() => router.push(`/seller?edit=${product._id}`)}
                              className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              disabled={deletingId === product._id}
                              className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                            >
                              {deletingId === product._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-sm text-gray-400">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductList;
