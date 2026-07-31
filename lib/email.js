const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
const EMAIL_FROM = process.env.EMAIL_FROM || '';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';

const BRAND_NAME = 'Wilwa';
const BRAND_TAGLINE = 'Trusted local shopping, delivered smoothly.';
// The header lockup is built from markup, not an <img>. Two reasons: most mail
// clients block remote images until the reader opts in, and APP_BASE_URL points
// at localhost in development, so a linked logo renders as a broken box for
// every recipient. To switch to real artwork once a Wilwa mark is exported,
// host it on the public site and drop an <img src> into the header cell below.

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
      <div style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr><td align="center">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:680px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.10);">
          <tr><td style="height:6px;line-height:6px;font-size:0;background:#ea580c;">&nbsp;</td></tr>
          <tr><td style="padding:26px 28px 22px;border-bottom:1px solid #e2e8f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td width="46" style="width:46px;height:46px;border-radius:14px;background:#ea580c;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:23px;font-weight:bold;text-align:center;vertical-align:middle;line-height:46px;">W</td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-size:21px;line-height:1.1;font-weight:bold;color:#0f172a;letter-spacing:-0.01em;">${BRAND_NAME}</div>
                  <div style="margin-top:3px;font-size:10px;line-height:1.4;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;">Notification</div>
                </td>
              </tr>
            </table>

            <h1 style="margin:22px 0 0;font-size:26px;line-height:1.25;font-weight:bold;color:#0f172a;letter-spacing:-0.02em;">
              ${escapeHtml(safeTitle)}
            </h1>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
              ${BRAND_TAGLINE}
            </p>
          </td></tr>

          <tr><td style="padding:28px 28px 4px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">
              Hello <strong style="color:#0f172a;">${escapeHtml(safeRecipientName)}</strong>,
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;">
              <tr><td style="padding:18px 20px;border-left:3px solid #ea580c;border-radius:14px;">
                <p style="margin:0;font-size:16px;line-height:1.75;color:#0f172a;">
                  ${escapeHtml(safeMessage)}
                </p>
              </td></tr>
            </table>

            ${renderedDetails ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
              <tr>
                <td style="padding:18px 20px 8px;">
                  <p style="margin:0 0 14px;font-size:10px;line-height:1.4;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:#94a3b8;">
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
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;">
                <tr><td style="border-radius:999px;background:#ea580c;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;line-height:1.2;border-radius:999px;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </td></tr>
              </table>
            ` : ''}

            <p style="margin:0 0 20px;font-size:13.5px;line-height:1.75;color:#64748b;">
              Need help? Reply to this email${safeReplyTo ? ` or contact <span style="color:#0f172a;font-weight:bold;">${escapeHtml(safeReplyTo)}</span>` : ''}.
            </p>
          </td></tr>

          <tr><td style="padding:20px 28px 26px;background:#0f172a;">
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td width="30" style="width:30px;height:30px;border-radius:9px;background:#ea580c;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-align:center;vertical-align:middle;line-height:30px;">W</td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <div style="font-size:14px;line-height:1.4;font-weight:bold;color:#ffffff;">${BRAND_NAME}</div>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">
              ${BRAND_TAGLINE}
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
