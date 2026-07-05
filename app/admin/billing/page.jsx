'use client'

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { downloadAuthenticatedFile } from '@/lib/clientDownloads';
import { getApiErrorMessage } from '@/lib/apiErrors';

const statusClasses = {
  issued: 'bg-sky-50 text-sky-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
  void: 'bg-slate-100 text-slate-700',
};

const MetricCard = ({ label, value, sub, tone = 'bg-white' }) => (
  <div className={`rounded-2xl border border-gray-200 p-4 shadow-sm ${tone}`}>
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    {sub ? <p className="mt-1 text-sm text-gray-500">{sub}</p> : null}
  </div>
);

const formatDateLabel = (value) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AdminBillingPage() {
  const { getToken, authReady, user, formatCurrency } = useAppContext();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodKey, setPeriodKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState('');
  const [downloadingMonthlyReport, setDownloadingMonthlyReport] = useState(false);

  const fetchInvoices = async (overrides = {}) => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      const activeSearch = overrides.searchQuery ?? searchQuery;
      const activeStatus = overrides.statusFilter ?? statusFilter;
      const activePeriod = overrides.periodKey ?? periodKey;

      if (activeSearch.trim()) {
        params.set('search', activeSearch.trim());
      }
      if (activeStatus !== 'all') {
        params.set('status', activeStatus);
      }
      if (activePeriod.trim()) {
        params.set('periodKey', activePeriod.trim());
      }

      const query = params.toString();
      const { data } = await axios.get(`/api/admin/invoices${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setInvoices(data.invoices || []);
        setSummary(data.summary || null);
        setPeriodOptions(data.periodOptions || []);
      } else {
        toast.error(data.message || 'Failed to load invoices');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady && user) {
      void fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  const runInvoiceAction = async (action, payload = {}, successMessage = 'Invoice updated') => {
    try {
      if (!action) {
        toast.error('Billing action is required');
        return;
      }

      if (action !== 'generate_invoices' && !payload.invoiceId) {
        toast.error('Invoice ID is required for this billing action');
        return;
      }

      if (payload.invoiceId) {
        setActingId(payload.invoiceId);
      } else {
        setGenerating(true);
      }

      const token = await getToken();
      const { data } = await axios.post('/api/admin/invoices', {
        action,
        ...payload,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        toast.error(data.message || 'Billing action failed');
        return;
      }

      toast.success(data.message || successMessage);
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Billing action failed'));
    } finally {
      setActingId('');
      setGenerating(false);
    }
  };

  const outstandingInvoices = useMemo(() => (
    invoices.filter((invoice) => invoice.status === 'issued' || invoice.status === 'overdue')
  ), [invoices]);
  const activeDownloadPeriod = periodKey || periodOptions[0] || '';

  const downloadAdminDocument = async (url, fallbackFilename, options = {}) => {
    try {
      if (options.invoiceId) {
        setDownloadingInvoiceId(options.invoiceId);
      } else {
        setDownloadingMonthlyReport(true);
      }

      const token = await getToken();
      await downloadAuthenticatedFile({
        url,
        token,
        fallbackFilename,
      });
      toast.success('Download started');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to download billing document'));
    } finally {
      setDownloadingInvoiceId('');
      setDownloadingMonthlyReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing & Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate month-end seller invoices, track overdue balances, and confirm payments from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runInvoiceAction('generate_invoices', {}, 'Previous month invoices generated')}
            disabled={generating}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              generating ? 'cursor-wait bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {generating ? 'Generating...' : 'Generate Previous Month'}
          </button>
          <button
            type="button"
            onClick={() => {
              const currentDate = new Date();
              const currentPeriodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
              void runInvoiceAction('generate_invoices', { periodKey: currentPeriodKey }, 'Current month invoices generated');
            }}
            disabled={generating}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              generating ? 'cursor-wait bg-gray-100 text-gray-400' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Generate Current Month
          </button>
          <button
            type="button"
            onClick={() => void downloadAdminDocument(
              `/api/admin/invoices/download?periodKey=${encodeURIComponent(activeDownloadPeriod)}`,
              `kawilmart-admin-billing-report-${activeDownloadPeriod || 'month'}.html`
            )}
            disabled={downloadingMonthlyReport || !activeDownloadPeriod}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              downloadingMonthlyReport || !activeDownloadPeriod
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
            }`}
          >
            {downloadingMonthlyReport ? 'Preparing report...' : 'Download Selected Month'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Invoices" value={summary?.totalInvoices || 0} sub="Across all billing periods" />
        <MetricCard label="Outstanding" value={formatCurrency(summary?.outstandingTotal || 0)} sub={`${summary?.issuedInvoices || 0} open invoices`} tone="bg-sky-50" />
        <MetricCard label="Overdue" value={summary?.overdueInvoices || 0} sub="Needs follow-up" tone="bg-red-50" />
        <MetricCard label="Paid" value={formatCurrency(summary?.paidTotal || 0)} sub={`${summary?.paidInvoices || 0} settled invoices`} tone="bg-emerald-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_220px]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700">Search invoice or seller</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onBlur={() => void fetchInvoices({ searchQuery: searchQuery })}
            placeholder="Invoice number, shop, seller, email..."
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              const nextStatus = event.target.value;
              setStatusFilter(nextStatus);
              void fetchInvoices({ statusFilter: nextStatus });
            }}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
          >
            <option value="all">All statuses</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700">Period</span>
          <select
            value={periodKey}
            onChange={(event) => {
              const nextPeriod = event.target.value;
              setPeriodKey(nextPeriod);
              void fetchInvoices({ periodKey: nextPeriod });
            }}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
          >
            <option value="">All periods</option>
            {periodOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Queue</h2>
        </div>

        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">Loading billing records...</div>
        ) : invoices.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">No billing records matched your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Invoice</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Seller</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Period</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Breakdown</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Due</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.rowId || invoice.id || `${invoice.sellerId}-${invoice.periodKey}`} className="border-t border-gray-100 align-top">
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                        {invoice.isPreview ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                            Preview
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {invoice.isPreview ? 'Live billing preview' : `Issued ${formatDateLabel(invoice.issuedAt)}`}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{invoice.sellerSnapshot?.businessName || invoice.sellerSnapshot?.name || 'Seller'}</p>
                      <p className="mt-1 text-xs text-gray-500">{invoice.sellerSnapshot?.email || 'No email'}</p>
                      <p className="mt-1 text-xs text-gray-400">{invoice.sellerSnapshot?.businessLocation || 'Location pending'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{invoice.periodLabel}</p>
                      <p className="mt-1 text-xs text-gray-400">{invoice.periodKey}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700">Subscription: {formatCurrency(invoice.subscriptionFee)}</p>
                      <p className="mt-1 text-gray-700">Commission: {formatCurrency(invoice.commissionTotal)}</p>
                      <p className="mt-1 font-semibold text-gray-900">Total: {formatCurrency(invoice.totalDue)}</p>
                      <p className="mt-1 text-xs text-gray-400">{invoice.completedOrders} completed orders</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[invoice.status] || statusClasses.issued}`}>
                        {invoice.status}
                      </span>
                      <p className="mt-2 text-xs text-gray-400">
                        {invoice.paidAt ? `Paid ${formatDateLabel(invoice.paidAt)}` : invoice.lastReminderAt ? `Reminded ${formatDateLabel(invoice.lastReminderAt)}` : 'No reminder sent'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{formatDateLabel(invoice.dueAt)}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {invoice.paymentReference ? `Ref ${invoice.paymentReference}` : 'Awaiting payment'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        {invoice.isPreview ? (
                          <button
                            type="button"
                            onClick={() => void runInvoiceAction(
                              'generate_invoices',
                              { periodKey: invoice.periodKey, sellerId: invoice.sellerId },
                              'Invoice generated'
                            )}
                            disabled={generating || actingId === invoice.id}
                            className="rounded-full bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-black"
                          >
                            {generating ? 'Generating...' : 'Generate invoice'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => void downloadAdminDocument(
                                `/api/admin/invoices/download?invoiceId=${encodeURIComponent(invoice.id)}`,
                                `${invoice.invoiceNumber || 'invoice'}.html`,
                                { invoiceId: invoice.id }
                              )}
                              disabled={downloadingInvoiceId === invoice.id}
                              className="rounded-full border border-orange-200 px-3 py-2 text-xs font-medium text-orange-700 transition hover:border-orange-500 hover:text-orange-800"
                            >
                              {downloadingInvoiceId === invoice.id ? 'Preparing...' : 'Download invoice'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void runInvoiceAction('send_reminder', { invoiceId: invoice.id }, 'Reminder sent')}
                              disabled={actingId === invoice.id || downloadingInvoiceId === invoice.id}
                              className="rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                            >
                              {actingId === invoice.id ? 'Working...' : 'Send reminder'}
                            </button>
                            {invoice.status !== 'paid' ? (
                              <button
                                type="button"
                                onClick={() => void runInvoiceAction('mark_paid', { invoiceId: invoice.id }, 'Invoice marked paid')}
                                disabled={actingId === invoice.id || downloadingInvoiceId === invoice.id}
                                className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                              >
                                Mark paid
                              </button>
                            ) : null}
                            {invoice.status !== 'overdue' && invoice.status !== 'paid' ? (
                              <button
                                type="button"
                                onClick={() => void runInvoiceAction('mark_overdue', { invoiceId: invoice.id }, 'Invoice marked overdue')}
                                disabled={actingId === invoice.id || downloadingInvoiceId === invoice.id}
                                className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                              >
                                Mark overdue
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {outstandingInvoices.length ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {outstandingInvoices.length} invoice{outstandingInvoices.length === 1 ? '' : 's'} still need action, totaling {formatCurrency(summary?.outstandingTotal || 0)}.
        </div>
      ) : null}
    </div>
  );
}
