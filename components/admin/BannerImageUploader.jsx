'use client'
import React, { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

const MAX_UPLOAD_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Upload-and-display only — no cropping. The picked image is used as-is (just
// lightly compressed for performance); the live site sizes it with CSS +
// Cloudinary transforms per banner type. `aspect` is kept only as a hint for
// the preview box so admins can see roughly how the banner will be framed.
const BannerImageUploader = ({ imageUrl, onImageReady, aspect = 16 / 9, label = 'Banner image' }) => {
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Please choose a JPEG, PNG, or WebP image');
            return;
        }

        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
            toast.error(`Image must be under ${MAX_UPLOAD_MB}MB`);
            return;
        }

        setProcessing(true);
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            onImageReady(compressedFile, URL.createObjectURL(compressedFile));
        } catch {
            toast.error('Could not process this image');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${
                dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
            }`}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" style={{ aspectRatio: aspect }} className="w-full rounded-lg object-cover" />
            ) : (
                <span className="text-2xl">🖼️</span>
            )}
            <p className="text-xs font-medium text-gray-600">
                {processing ? 'Processing…' : `Drag & drop ${label.toLowerCase()} here, or click to browse`}
            </p>
            <p className="text-[10px] text-gray-400">JPEG, PNG, or WebP — up to {MAX_UPLOAD_MB}MB. Displayed as uploaded.</p>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
            />
        </div>
    );
};

export default BannerImageUploader;
