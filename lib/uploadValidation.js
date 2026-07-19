// Server-side upload validation. Client-side checks are UX only — every
// upload route must re-validate here before touching Cloudinary.
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const validateUploadFile = (file, { allowedTypes = IMAGE_MIME_TYPES, maxBytes = 5 * 1024 * 1024 } = {}) => {
    if (!file || typeof file.arrayBuffer !== "function") {
        return { ok: false, message: "No file provided" };
    }

    if (!allowedTypes.includes(file.type)) {
        return { ok: false, message: "Unsupported file type. Use JPEG, PNG, or WebP." };
    }

    if (typeof file.size === "number" && file.size > maxBytes) {
        return { ok: false, message: `File must be under ${Math.round(maxBytes / (1024 * 1024))}MB` };
    }

    return { ok: true };
};
