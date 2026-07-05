export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
    const responseMessage = error?.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
        return sanitizeApiErrorMessage(responseMessage, fallback);
    }

    if (typeof error?.message === "string" && error.message.trim()) {
        return sanitizeApiErrorMessage(error.message, fallback);
    }

    return fallback;
};

export const sanitizeApiErrorMessage = (message, fallback = "Something went wrong") => {
    if (typeof message !== "string" || !message.trim()) {
        return fallback;
    }

    if (/bad auth|authentication failed/i.test(message)) {
        return "Unable to connect to the database with the current credentials. Check the MongoDB Atlas username, password, and database access settings.";
    }

    return message;
};
