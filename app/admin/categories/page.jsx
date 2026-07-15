'use client'
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { homeCategoryValues, getCategoryMeta } from '@/lib/marketplaceCategories';

const emptyForm = { name: '', icon: '', parentValue: '', sortOrder: 0, isActive: true, imageUrl: '', heroImage: '' };

const CategoryThumb = ({ category, fallback = '🏷️' }) => (
    category.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.imageUrl} alt="" className="mr-2 inline-block h-7 w-7 rounded-md object-contain align-middle" />
    ) : (
        <span className="mr-2 align-middle">{category.icon || fallback}</span>
    )
);

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [heroFile, setHeroFile] = useState(null);
    const [heroPreview, setHeroPreview] = useState('');
    const [saving, setSaving] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/categories');
            if (data.success) {
                setCategories(data.categories);
            } else {
                toast.error(data.message || 'Failed to load categories');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCategories();
    }, []);

    const customTopCategories = useMemo(
        () => categories.filter((category) => !category.parentValue),
        [categories]
    );

    const parentOptions = useMemo(() => {
        const staticOptions = homeCategoryValues.map((value) => ({ value, label: getCategoryMeta(value).label }));
        const customOptions = customTopCategories.map((category) => ({ value: category.name, label: category.name }));
        return [...staticOptions, ...customOptions].sort((a, b) => a.label.localeCompare(b.label));
    }, [customTopCategories]);

    const subcategoriesByParent = useMemo(() => {
        const map = new Map();
        categories.forEach((category) => {
            if (!category.parentValue) return;
            const list = map.get(category.parentValue) || [];
            list.push(category);
            map.set(category.parentValue, list);
        });
        return map;
    }, [categories]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setImageFile(null);
        setImagePreview('');
        setHeroFile(null);
        setHeroPreview('');
    };

    const handleEdit = (category) => {
        setEditingId(category._id);
        setForm({
            name: category.name,
            icon: category.icon || '',
            parentValue: category.parentValue || '',
            sortOrder: category.sortOrder || 0,
            isActive: category.isActive !== false,
            imageUrl: category.imageUrl || '',
            heroImage: category.heroImage || '',
        });
        setImageFile(null);
        setImagePreview('');
        setHeroFile(null);
        setHeroPreview('');
    };

    const validateImageFile = (file, maxMb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please choose a JPEG, PNG, or WebP image');
            return false;
        }
        if (file.size > maxMb * 1024 * 1024) {
            toast.error(`Image must be under ${maxMb}MB`);
            return false;
        }
        return true;
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file || !validateImageFile(file, 3)) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleHeroChange = (event) => {
        const file = event.target.files?.[0];
        if (!file || !validateImageFile(file, 5)) return;
        setHeroFile(file);
        setHeroPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !form.name.trim()) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('icon', form.icon);
            if (form.parentValue) formData.append('parentValue', form.parentValue);
            formData.append('sortOrder', String(form.sortOrder));
            formData.append('isActive', form.isActive ? 'true' : 'false');
            if (imageFile) formData.append('image', imageFile);
            if (heroFile) formData.append('heroImage', heroFile);

            const data = editingId
                ? (await axios.patch(`/api/admin/categories/${editingId}`, formData)).data
                : (await axios.post('/api/admin/categories', formData)).data;

            if (data.success) {
                toast.success(editingId ? 'Category updated' : 'Category added');
                resetForm();
                await loadCategories();
            } else {
                toast.error(data.message || 'Could not save category');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not save category');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!editingId) {
            setImageFile(null);
            setImagePreview('');
            setForm((prev) => ({ ...prev, imageUrl: '' }));
            return;
        }
        try {
            const formData = new FormData();
            formData.append('removeImage', 'true');
            const { data } = await axios.patch(`/api/admin/categories/${editingId}`, formData);
            if (data.success) {
                toast.success('Image removed');
                setImageFile(null);
                setImagePreview('');
                setForm((prev) => ({ ...prev, imageUrl: '' }));
                await loadCategories();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not remove image');
        }
    };

    const handleDelete = async (category) => {
        const isTop = !category.parentValue;
        const warning = isTop
            ? `Delete "${category.name}"? Only possible if it has no subcategories left.`
            : `Delete "${category.name}"? Products using it will keep their category but lose this subcategory tag.`;
        if (!window.confirm(warning)) return;

        try {
            const { data } = await axios.delete(`/api/admin/categories/${category._id}`);
            if (data.success) {
                toast.success('Category deleted');
                if (editingId === category._id) resetForm();
                await loadCategories();
            } else {
                toast.error(data.message || 'Could not delete category');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not delete category');
        }
    };

    return (
        <div className="max-w-5xl space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-950">Categories</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                    Manage subcategories (departments) shown under each top-level category, and add new top-level
                    categories when needed. This is the single source of truth for category browsing across the site —
                    products get tagged to a subcategory from here in the product form.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl bg-white ring-1 ring-gray-100 p-4 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-semibold text-gray-600">Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Snacks, or a new top-level category"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600">Emoji (fallback only)</label>
                    <input
                        type="text"
                        value={form.icon}
                        onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                        placeholder="🍫"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">Only shown if no image is uploaded.</p>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Category image (PNG of a representative product)</label>
                    <div className="mt-1 flex items-center gap-3">
                        {(imagePreview || form.imageUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imagePreview || form.imageUrl} alt="" className="h-16 w-16 rounded-lg object-contain p-1 ring-1 ring-gray-100" />
                        ) : (
                            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-2xl text-gray-400">{form.icon || '🖼️'}</span>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-700">
                                {(imagePreview || form.imageUrl) ? 'Change image' : 'Upload image'}
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                            </label>
                            {(imagePreview || form.imageUrl) ? (
                                <button type="button" onClick={handleRemoveImage} className="text-left text-[11px] font-medium text-rose-600 hover:underline">
                                    Remove image
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">Shown on the mobile home category rail. PNG with transparent background works best. Max 3MB.</p>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Category banner / background image (wide)</label>
                    <div className="mt-1 flex items-center gap-3">
                        {(heroPreview || form.heroImage) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={heroPreview || form.heroImage} alt="" className="h-16 w-28 rounded-lg object-cover ring-1 ring-gray-100" />
                        ) : (
                            <span className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xl text-gray-400">🖼️</span>
                        )}
                        <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-700">
                            {(heroPreview || form.heroImage) ? 'Change banner' : 'Upload banner'}
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleHeroChange} />
                        </label>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">Wide background shown at the top of this category/subcategory&apos;s product page. Max 5MB.</p>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Belongs under</label>
                    <select
                        value={form.parentValue}
                        onChange={(e) => setForm((prev) => ({ ...prev, parentValue: e.target.value }))}
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                    >
                        <option value="">Top-level category (no parent)</option>
                        {parentOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                        Leave blank to create a brand new top-level category (e.g. &quot;Groceries &amp; Supermarket&quot;).
                        Pick a parent to add a subcategory/department under it.
                    </p>
                </div>
                <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        />
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
                <div className="sm:col-span-2 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-60"
                    >
                        {editingId ? 'Save changes' : 'Add category'}
                    </button>
                    {editingId ? (
                        <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
                            Cancel edit
                        </button>
                    ) : null}
                </div>
            </form>

            {loading ? (
                <div className="rounded-xl bg-white ring-1 ring-gray-100 p-4 text-sm text-gray-500">Loading categories...</div>
            ) : (
                <div className="space-y-4">
                    {customTopCategories.length > 0 && (
                        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                            <div className="border-b border-gray-100 px-4 py-3">
                                <h2 className="text-sm font-bold text-gray-900">Admin-added top-level categories</h2>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {customTopCategories.map((category) => (
                                        <tr key={category._id} className="border-b border-gray-50 last:border-0">
                                            <td className="px-4 py-3">
                                                <CategoryThumb category={category} fallback="📦" />
                                                <span className="font-medium text-gray-900 align-middle">{category.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleEdit(category)} className="mr-3 text-orange-600 hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(category)} className="text-rose-600 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {parentOptions.map((parent) => {
                        const children = subcategoriesByParent.get(parent.value) || [];
                        if (children.length === 0) return null;

                        return (
                            <div key={parent.value} className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                                <div className="border-b border-gray-100 px-4 py-3">
                                    <h2 className="text-sm font-bold text-gray-900">{parent.label}</h2>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((category) => (
                                            <tr key={category._id} className="border-b border-gray-50 last:border-0">
                                                <td className="px-4 py-3">
                                                    <CategoryThumb category={category} />
                                                    <span className="font-medium text-gray-900 align-middle">{category.name}</span>
                                                    {!category.isActive && (
                                                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEdit(category)} className="mr-3 text-orange-600 hover:underline">Edit</button>
                                                    <button onClick={() => handleDelete(category)} className="text-rose-600 hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {categories.length === 0 && (
                        <div className="rounded-xl bg-white ring-1 ring-gray-100 p-4 text-sm text-gray-500">
                            No subcategories yet. Add one above — pick a top-level category as its parent.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
