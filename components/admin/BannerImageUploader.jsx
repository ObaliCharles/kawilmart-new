'use client'
import React, { useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import 'react-image-crop/dist/ReactCrop.css';

const MAX_UPLOAD_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => (
    centerCrop(
        makeAspectCrop(
            { unit: '%', width: 90 },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
);

const getCroppedFile = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const naturalW = image.naturalWidth;
    const naturalH = image.naturalHeight;

    // The crop is stored in PERCENT units (0–100). Convert straight to the
    // source image's NATURAL pixels — do NOT multiply percent values by the
    // display scale, which produced a tiny ~300px crop that then looked
    // zoomed/blurry when displayed. Falls back to pixel math if a px crop is
    // ever passed in.
    const usePercent = crop.unit === '%';
    const sx = usePercent ? (crop.x / 100) * naturalW : crop.x * (naturalW / image.width);
    const sy = usePercent ? (crop.y / 100) * naturalH : crop.y * (naturalH / image.height);
    const sw = usePercent ? (crop.width / 100) * naturalW : crop.width * (naturalW / image.width);
    const sh = usePercent ? (crop.height / 100) * naturalH : crop.height * (naturalH / image.height);

    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Could not process image'));
                return;
            }
            resolve(new File([blob], fileName, { type: blob.type }));
        }, 'image/jpeg', 0.95);
    });
};

// aspect: width/height ratio, e.g. 21/9 for hero banners
const BannerImageUploader = ({ imageUrl, onImageReady, aspect = 16 / 9, label = 'Banner image' }) => {
    const [rawImageSrc, setRawImageSrc] = useState(null);
    const [crop, setCrop] = useState();
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Please choose a JPEG, PNG, or WebP image');
            return;
        }

        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
            toast.error(`Image must be under ${MAX_UPLOAD_MB}MB`);
            return;
        }

        setRawImageSrc(URL.createObjectURL(file));
    };

    const handleImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
    };

    const handleApplyCrop = async () => {
        if (!imageRef.current || !crop?.width || !crop?.height) {
            toast.error('Adjust the crop area first');
            return;
        }

        setProcessing(true);
        try {
            const croppedFile = await getCroppedFile(imageRef.current, crop, `banner-${Date.now()}.jpg`);
            const compressedFile = await imageCompression(croppedFile, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });

            onImageReady(compressedFile, URL.createObjectURL(compressedFile));
            setRawImageSrc(null);
        } catch {
            toast.error('Could not process this image');
        } finally {
            setProcessing(false);
        }
    };

    if (rawImageSrc) {
        return (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold text-gray-600">Crop {label.toLowerCase()}</p>
                <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} aspect={aspect}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img ref={imageRef} src={rawImageSrc} alt="" onLoad={handleImageLoad} className="max-h-80 w-full object-contain" />
                </ReactCrop>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleApplyCrop}
                        disabled={processing}
                        className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                    >
                        {processing ? 'Processing...' : 'Apply crop'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRawImageSrc(null)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${
                dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
            }`}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-28 w-full rounded-lg object-cover" />
            ) : (
                <span className="text-2xl">🖼️</span>
            )}
            <p className="text-xs font-medium text-gray-600">
                Drag & drop {label.toLowerCase()} here, or click to browse
            </p>
            <p className="text-[10px] text-gray-400">JPEG, PNG, or WebP — up to {MAX_UPLOAD_MB}MB</p>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    );
};

export default BannerImageUploader;
