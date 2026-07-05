import User from "@/models/User";
import { createNotificationEmail, sendEmail } from "@/lib/email";
import { resolveNotificationRecipients } from "@/lib/clerkUserSync";
import { sendSms } from "@/lib/sms";

const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';

const maskEmailForLogs = (value = "") => {
    const normalized = String(value || "").trim();
    if (!normalized.includes("@")) {
        return normalized ? "[invalid-email]" : "[missing-email]";
    }

    const [localPart, domain] = normalized.split("@");
    const safeLocal = localPart.length <= 2
        ? `${localPart[0] || "*"}*`
        : `${localPart.slice(0, 2)}***`;

    return `${safeLocal}@${domain}`;
};

const logEmailDebug = (event, details = {}) => {
    if (!EMAIL_DEBUG) {
        return;
    }

    console.info(`[email-debug] ${event}`, details);
};

const groupByUserId = (entries) => {
    const grouped = new Map();

    for (const entry of entries) {
        if (!entry?.userId || !entry?.notification) {
            continue;
        }

        const existing = grouped.get(entry.userId) || [];
        existing.push(entry);
        grouped.set(entry.userId, existing);
    }

    return grouped;
};

export const notifyUsers = async (entries = []) => {
    const groupedEntries = groupByUserId(entries);
    const userIds = [...groupedEntries.keys()];

    if (userIds.length === 0) {
        return { success: true, count: 0 };
    }

    const userMap = await resolveNotificationRecipients(userIds);

    await User.bulkWrite(
        userIds.map((userId) => ({
            updateOne: {
                filter: { _id: userId },
                update: {
                    $push: {
                        notifications: {
                            $each: groupedEntries.get(userId).map((entry) => entry.notification),
                        },
                    },
                },
            },
        }))
    );

    await Promise.allSettled(
        userIds.flatMap((userId) => {
            const recipient = userMap.get(String(userId));
            const email = recipient?.email;
            const sendableEntries = groupedEntries.get(userId).filter((entry) => entry?.sendEmail !== false);

            logEmailDebug('recipient-resolved', {
                userId: String(userId),
                hasRecipient: Boolean(recipient),
                hasEmail: Boolean(email),
                email: maskEmailForLogs(email),
                queuedEmails: sendableEntries.length,
            });

            if (!email || sendableEntries.length === 0) {
                logEmailDebug('recipient-skipped', {
                    userId: String(userId),
                    reason: !email ? 'missing-email' : 'no-sendable-entries',
                    email: maskEmailForLogs(email),
                });
                return [];
            }

            return sendableEntries.map(async (entry) => {
                const emailPayload = createNotificationEmail({
                    recipientName: recipient?.name || 'there',
                    title: entry.emailTitle || entry.notification.title,
                    message: entry.emailMessage || entry.notification.message,
                    ctaLabel: entry.ctaLabel,
                    ctaPath: entry.ctaPath,
                    details: entry.emailDetails,
                });

                const result = await sendEmail({
                    to: email,
                    subject: emailPayload.subject,
                    html: emailPayload.html,
                    text: emailPayload.text,
                });

                if (!result?.success && !result?.skipped) {
                    console.error(`Failed to send notification email to ${email}: ${result?.message || result?.reason || 'Unknown error'}`);
                }
            });
        })
    );

    // Send SMS notifications
    await Promise.allSettled(
        userIds.map(async (userId) => {
            const user = await User.findById(userId);
            if (user?.phoneNumber) {
                const userEntries = groupedEntries.get(userId);
                const smsMessage = userEntries.map(entry => `${entry.notification.title}: ${entry.notification.message}`).join('\n');
                const result = await sendSms(user.phoneNumber, smsMessage);
                if (!result?.success) {
                    console.error(`Failed to send SMS to ${user.phoneNumber}: ${result?.error}`);
                }
            }
        })
    );

    return { success: true, count: userIds.length };
};
