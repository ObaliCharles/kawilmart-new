'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import ClerkAvatarImage from '@/components/ClerkAvatarImage';
import { AdminUsersPageSkeleton } from '@/components/dashboard/DashboardSkeletons';

const roleColors = {
    admin: 'bg-red-100 text-red-700',
    seller: 'bg-blue-100 text-blue-700',
    rider: 'bg-purple-100 text-purple-700',
    buyer: 'bg-green-100 text-green-700',
};

const roleIcons = {
    admin: '🛡️',
    seller: '🏪',
    rider: '🛵',
    buyer: '🛒',
};

export default function AdminUsers() {
    const { getToken, user, authReady } = useAppContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (!authReady || !user) {
            return;
        }

        const fetchUsers = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const { data } = await axios.get('/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) setUsers(data.users);
                else toast.error(data.message);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        void fetchUsers();
    }, [authReady, getToken, user]);

    const decideVerification = async (sellerId, decision) => {
        const notes = decision === 'REJECTED'
            ? (window.prompt('Reason for rejection (sent to the seller):') || '').trim()
            : '';
        if (decision === 'REJECTED' && !notes) return;

        setUpdatingId(sellerId);
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/admin/verify-seller',
                { sellerId, decision, notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setUsers((prev) => prev.map((u) => u.id === sellerId
                    ? { ...u, verificationStatus: decision, isVerified: decision === 'VERIFIED' }
                    : u
                ));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const updateRole = async (targetUserId, role) => {
        setUpdatingId(targetUserId);
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/admin/users',
                { targetUserId, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role } : u));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = users.filter(u => {
        const matchRole = filterRole === 'All' || u.role === filterRole;
        const matchSearch = !searchQuery ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchRole && matchSearch;
    });

    if (loading) return <AdminUsersPageSkeleton />;

    return (
        <div className="space-y-4 max-w-7xl">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-950">Users & Roles</h1>
                <p className="text-sm text-gray-500 mt-1">Manage user accounts and assign roles</p>
            </div>

            {/* Role summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['buyer', 'seller', 'rider', 'admin'].map(role => (
                    <div key={role} className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{roleIcons[role]}</span>
                            <span className="text-sm font-medium text-gray-600 capitalize">{role}s</span>
                        </div>
                        <p className="text-lg font-semibold tracking-tight text-gray-950">
                            {users.filter(u => u.role === role).length}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-64 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex gap-2">
                    {['All', 'buyer', 'seller', 'rider', 'admin'].map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                                filterRole === role
                                    ? 'bg-gray-950 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {role === 'All' ? '👤 All' : `${roleIcons[role]} ${role}s`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Current Role</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Verification</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        <span className="text-4xl block mb-2">👥</span>
                                        No users found
                                    </td>
                                </tr>
                            ) : filtered.map(u => (
                                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {u.imageUrl ? (
                                                <ClerkAvatarImage
                                                    src={u.imageUrl}
                                                    alt={u.name}
                                                    className="w-9 h-9"
                                                    fallback={u.name?.charAt(0) || '?'}
                                                    fallbackClassName="text-sm"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                    {u.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-800">{u.name || 'No name'}</p>
                                                <p className="text-xs text-gray-400 font-mono">{u.id.slice(-8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2.5 py-1.5 rounded-full capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {roleIcons[u.role]} {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.role === 'seller' || u.role === 'admin' ? (
                                            <div className="space-y-1">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                    u.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700'
                                                    : u.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-700'
                                                    : u.verificationStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {u.verificationStatus || 'UNVERIFIED'}
                                                </span>
                                                {u.verificationDocuments?.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.verificationDocuments.slice(0, 3).map((url, index) => (
                                                            <a key={url} href={url} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-blue-600 hover:underline">
                                                                Doc {index + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : null}
                                                {u.verificationStatus === 'PENDING' ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => decideVerification(u.id, 'VERIFIED')}
                                                            disabled={updatingId === u.id}
                                                            className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => decideVerification(u.id, 'REJECTED')}
                                                            disabled={updatingId === u.id}
                                                            className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={u.role}
                                            disabled={updatingId === u.id}
                                            onChange={(e) => updateRole(u.id, e.target.value)}
                                            className="cursor-pointer rounded-lg bg-gray-50 px-3 py-1.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
                                        >
                                            <option value="buyer">🛒 Buyer</option>
                                            <option value="seller">🏪 Seller</option>
                                            <option value="rider">🛵 Rider</option>
                                            <option value="admin">🛡️ Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
