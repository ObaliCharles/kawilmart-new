'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

export default function SavedSearchesPage() {
  const { authReady, user, getToken, navigate } = useAppContext();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = async () => { const token = await getToken(); return token ? { Authorization: `Bearer ${token}` } : {}; };
  const load = async () => {
    if (!authReady || !user) { setLoading(false); return; }
    try { const { data } = await axios.get('/api/saved-searches', { headers: await headers() }); if (data.success) setSearches(data.searches || []); }
    catch { toast.error('Could not load saved searches'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [authReady, user]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = async (entry, patch) => {
    const { data } = await axios.patch('/api/saved-searches', { id: entry._id, ...patch }, { headers: await headers() });
    if (data.success) setSearches((all) => all.map((item) => item._id === entry._id ? data.savedSearch : item)); else toast.error(data.message || 'Could not update saved search');
  };
  const remove = async (entry) => {
    const { data } = await axios.delete(`/api/saved-searches?id=${encodeURIComponent(entry._id)}`, { headers: await headers() });
    if (data.success) setSearches((all) => all.filter((item) => item._id !== entry._id)); else toast.error(data.message || 'Could not delete saved search');
  };
  return <><Navbar hideMobileHeader mobilePageTitle="Saved Searches" showMobilePageSearch={false} />
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24 sm:px-6">
      <header className="mb-5"><h1 className="text-xl font-bold text-gray-950">Saved searches</h1><p className="mt-1 text-sm text-gray-500">Get an inbox alert when a new listing matches.</p></header>
      {!authReady || loading ? <p className="text-sm text-gray-500">Loading saved searches…</p> : !user ? <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Sign in to manage saved searches.</div> : !searches.length ? <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No saved searches yet. Create one from marketplace browsing.</div> : <div className="space-y-3">{searches.map((entry) => <article key={entry._id} className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><input aria-label="Saved search name" value={entry.name} onChange={(event) => setSearches((all) => all.map((item) => item._id === entry._id ? { ...item, name: event.target.value } : item))} onBlur={() => update(entry, { name: entry.name })} className="w-full max-w-xs border-b border-gray-200 bg-transparent pb-1 text-sm font-semibold text-gray-950 outline-none focus:border-orange-500" /><p className="mt-2 text-xs text-gray-500">{[entry.search && `“${entry.search}”`, entry.category, entry.radiusKm && `${entry.radiusKm} km`].filter(Boolean).join(' · ') || 'All listings'} </p></div><div className="flex items-center gap-2"><button type="button" onClick={() => update(entry, { enabled: !entry.enabled })} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${entry.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{entry.enabled ? 'Alerts on' : 'Alerts off'}</button><button type="button" onClick={() => remove(entry)} className="rounded-md px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button></div></div></article>)}</div>}
      <button type="button" onClick={() => navigate('/all-products')} className="mt-5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Browse products</button>
    </main><Footer /></>;
}
