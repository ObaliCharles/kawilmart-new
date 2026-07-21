'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const colorOptions = [
    { value: 'orange', label: 'Orange', swatch: 'bg-orange-500' },
    { value: 'green', label: 'Green', swatch: 'bg-emerald-500' },
    { value: 'blue', label: 'Blue', swatch: 'bg-sky-500' },
    { value: 'red', label: 'Red', swatch: 'bg-rose-500' },
    { value: 'purple', label: 'Purple', swatch: 'bg-violet-500' },
    { value: 'gray', label: 'Gray', swatch: 'bg-gray-500' },
];

const colorSwatchClass = (color) => colorOptions.find((c) => c.value === color)?.swatch || 'bg-gray-400';

const emptyForm = { name: '', slug: '', description: '', color: 'orange', isActive: true, sortOrder: 0 };

export default function AdminTagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadTags = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/tags');
            if (data.success) {
                setTags(data.tags);
            } else {
                toast.error(data.message || 'Failed to load tags');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTags();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleEdit = (tag) => {
        setEditingId(tag._id);
        setForm({
            name: tag.name,
            slug: tag.slug,
            description: tag.description || '',
            color: tag.color || 'orange',
            isActive: tag.isActive !== false,
            sortOrder: tag.sortOrder || 0,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !form.name.trim()) return;

        setSaving(true);
        try {
            const data = editingId
                ? (await axios.patch(`/api/admin/tags/${editingId}`, form)).data
                : (await axios.post('/api/admin/tags', form)).data;

            if (data.success) {
                toast.success(editingId ? 'Tag updated' : 'Tag created');
                resetForm();
                await loadTags();
            } else {
                toast.error(data.message || 'Could not save tag');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not save tag');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tag) => {
        if (!window.confirm(`Delete "${tag.name}"? It will be removed from any products using it.`)) return;

        try {
            const { data } = await axios.delete(`/api/admin/tags/${tag._id}`);
            if (data.success) {
                toast.success('Tag deleted');
                if (editingId === tag._id) resetForm();
                await loadTags();
            } else {
                toast.error(data.message || 'Could not delete tag');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not delete tag');
        }
    };

    return (
        <div className="max-w-5xl space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-950">Tags</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                    Manage merchandising tags like Featured or Clearance. New Arrival, Trending, and Flash Deal badges
                    are computed automatically and don&apos;t need to be created here.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl bg-white ring-1 ring-gray-100 p-4 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-semibold text-gray-600">Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Featured"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600">Slug (optional, auto-generated)</label>
                    <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="featured"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Description</label>
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Shown to admins only"
                        className="mt-1 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600">Color</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {colorOptions.map((option) => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => setForm((prev) => ({ ...prev, color: option.value }))}
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                                    form.color === option.value ? 'border-gray-900' : 'border-gray-200'
                                }`}
                            >
                                <span className={`h-3 w-3 rounded-full ${option.swatch}`} />
                                {option.label}
                            </button>
                        ))}
                    </div>
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
                        {editingId ? 'Save changes' : 'Create tag'}
                    </button>
                    {editingId ? (
                        <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
                            Cancel edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                {loading ? (
                    <div className="p-4 text-sm text-gray-500">Loading tags...</div>
                ) : tags.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No tags yet. Create one above.</div>
                ) : (
                    /* Parent clips with overflow-hidden, so the table needs its
                       own scroller or the Actions column is unreachable. */
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Tag</th>
                                <th className="px-4 py-3">Slug</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map((tag) => (
                                <tr key={tag._id} className="border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-2">
                                            <span className={`h-2.5 w-2.5 rounded-full ${colorSwatchClass(tag.color)}`} />
                                            <span className="font-medium text-gray-900">{tag.name}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{tag.slug}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            tag.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {tag.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(tag)} className="mr-3 text-orange-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(tag)} className="text-rose-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );
}
