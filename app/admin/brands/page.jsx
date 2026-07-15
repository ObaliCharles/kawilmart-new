'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const emptyForm = { name: '', sortOrder: 0, isActive: true, logoUrl: '' };

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [saving, setSaving] = useState(false);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/brands');
            if (data.success) setBrands(data.brands);
            else toast.error(data.message || 'Failed to load brands');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadBrands();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setLogoFile(null);
        setLogoPreview('');
    };

    const handleEdit = (brand) => {
        setEditingId(brand._id);
        setForm({
            name: brand.name,
            sortOrder: brand.sortOrder || 0,
            isActive: brand.isActive !== false,
            logoUrl: brand.logoUrl || '',
        });
        setLogoFile(null);
        setLogoPreview('');
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
            toast.error('Please choose a PNG, JPEG, WebP, or SVG logo');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo must be under 2MB');
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !form.name.trim()) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('sortOrder', String(form.sortOrder));
            formData.append('isActive', form.isActive ? 'true' : 'false');
            if (logoFile) formData.append('logo', logoFile);

            const data = editingId
                ? (await axios.patch(`/api/admin/brands/${editingId}`, formData)).data
                : (await axios.post('/api/admin/brands', formData)).data;

            if (data.success) {
                toast.success(editingId ? 'Brand updated' : 'Brand added');
                resetForm();
                await loadBrands();
            } else {
                toast.error(data.message || 'Could not save brand');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not save brand');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (brand) => {
        if (!window.confirm(`Delete "${brand.name}"?`)) return;
        try {
            const { data } = await axios.delete(`/api/admin/brands/${brand._id}`);
            if (data.success) {
                toast.success('Brand deleted');
                if (editingId === brand._id) resetForm();
                await loadBrands();
            } else {
                toast.error(data.message || 'Could not delete brand');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not delete brand');
        }
    };

    return (
        <div className="max-w-5xl space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-950">Top Brands</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                    Add brand logos for the &ldquo;Top Brands&rdquo; strip on category pages. The brand name must match how it
                    appears on products (e.g. &ldquo;Samsung&rdquo;) so its logo links to that brand&apos;s products.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl bg-white ring-1 ring-gray-100 p-4 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-semibold text-gray-600">Brand name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Samsung"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                        required
                    />
                </div>
                <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
                        Active
                    </label>
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Sort order</label>
                        <input
                            type="number"
                            value={form.sortOrder}
                            onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                            className="mt-1 w-24 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                        />
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Logo</label>
                    <div className="mt-1 flex items-center gap-3">
                        {(logoPreview || form.logoUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoPreview || form.logoUrl} alt="" className="h-14 w-24 rounded-lg object-contain p-1.5 ring-1 ring-gray-100" />
                        ) : (
                            <span className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">No logo</span>
                        )}
                        <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-700">
                            {(logoPreview || form.logoUrl) ? 'Change logo' : 'Upload logo'}
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoChange} />
                        </label>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">PNG/SVG with transparent background works best. Max 2MB.</p>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                    <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-60">
                        {editingId ? 'Save changes' : 'Add brand'}
                    </button>
                    {editingId ? <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">Cancel edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                {loading ? (
                    <div className="p-4 text-sm text-gray-500">Loading brands...</div>
                ) : brands.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No brands yet. Add one above.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Logo</th>
                                <th className="px-4 py-3">Brand</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand._id} className="border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-3">
                                        {brand.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={brand.logoUrl} alt={brand.name} className="h-8 w-16 object-contain" />
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{brand.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${brand.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {brand.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(brand)} className="mr-3 text-orange-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(brand)} className="text-rose-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
