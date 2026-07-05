const parseFilenameFromDisposition = (contentDisposition = "") => {
    const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (encodedMatch?.[1]) {
        return decodeURIComponent(encodedMatch[1]);
    }

    const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return plainMatch?.[1] || "";
};

export const downloadAuthenticatedFile = async ({
    url,
    token,
    fallbackFilename = "download.html",
} = {}) => {
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
        if (contentType.includes("application/json")) {
            const payload = await response.json();
            throw new Error(payload?.message || "Download failed");
        }

        const message = await response.text();
        throw new Error(message || "Download failed");
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const filename = parseFilenameFromDisposition(response.headers.get("content-disposition") || "") || fallbackFilename;
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
    return filename;
};
