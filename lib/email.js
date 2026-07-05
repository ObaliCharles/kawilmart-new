const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
const EMAIL_FROM = process.env.EMAIL_FROM || '';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';

const BRAND_NAME = 'KawilMart';
const BRAND_TAGLINE = 'Trusted local shopping, delivered smoothly.';
const BRAND_LOGO_PATH = '/kawil-mart-email-logo.png';

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
    const logoUrl = resolveUrl(BRAND_LOGO_PATH);
    const safeTitle = title || `New ${BRAND_NAME} notification`;
    const safeMessage = message || `You have a new notification in ${BRAND_NAME}.`;
    const safeRecipientName = recipientName || 'there';
    const safeReplyTo = EMAIL_REPLY_TO || EMAIL_FROM || 'our support team';
    const previewText = `${safeTitle} - ${safeMessage}`.slice(0, 140);

    const detailRows = [
        { label: 'Recipient', value: safeRecipientName },
        { label: 'Sent', value: formatEmailDate(new Date()) || 'Just now' },
        ...details,
    ]
        .filter((detail) => detail?.label && detail?.value)
        .slice(0, 4);

    const renderedDetails = detailRows.length > 0
        ? detailRows.map((detail) => `
            <tr>
              <td style="padding:0 0 12px;font-size:12px;line-height:1.5;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;">
                ${escapeHtml(formatDetailLabel(detail.label))}
              </td>
              <td style="padding:0 0 12px;font-size:14px;line-height:1.6;color:#111827;font-weight:600;text-align:right;">
                ${escapeHtml(detail.value)}
              </td>
            </tr>
        `.trim()).join('')
        : '';

    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(previewText)}
      </div>
      <div style="margin:0;padding:32px 16px;background:#fff7ed;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #fed7aa;border-radius:28px;overflow:hidden;box-shadow:0 12px 36px rgba(17,24,39,0.08);">
          <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#fff7ed 0%,#ffffff 70%);border-bottom:1px solid #ffedd5;">
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
              ${logoUrl ? `
                <img src="${logoUrl}" alt="${BRAND_NAME}" width="180" style="display:block;max-width:180px;height:auto;border:0;" />
              ` : `
                <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:16px;background:#ea580c;color:#ffffff;font-size:24px;font-weight:700;">
                  K
                </div>
                <div>
                  <p style="margin:0;font-size:20px;line-height:1.2;font-weight:800;color:#111827;">${BRAND_NAME}</p>
                  <p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#9CA3AF;">${BRAND_TAGLINE}</p>
                </div>
              `}
            </div>

            <div style="margin-top:24px;">
              <p style="margin:0 0 10px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f97316;">
                ${BRAND_NAME} Notification
              </p>
              <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:800;color:#111827;">
                ${escapeHtml(safeTitle)}
              </h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#6b7280;">
                A quick update from ${BRAND_NAME}, prepared with care for you.
              </p>
            </div>
          </div>

          <div style="padding:30px 28px 8px;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#374151;">
              Hello <strong style="color:#111827;">${escapeHtml(safeRecipientName)}</strong>,
            </p>

            <div style="margin:0 0 22px;border-radius:22px;background:#fffaf5;border:1px solid #fed7aa;padding:18px 18px 16px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f97316;">
                What changed
              </p>
              <p style="margin:0;font-size:16px;line-height:1.8;color:#1f2937;">
                ${escapeHtml(safeMessage)}
              </p>
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:20px;">
              <tr>
                <td style="padding:18px 18px 6px;">
                  <p style="margin:0 0 12px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">
                    Message details
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    ${renderedDetails}
                  </table>
                </td>
              </tr>
            </table>

            ${ctaUrl && ctaLabel ? `
              <div style="margin:0 0 24px;">
                <a href="${ctaUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;line-height:1.2;">
                  ${escapeHtml(ctaLabel)}
                </a>
              </div>
            ` : ''}

            <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#6b7280;">
              If you need help, simply reply to this email${safeReplyTo ? ` or contact <span style="color:#111827;font-weight:600;">${escapeHtml(safeReplyTo)}</span>` : ''}.
            </p>
          </div>

          <div style="padding:18px 28px 28px;background:#111827;">
            <p style="margin:0;font-size:13px;line-height:1.7;color:#f3f4f6;">
              Thank you for shopping with <strong>${BRAND_NAME}</strong>.
            </p>
            <p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:#d1d5db;">
              ${BRAND_TAGLINE}
            </p>
          </div>
        </div>
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
        subject: safeTitle,
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
