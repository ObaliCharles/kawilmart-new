import { v2 as cloudinary } from "cloudinary";
import { validateUploadFile } from "@/lib/uploadValidation";

let configured = false;

export const getCloudinaryClient = () => {
    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        configured = true;
    }

    return cloudinary;
};

export const isUploadedFile = (file) =>
    file && typeof file.arrayBuffer === "function" && typeof file.size === "number" && file.size > 0;

export const uploadFileToCloudinary = async (file, options = {}) => {
    // Server-side gate for every upload in the app: client-side checks are
    // UX only and can be bypassed with a direct API call.
    const validation = validateUploadFile(file, { maxBytes: 10 * 1024 * 1024 });
    if (!validation.ok) {
        throw new Error(validation.message);
    }

    const client = getCloudinaryClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const stream = client.uploader.upload_stream(
            { resource_type: "auto", ...options },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};
