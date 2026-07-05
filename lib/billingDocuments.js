import "server-only";

const escapeHtml = (value = "") => (
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
);

const formatCurrency = (value = 0) => `UGX ${Number(value || 0).toLocaleString("en-UG")}`;

const formatDateLabel = (value) => {
    if (!value) {
        return "Not set";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) {
        return "Not set";
    }

    return date.toLocaleDateString("en-UG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatStatusLabel = (value = "") => (
    String(value || "pending")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
);

const sanitizeFilename = (value = "document") => (
    String(value || "document")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "document"
);

const renderStatCards = (items = []) => (
    items.map((item) => `
        <div class="stat-card">
            <p class="stat-label">${escapeHtml(item.label)}</p>
            <p class="stat-value">${escapeHtml(item.value)}</p>
        </div>
    `).join("")
);

const renderMetaBlock = (title = "", rows = []) => `
    <section class="meta-block">
        <h3>${escapeHtml(title)}</h3>
        <div class="meta-rows">
            ${rows.map((row) => `
                <div class="meta-row">
                    <span>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.value)}</strong>
                </div>
            `).join("")}
        </div>
    </section>
`;

const renderTable = ({ columns = [], rows = [], emptyMessage = "No records available." } = {}) => `
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    ${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${rows.length ? rows.map((row) => `
                    <tr>
                        ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
                    </tr>
                `).join("") : `
                    <tr>
                        <td colspan="${Math.max(columns.length, 1)}" class="empty-cell">${escapeHtml(emptyMessage)}</td>
                    </tr>
                `}
            </tbody>
        </table>
    </div>
`;

const buildDocumentShell = ({
    eyebrow = "KawilMart",
    title = "Billing Document",
    subtitle = "",
    badge = "",
    stats = [],
    metaBlocks = [],
    tableTitle = "",
    tableHtml = "",
    footerNote = "",
} = {}) => `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #1f2937;
            --muted: #6b7280;
            --line: #e5e7eb;
            --surface: #ffffff;
            --soft: #f8fafc;
            --accent: #ea580c;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Outfit", "Segoe UI", sans-serif;
            color: var(--ink);
            background: #f3f4f6;
            padding: 24px;
        }
        .sheet {
            max-width: 1040px;
            margin: 0 auto;
            background: var(--surface);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }
        .hero {
            padding: 32px;
            background: linear-gradient(135deg, #fb923c, #f97316 55%, #fdba74);
            color: white;
        }
        .eyebrow {
            margin: 0;
            font-size: 11px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            opacity: 0.85;
        }
        .hero-top {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            justify-content: space-between;
        }
        h1 {
            margin: 12px 0 0;
            font-size: 32px;
            line-height: 1.1;
        }
        .subtitle {
            margin: 10px 0 0;
            max-width: 720px;
            font-size: 14px;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);
        }
        .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.24);
            padding: 10px 16px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            white-space: nowrap;
        }
        .body {
            padding: 28px 32px 36px;
        }
        .stats-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .stat-card {
            border: 1px solid var(--line);
            border-radius: 20px;
            background: var(--soft);
            padding: 18px;
        }
        .stat-label {
            margin: 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--muted);
        }
        .stat-value {
            margin: 10px 0 0;
            font-size: 24px;
            font-weight: 700;
            word-break: break-word;
        }
        .meta-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            margin-top: 24px;
        }
        .meta-block {
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 18px;
        }
        .meta-block h3 {
            margin: 0 0 14px;
            font-size: 16px;
        }
        .meta-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .meta-row {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            justify-content: space-between;
        }
        .meta-row span {
            color: var(--muted);
            font-size: 14px;
        }
        .meta-row strong {
            font-size: 14px;
            text-align: right;
            word-break: break-word;
        }
        .section-title {
            margin: 28px 0 12px;
            font-size: 18px;
        }
        .table-wrap {
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 14px 16px;
            font-size: 14px;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid var(--line);
        }
        th {
            background: #fff7ed;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 11px;
        }
        tr:last-child td {
            border-bottom: 0;
        }
        .empty-cell {
            color: var(--muted);
            text-align: center;
            padding: 28px 16px;
        }
        .footer {
            margin-top: 20px;
            font-size: 13px;
            line-height: 1.7;
            color: var(--muted);
        }
        .accent {
            color: var(--accent);
            font-weight: 700;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .sheet {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <main class="sheet">
        <section class="hero">
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <div class="hero-top">
                <div>
                    <h1>${escapeHtml(title)}</h1>
                    <p class="subtitle">${escapeHtml(subtitle)}</p>
                </div>
                ${badge ? `<div class="badge">${escapeHtml(badge)}</div>` : ""}
            </div>
        </section>
        <section class="body">
            <div class="stats-grid">${renderStatCards(stats)}</div>
            <div class="meta-grid">${metaBlocks.join("")}</div>
            ${tableTitle ? `<h2 class="section-title">${escapeHtml(tableTitle)}</h2>` : ""}
            ${tableHtml}
            ${footerNote ? `<p class="footer">${escapeHtml(footerNote)}</p>` : ""}
        </section>
    </main>
</body>
</html>`;

export const buildSellerInvoiceDocument = ({
    invoice = {},
    orders = [],
    sellerName = "",
    isPreview = false,
} = {}) => {
    const businessName = invoice?.sellerSnapshot?.businessName || sellerName || invoice?.sellerSnapshot?.name || "Seller account";
    const invoiceReference = invoice?.invoiceNumber || "Invoice pending";
    const stats = [
        { label: "Total due", value: formatCurrency(invoice?.totalDue || 0) },
        { label: "Subscription", value: formatCurrency(invoice?.subscriptionFee || 0) },
        { label: "Commission", value: formatCurrency(invoice?.commissionTotal || 0) },
        { label: "Completed orders", value: String(invoice?.completedOrders || 0) },
    ];
    const metaBlocks = [
        renderMetaBlock("Invoice details", [
            { label: "Reference", value: invoiceReference },
            { label: "Billing month", value: invoice?.periodLabel || invoice?.periodKey || "Unknown" },
            { label: "Status", value: formatStatusLabel(invoice?.status || (isPreview ? "preview" : "issued")) },
            { label: "Issued", value: formatDateLabel(invoice?.issuedAt) },
            { label: "Due", value: formatDateLabel(invoice?.dueAt) },
        ]),
        renderMetaBlock("Seller account", [
            { label: "Business", value: businessName },
            { label: "Email", value: invoice?.sellerSnapshot?.email || "Not set" },
            { label: "Location", value: invoice?.sellerSnapshot?.businessLocation || "Not set" },
            { label: "Plan", value: formatStatusLabel(invoice?.subscriptionPlan || "standard") },
            { label: "Support priority", value: formatStatusLabel(invoice?.sellerSnapshot?.supportPriority || "standard") },
        ]),
    ];
    const tableHtml = renderTable({
        columns: ["Order", "Completed", "Subtotal", "Commission"],
        rows: orders.map((order) => [
            `#${String(order?._id || "").slice(-8).toUpperCase() || "N/A"}`,
            formatDateLabel(order?.customerConfirmedAt || order?.deliveredAt || order?.date),
            formatCurrency(order?.subtotal || 0),
            formatCurrency(order?.commissionAmount || 0),
        ]),
        emptyMessage: "No completed orders were billed for this month.",
    });

    return {
        filename: `${sanitizeFilename(`kawilmart-seller-invoice-${invoice?.periodKey || "statement"}-${businessName}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "KawilMart Seller Billing",
            title: isPreview ? "Seller Billing Preview" : "Seller Monthly Invoice",
            subtitle: `${businessName} for ${invoice?.periodLabel || invoice?.periodKey || "selected month"}. ${isPreview ? "This document is a live preview built from the current billing rules because the official invoice has not been issued yet." : "This document reflects the stored month-end invoice in KawilMart."}`,
            badge: isPreview ? "Preview" : formatStatusLabel(invoice?.status || "issued"),
            stats,
            metaBlocks,
            tableTitle: "Completed orders included",
            tableHtml,
            footerNote: "Subscription fees come from the seller account plan. Commission totals come from completed orders in the selected billing month.",
        }),
    };
};

export const buildAdminBillingReportDocument = ({
    periodLabel = "",
    periodKey = "",
    invoices = [],
} = {}) => {
    const sellerCount = invoices.length;
    const subscriptionTotal = invoices.reduce((sum, invoice) => sum + (Number(invoice?.subscriptionFee) || 0), 0);
    const commissionTotal = invoices.reduce((sum, invoice) => sum + (Number(invoice?.commissionTotal) || 0), 0);
    const billedTotal = invoices.reduce((sum, invoice) => sum + (Number(invoice?.totalDue) || 0), 0);
    const paidTotal = invoices
        .filter((invoice) => invoice?.status === "paid")
        .reduce((sum, invoice) => sum + (Number(invoice?.totalDue) || 0), 0);
    const outstandingTotal = invoices
        .filter((invoice) => invoice?.status === "issued" || invoice?.status === "overdue")
        .reduce((sum, invoice) => sum + (Number(invoice?.totalDue) || 0), 0);
    const overdueCount = invoices.filter((invoice) => invoice?.status === "overdue").length;

    return {
        filename: `${sanitizeFilename(`kawilmart-admin-billing-report-${periodKey || "month"}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "KawilMart Admin Billing",
            title: "Monthly Billing Report",
            subtitle: `Company-side billing summary for ${periodLabel || periodKey || "selected month"}, based on generated seller invoices already stored in the system.`,
            badge: periodKey || "Report",
            stats: [
                { label: "Seller invoices", value: String(sellerCount) },
                { label: "Subscription total", value: formatCurrency(subscriptionTotal) },
                { label: "Commission total", value: formatCurrency(commissionTotal) },
                { label: "Billed total", value: formatCurrency(billedTotal) },
                { label: "Paid total", value: formatCurrency(paidTotal) },
                { label: "Outstanding", value: formatCurrency(outstandingTotal) },
            ],
            metaBlocks: [
                renderMetaBlock("Collections status", [
                    { label: "Billing month", value: periodLabel || periodKey || "Unknown" },
                    { label: "Generated invoices", value: String(sellerCount) },
                    { label: "Overdue invoices", value: String(overdueCount) },
                    { label: "Open balance", value: formatCurrency(outstandingTotal) },
                ]),
            ],
            tableTitle: "Seller invoice ledger",
            tableHtml: renderTable({
                columns: ["Invoice", "Seller", "Status", "Subscription", "Commission", "Total"],
                rows: invoices.map((invoice) => [
                    invoice?.invoiceNumber || "N/A",
                    invoice?.sellerSnapshot?.businessName || invoice?.sellerSnapshot?.name || "Seller",
                    formatStatusLabel(invoice?.status || "issued"),
                    formatCurrency(invoice?.subscriptionFee || 0),
                    formatCurrency(invoice?.commissionTotal || 0),
                    formatCurrency(invoice?.totalDue || 0),
                ]),
                emptyMessage: "No seller invoices have been generated for this billing month yet.",
            }),
            footerNote: "This report matches the admin billing queue and only includes stored seller invoices for the selected month.",
        }),
    };
};

export const buildRiderStatementDocument = ({
    rider = {},
    snapshot = {},
    deliveries = [],
} = {}) => {
    const riderName = rider?.name || "Rider account";
    const netBalance = Number(snapshot?.netBalance ?? ((Number(snapshot?.payoutTotal) || 0) - (Number(snapshot?.subscriptionFee) || 0))) || 0;
    const periodLabel = snapshot?.periodLabel || snapshot?.periodKey || "selected month";

    return {
        filename: `${sanitizeFilename(`kawilmart-rider-statement-${snapshot?.periodKey || "month"}-${riderName}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "KawilMart Rider Billing",
            title: "Monthly Delivery Statement",
            subtitle: `${riderName} for ${periodLabel}. Delivery earnings come from completed or delivered jobs in that month, while the subscription fee comes from the rider account settings.`,
            badge: formatStatusLabel(snapshot?.subscriptionStatus || "active"),
            stats: [
                { label: "Delivery earnings", value: formatCurrency(snapshot?.payoutTotal || 0) },
                { label: "Subscription fee", value: formatCurrency(snapshot?.subscriptionFee || 0) },
                { label: "Net balance", value: formatCurrency(netBalance) },
                { label: "Completed deliveries", value: String(snapshot?.completedDeliveries || 0) },
            ],
            metaBlocks: [
                renderMetaBlock("Rider account", [
                    { label: "Reference", value: snapshot?.invoiceNumber || "RID-STMT" },
                    { label: "Billing month", value: periodLabel },
                    { label: "Rider", value: riderName },
                    { label: "Availability", value: formatStatusLabel(rider?.riderAvailability || "available") },
                ]),
                renderMetaBlock("Subscription access", [
                    { label: "Plan", value: formatStatusLabel(snapshot?.subscriptionPlan || "standard") },
                    { label: "Status", value: formatStatusLabel(snapshot?.subscriptionStatus || "active") },
                    { label: "Access note", value: snapshot?.subscriptionAccess?.reason || "Account is active." },
                    { label: "Access until", value: formatDateLabel(snapshot?.subscriptionAccess?.accessUntil) },
                ]),
            ],
            tableTitle: "Completed delivery jobs",
            tableHtml: renderTable({
                columns: ["Order", "Delivery date", "Seller", "Payout"],
                rows: deliveries.map((delivery) => [
                    `#${String(delivery?._id || "").slice(-8).toUpperCase() || "N/A"}`,
                    formatDateLabel(delivery?.deliveredAt || delivery?.customerConfirmedAt || delivery?.date),
                    delivery?.sellerName || "Seller",
                    formatCurrency(delivery?.deliveryFee || 0),
                ]),
                emptyMessage: "No completed rider deliveries were recorded for this month.",
            }),
            footerNote: "The net balance shown here is delivery earnings minus the rider subscription fee currently configured on the account.",
        }),
    };
};
