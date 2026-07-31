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

// The Wilwa mark is drawn inline rather than linked as an image. These
// documents are downloaded as standalone .html files and opened later, often on
// another machine, so any <img src> pointing back at the app resolves to
// nothing. A vector mark also stays sharp when the invoice is printed to PDF.
const brandLockup = (eyebrow = "") => `
    <div class="brand">
        <svg class="brand-mark" viewBox="0 0 46 46" role="img" aria-label="Wilwa">
            <defs>
                <linearGradient id="wilwaMark" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#F59E0B" />
                    <stop offset="100%" stop-color="#EA580C" />
                </linearGradient>
            </defs>
            <rect width="46" height="46" rx="14" fill="url(#wilwaMark)" />
            <path d="M11 15 L17 31 L23 20.5 L29 31 L35 15" fill="none" stroke="#ffffff"
                  stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="brand-text">
            <span class="brand-name">Wilwa</span>
            ${eyebrow ? `<span class="brand-eyebrow">${escapeHtml(eyebrow)}</span>` : ""}
        </span>
    </div>
`;

// The first stat is the figure the reader actually opened the document for
// (amount due, payout, total), so it carries the accent instead of sitting in
// an undifferentiated row of four identical cards.
const renderStatCards = (items = []) => (
    items.map((item, index) => `
        <div class="stat-card${index === 0 ? " stat-card--primary" : ""}">
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
    eyebrow = "",
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
            --ink: #0f172a;
            --body: #334155;
            --muted: #64748b;
            --line: #e2e8f0;
            --surface: #ffffff;
            --soft: #f8fafc;
            --accent: #ea580c;
            --accent-soft: #fff7ed;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Outfit", "Segoe UI", Helvetica, Arial, sans-serif;
            color: var(--body);
            background: #eef1f6;
            padding: 28px 20px 40px;
            -webkit-font-smoothing: antialiased;
        }
        .sheet {
            max-width: 1000px;
            margin: 0 auto;
            background: var(--surface);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 44px rgba(15, 23, 42, 0.10);
        }
        /* A slim brand bar carries the orange instead of a full colour bleed.
           These documents get printed and filed, and a solid header wastes ink
           while making the figures harder to read. */
        .brandbar {
            height: 6px;
            background: linear-gradient(90deg, #f59e0b, #ea580c 60%, #c2410c);
        }
        .hero {
            padding: 30px 34px 26px;
            border-bottom: 1px solid var(--line);
        }
        .hero-top {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .brand-mark {
            width: 46px;
            height: 46px;
            display: block;
            flex: 0 0 auto;
        }
        .brand-text { display: flex; flex-direction: column; }
        .brand-name {
            font-size: 21px;
            font-weight: 800;
            letter-spacing: -0.01em;
            color: var(--ink);
            line-height: 1.1;
        }
        .brand-eyebrow {
            margin-top: 3px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--accent);
        }
        h1 {
            margin: 22px 0 0;
            font-size: 29px;
            line-height: 1.15;
            letter-spacing: -0.02em;
            color: var(--ink);
        }
        .subtitle {
            margin: 9px 0 0;
            max-width: 640px;
            font-size: 14px;
            line-height: 1.65;
            color: var(--muted);
        }
        .badge {
            display: inline-block;
            border-radius: 999px;
            background: var(--accent-soft);
            border: 1px solid #fed7aa;
            color: #c2410c;
            padding: 8px 15px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            white-space: nowrap;
        }
        .body { padding: 26px 34px 34px; }
        .stats-grid {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
        }
        .stat-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            background: var(--soft);
            padding: 16px 18px;
        }
        .stat-card--primary {
            background: var(--accent-soft);
            border-color: #fed7aa;
        }
        .stat-label {
            margin: 0;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--muted);
        }
        .stat-card--primary .stat-label { color: #c2410c; }
        .stat-value {
            margin: 9px 0 0;
            font-size: 23px;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: var(--ink);
            word-break: break-word;
        }
        .stat-card--primary .stat-value { color: var(--accent); }
        .meta-grid {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
            margin-top: 22px;
        }
        .meta-block {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 18px 20px;
        }
        .meta-block h3 {
            margin: 0 0 4px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--muted);
        }
        .meta-rows { display: block; }
        .meta-row {
            display: flex;
            gap: 14px;
            align-items: baseline;
            justify-content: space-between;
            padding: 11px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .meta-row:last-child { border-bottom: 0; padding-bottom: 0; }
        .meta-row span {
            color: var(--muted);
            font-size: 13px;
        }
        .meta-row strong {
            font-size: 13.5px;
            font-weight: 700;
            color: var(--ink);
            text-align: right;
            word-break: break-word;
        }
        .section-title {
            margin: 30px 0 12px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--muted);
        }
        .table-wrap {
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 14px;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td {
            padding: 13px 16px;
            font-size: 13.5px;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid var(--line);
        }
        th {
            background: var(--soft);
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 10px;
            font-weight: 800;
        }
        td { color: var(--ink); }
        /* Money columns are the ones people scan down, so they align right and
           use tabular figures to keep the digits in a straight column. */
        th:not(:first-child):not(:nth-child(2)),
        td:not(:first-child):not(:nth-child(2)) {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        tbody tr:nth-child(even) td { background: #fcfdfe; }
        tr:last-child td { border-bottom: 0; }
        .empty-cell {
            color: var(--muted);
            text-align: center !important;
            padding: 30px 16px;
        }
        .footer {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid var(--line);
            font-size: 12.5px;
            line-height: 1.7;
            color: var(--muted);
        }
        .accent { color: var(--accent); font-weight: 700; }
        @page { size: A4; margin: 12mm; }
        @media print {
            body { background: white; padding: 0; }
            .sheet {
                box-shadow: none;
                border-radius: 0;
                max-width: none;
            }
            .brandbar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .stat-card, .meta-block, .table-wrap, tr, .brand { break-inside: avoid; }
            .section-title { break-after: avoid; }
        }
    </style>
</head>
<body>
    <main class="sheet">
        <div class="brandbar"></div>
        <section class="hero">
            <div class="hero-top">
                ${brandLockup(eyebrow)}
                ${badge ? `<div class="badge">${escapeHtml(badge)}</div>` : ""}
            </div>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
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
        filename: `${sanitizeFilename(`wilwa-seller-invoice-${invoice?.periodKey || "statement"}-${businessName}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "Seller Billing",
            title: isPreview ? "Seller Billing Preview" : "Seller Monthly Invoice",
            subtitle: `${businessName} for ${invoice?.periodLabel || invoice?.periodKey || "selected month"}. ${isPreview ? "This document is a live preview built from the current billing rules because the official invoice has not been issued yet." : "This document reflects the stored month-end invoice in Wilwa."}`,
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
        filename: `${sanitizeFilename(`wilwa-admin-billing-report-${periodKey || "month"}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "Admin Billing",
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
        filename: `${sanitizeFilename(`wilwa-rider-statement-${snapshot?.periodKey || "month"}-${riderName}`)}.html`,
        html: buildDocumentShell({
            eyebrow: "Rider Billing",
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
