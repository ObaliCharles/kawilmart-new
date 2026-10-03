const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
const EMAIL_FROM = process.env.EMAIL_FROM || '';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
// This must be a public HTTPS URL in production. By default, it uses the
// Wilwa wordmark shipped in /public, which is served at this path by Next.js.
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || '/wilwa-email-logo.png';
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';

const BRAND_NAME = 'Wilwa';
const BRAND_TAGLINE = 'Trusted local shopping, delivered smoothly.';
// Email clients load images independently of the website. Keep the logo on a
// stable public HTTPS address so it renders in every notification template.

const maskEmailForLogs = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized.includes('@')) {
        return normalized ? '[invalid-email]' : '[missing-email]';
    }

    const [localPart, domain] = normalized.split('@');
    const safeLocal = localPart.length <= 2
        ? `${localPart[0] || '*'}*`
        : `${localPart.slice(0, 2)}***`;

    return `${safeLocal}@${domain}`;
};

const logEmailDebug = (event, details = {}) => {
    if (!EMAIL_DEBUG) {
        return;
    }

    console.info(`[email-debug] ${event}`, details);
};

const isEmailConfigured = () => {
    if (!EMAIL_ENABLED) {
        return false;
    }

    if (EMAIL_PROVIDER === 'resend') {
        return Boolean(process.env.RESEND_API_KEY && EMAIL_FROM);
    }

    return false;
};

const escapeHtml = (value = '') => (
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
);

const resolveUrl = (path = '') => {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (!APP_BASE_URL) {
        return '';
    }

    return `${APP_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};

const formatDetailLabel = (label = '') => {
    return String(label)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatEmailDate = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-UG', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const getFormattedFromAddress = () => {
    if (!EMAIL_FROM) {
        return '';
    }

    if (EMAIL_FROM.includes('<') && EMAIL_FROM.includes('>')) {
        return EMAIL_FROM;
    }

    return `${BRAND_NAME} <${EMAIL_FROM}>`;
};

// Notification sources predate the email design system and provide human-readable
// titles rather than an event key. Keep that public API stable while deriving a
// small, consistent presentation treatment from the content already supplied.
const resolveEventPresentation = ({ title = '', message = '', details = [] }) => {
    const content = `${title} ${message} ${details.map((detail) => `${detail?.label || ''} ${detail?.value || ''}`).join(' ')}`.toLowerCase();

    if (/(payment.*(failed|not completed|declined)|payment.*did not go through)/.test(content)) {
        return { category: 'Payment notification', icon: '!', accent: '#c2410c', soft: '#fff7ed', line: '#fed7aa', badge: 'Action needed' };
    }
    if (/(payment.*(received|success|confirmed)|paid online)/.test(content)) {
        return { category: 'Payment notification', icon: '✓', accent: '#047857', soft: '#ecfdf5', line: '#a7f3d0', badge: 'Payment confirmed' };
    }
    if (/(return|refund)/.test(content)) {
        return { category: 'Returns notification', icon: '↗', accent: '#6d28d9', soft: '#f5f3ff', line: '#ddd6fe', badge: /declined|overdue/.test(content) ? 'Update required' : 'Return update' };
    }
    if (/(review|rating)/.test(content)) {
        return { category: 'Customer feedback', icon: '★', accent: '#a16207', soft: '#fffbeb', line: '#fde68a', badge: 'Feedback request' };
    }
    if (/(rider|delivery|delivered|pickup|drop-off|dropoff)/.test(content)) {
        return { category: 'Delivery notification', icon: '→', accent: '#1d4ed8', soft: '#eff6ff', line: '#bfdbfe', badge: /declined|reassigned|removed/.test(content) ? 'Assignment update' : 'Delivery update' };
    }
    if (/(invoice|billing|commission|overdue)/.test(content)) {
        return { category: 'Billing notification', icon: '$', accent: /overdue/.test(content) ? '#b45309' : '#4f46e5', soft: /overdue/.test(content) ? '#fffbeb' : '#eef2ff', line: /overdue/.test(content) ? '#fde68a' : '#c7d2fe', badge: /overdue/.test(content) ? 'Payment due' : 'Billing update' };
    }
    if (/(vendor|seller.*verif|store.*verif|verification|verified|application)/.test(content)) {
        return { category: 'Seller notification', icon: '✓', accent: '#047857', soft: '#ecfdf5', line: '#a7f3d0', badge: /not approved|rejected|declined/.test(content) ? 'Application update' : 'Seller update' };
    }
    if (/(support|message|chat|inbox)/.test(content)) {
        return { category: 'Message notification', icon: '•', accent: '#2563eb', soft: '#eff6ff', line: '#bfdbfe', badge: 'New message' };
    }
    if (/(role|account|admin|user)/.test(content)) {
        return { category: 'Account notification', icon: '•', accent: '#475569', soft: '#f8fafc', line: '#cbd5e1', badge: 'Account update' };
    }
    if (/(order|shipment)/.test(content)) {
        return { category: 'Order notification', icon: '✓', accent: '#047857', soft: '#ecfdf5', line: '#a7f3d0', badge: 'Order update' };
    }

    return { category: 'Wilwa notification', icon: '•', accent: '#ea580c', soft: '#fff7ed', line: '#fed7aa', badge: 'New update' };
};

const renderDetailRows = (details = [], accent = '#ea580c') => details.map((detail, index) => {
    const label = formatDetailLabel(detail.label);
    const value = escapeHtml(detail.value);
    const isStatus = /^(status|payment status|decision)$/i.test(label);
    const divider = index === details.length - 1 ? '' : 'border-bottom:1px solid #e9eef5;';

    return `
      <tr>
        <td style="padding:11px 0;${divider}font-size:12px;line-height:1.4;font-weight:600;color:#64748b;vertical-align:top;">${escapeHtml(label)}</td>
        <td align="right" style="padding:11px 0;${divider}font-size:13px;line-height:1.4;font-weight:700;color:#0f172a;text-align:right;vertical-align:top;">
          ${isStatus ? `<span style="display:inline-block;padding:4px 7px;border-radius:4px;background:${accent}18;color:${accent};font-size:10px;line-height:1.2;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${value}</span>` : value}
        </td>
      </tr>`;
}).join('');

const sendWithResend = async ({ to, subject, html, text }) => {
    const payload = {
        from: getFormattedFromAddress(),
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
    };

    if (EMAIL_REPLY_TO) {
        payload.reply_to = EMAIL_REPLY_TO;
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend email failed: ${response.status} ${errorText}`);
    }

    return response.json();
};

export const createNotificationEmail = ({
    recipientName = 'there',
    title,
    message,
    ctaLabel = '',
    ctaPath = '',
    details = [],
}) => {
    const ctaUrl = resolveUrl(ctaPath);
    const safeTitle = title || `New ${BRAND_NAME} notification`;
    const safeMessage = message || `You have a new notification in ${BRAND_NAME}.`;
    const safeRecipientName = recipientName || 'there';
    const safeReplyTo = EMAIL_REPLY_TO || EMAIL_FROM || 'our support team';
    const logoUrl = resolveUrl(EMAIL_LOGO_URL);
    const previewText = `${safeTitle} - ${safeMessage}`.slice(0, 140);
    const presentation = resolveEventPresentation({ title: safeTitle, message: safeMessage, details });
    const eventDetails = Array.isArray(details) ? details : [];
    const detailRows = eventDetails
        .filter((detail) => detail?.label && detail?.value)
        .slice(0, 5);
    const renderedDetails = renderDetailRows(detailRows, presentation.accent);
    const sentAt = formatEmailDate(new Date()) || 'Just now';
    const escapedCtaUrl = escapeHtml(ctaUrl);
    const escapedLogoUrl = escapeHtml(logoUrl);

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(previewText)}
      </div>
      <div style="margin:0;padding:28px 16px;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#334155;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr><td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="border-collapse:separate;max-width:640px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(15,23,42,0.06);">
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${presentation.accent};">&nbsp;</td></tr>
          <tr><td style="padding:22px 26px;border-bottom:1px solid #e9eef5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;">
                  ${logoUrl ? `<img src="${escapedLogoUrl}" width="122" alt="${BRAND_NAME}" style="display:block;width:122px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />` : `<div style="font-size:21px;line-height:1.1;font-weight:800;color:#0f172a;letter-spacing:-0.04em;">${BRAND_NAME}</div>`}
                </td>
                <td align="right" style="vertical-align:middle;text-align:right;">
                  <div style="font-size:10px;line-height:1.4;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(presentation.category)}</div>
                </td>
              </tr>
            </table>
          </td></tr>

          <tr><td style="padding:26px 26px 8px;">
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px;">
              <tr><td align="center" style="width:38px;height:38px;border-radius:9px;background:${presentation.soft};border:1px solid ${presentation.line};font-size:21px;line-height:38px;font-weight:800;color:${presentation.accent};">${presentation.icon}</td></tr>
            </table>
            <div style="margin:0 0 9px;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${presentation.accent};">${escapeHtml(presentation.badge)}</div>
            <h1 style="margin:0;font-size:27px;line-height:1.2;font-weight:800;color:#0f172a;letter-spacing:-0.035em;">${escapeHtml(safeTitle)}</h1>
            <p style="margin:13px 0 0;font-size:15px;line-height:1.65;color:#475569;">${escapeHtml(safeMessage)}</p>
          </td></tr>

          <tr><td style="padding:16px 26px 4px;">
            <p style="margin:0;font-size:14px;line-height:1.65;color:#475569;">
              Hello <strong style="color:#0f172a;">${escapeHtml(safeRecipientName)}</strong>,
            </p>
            ${renderedDetails ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;margin:20px 0 22px;background:#fbfcfe;border:1px solid #e2e8f0;border-radius:10px;">
              <tr>
                <td style="padding:15px 18px 7px;">
                  <p style="margin:0 0 5px;font-size:10px;line-height:1.4;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">
                    Details
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    ${renderedDetails}
                  </table>
                </td>
              </tr>
            </table>
            ` : ''}

            ${ctaUrl && ctaLabel ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:22px 0 20px;">
                <tr><td align="left" style="border-radius:8px;background:#0f172a;text-align:left;">
                  <a href="${escapedCtaUrl}" style="display:block;padding:14px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;line-height:1.2;border-radius:8px;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </td></tr>
              </table>
            ` : ''}

            <p style="margin:0 0 21px;font-size:12.5px;line-height:1.65;color:#64748b;">
              Need help? Reply to this email${safeReplyTo ? ` or contact <span style="color:#334155;font-weight:700;">${escapeHtml(safeReplyTo)}</span>` : ''}.
            </p>
          </td></tr>

          <tr><td style="padding:20px 26px 22px;background:#f8fafc;border-top:1px solid #e9eef5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;">
                  ${logoUrl ? `<img src="${escapedLogoUrl}" width="82" alt="${BRAND_NAME}" style="display:block;width:82px;height:auto;border:0;outline:none;text-decoration:none;" />` : `<div style="font-size:14px;line-height:1.4;font-weight:800;color:#0f172a;">${BRAND_NAME}</div>`}
                </td>
                <td align="right" style="vertical-align:middle;text-align:right;font-size:11px;line-height:1.4;color:#94a3b8;">
                  ${escapeHtml(sentAt)}
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:11.5px;line-height:1.65;color:#64748b;">
              ${BRAND_TAGLINE}<br />This email was sent because you are part of the Wilwa community.<br />© ${new Date().getFullYear()} Wilwa. All rights reserved.
            </p>
          </td></tr>
        </table>
          </td></tr>
        </table>
      </div>
    `.trim();

    const textLines = [
        BRAND_NAME,
        safeTitle,
        '',
        `Hello ${safeRecipientName},`,
        safeMessage,
    ];

    if (detailRows.length > 0) {
        textLines.push('', 'Details:');
        detailRows.forEach((detail) => {
            textLines.push(`- ${formatDetailLabel(detail.label)}: ${detail.value}`);
        });
    }

    if (ctaUrl && ctaLabel) {
        textLines.push('', `${ctaLabel}: ${ctaUrl}`);
    }

    if (safeReplyTo) {
        textLines.push('', `Reply to: ${safeReplyTo}`);
    }

    return {
        subject: `${BRAND_NAME} — ${safeTitle}`,
        html,
        text: textLines.join('\n'),
    };
};

export const sendEmail = async ({ to, subject, html, text }) => {
    if (!to) {
        logEmailDebug('skip-missing-recipient', {
            provider: EMAIL_PROVIDER,
            subject,
        });
        return { success: false, skipped: true, reason: 'missing_recipient' };
    }

    if (!EMAIL_ENABLED) {
        logEmailDebug('skip-email-disabled', {
            provider: EMAIL_PROVIDER,
            to: Array.isArray(to) ? to.map(maskEmailForLogs) : maskEmailForLogs(to),
            subject,
        });
        return { success: false, skipped: true, reason: 'email_disabled' };
    }

    if (!isEmailConfigured()) {
        logEmailDebug('skip-email-not-configured', {
            provider: EMAIL_PROVIDER,
            to: Array.isArray(to) ? to.map(maskEmailForLogs) : maskEmailForLogs(to),
            from: getFormattedFromAddress(),
        });
        return { success: false, skipped: true, reason: 'email_not_configured' };
    }

    if (EMAIL_PROVIDER === 'resend') {
        try {
            logEmailDebug('send-attempt', {
                provider: EMAIL_PROVIDER,
                to: Array.isArray(to) ? to.map(maskEmailForLogs) : maskEmailForLogs(to),
                from: getFormattedFromAddress(),
                replyTo: EMAIL_REPLY_TO || null,
                subject,
            });
            await sendWithResend({ to, subject, html, text });
            logEmailDebug('send-success', {
                provider: EMAIL_PROVIDER,
                to: Array.isArray(to) ? to.map(maskEmailForLogs) : maskEmailForLogs(to),
                subject,
            });
            return { success: true };
        } catch (error) {
            logEmailDebug('send-failure', {
                provider: EMAIL_PROVIDER,
                to: Array.isArray(to) ? to.map(maskEmailForLogs) : maskEmailForLogs(to),
                subject,
                message: error instanceof Error ? error.message : 'Unknown email provider error',
            });
            return {
                success: false,
                skipped: false,
                reason: 'provider_error',
                message: error instanceof Error ? error.message : 'Unknown email provider error',
            };
        }
    }

    return { success: false, skipped: true, reason: 'unsupported_provider' };
};
