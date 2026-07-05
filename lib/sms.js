import AfricasTalking from 'africastalking';

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'africastalking';
const USERNAME = process.env.AT_USERNAME;
const AUTH_TOKEN = process.env.AT_API_KEY;
const SMS_FROM = process.env.AT_SMS_FROM || 'KawilMart';

let smsService = null;

if (SMS_PROVIDER === 'africastalking' && USERNAME && AUTH_TOKEN) {
    const africasTalkingInstance = AfricasTalking({
        apiKey: AUTH_TOKEN,
        username: USERNAME,
    });
    smsService = africasTalkingInstance.SMS;
}

const isSmsConfigured = () => {
    return SMS_ENABLED && smsService !== null;
};

const normalizePhoneNumber = (to) => {
    const raw = String(to || '').trim();
    if (!raw) return raw;

    if (raw.startsWith('0') && raw.length === 10) {
        return `+256${raw.slice(1)}`;
    }

    if (raw.startsWith('+')) {
        return raw;
    }

    return `+256${raw}`;
};

const sendSms = async (to, message) => {
    if (!isSmsConfigured()) {
        console.warn('SMS not configured or disabled');
        return { success: false, error: 'SMS not configured' };
    }

    const normalizedTo = normalizePhoneNumber(to);
    if (!normalizedTo) {
        return { success: false, error: 'Invalid phone number' };
    }

    try {
        const result = await smsService.send({
            to: [normalizedTo],
            message,
            from: SMS_FROM,
        });
        console.log('SMS sent:', result);
        return { success: true, result };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: error?.message || String(error) };
    }
};

export { sendSms, isSmsConfigured };