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
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
                <p className="text-sm text-gray-500 mt-1">Manage user accounts and assign roles</p>
            </div>

            {/* Role summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['buyer', 'seller', 'rider', 'admin'].map(role => (
                    <div key={role} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{roleIcons[role]}</span>
                            <span className="text-sm font-medium text-gray-600 capitalize">{role}s</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
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
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 w-64 bg-white"
                />
                <div className="flex gap-2">
                    {['All', 'buyer', 'seller', 'rider', 'admin'].map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition capitalize ${
                                filterRole === role
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {role === 'All' ? '👤 All' : `${roleIcons[role]} ${role}s`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">User</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Email</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Joined</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Current Role</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <span className="text-4xl block mb-2">👥</span>
                                        No users found
                                    </td>
                                </tr>
                            ) : filtered.map(u => (
                                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-5 py-4">
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
                                    <td className="px-5 py-4 text-gray-600">{u.email}</td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1.5 rounded-full capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {roleIcons[u.role]} {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <select
                                            value={u.role}
                                            disabled={updatingId === u.id}
                                            onChange={(e) => updateRole(u.id, e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-400 bg-white cursor-pointer disabled:opacity-50"
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
