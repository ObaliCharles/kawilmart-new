import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import { isUploadedFile, uploadFileToCloudinary } from "@/lib/cloudinary";
import User from "@/models/User";
import { NextResponse } from "next/server";

const COVER_TRANSFORM = [{ width: 1600, height: 500, crop: "limit", quality: "auto", fetch_format: "auto" }];
const AVATAR_TRANSFORM = [{ width: 400, height: 400, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }];

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const coverFile = formData.get("cover");
        const avatarFile = formData.get("avatar");

        if (!isUploadedFile(coverFile) && !isUploadedFile(avatarFile)) {
            return NextResponse.json({ success: false, message: "No image provided" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "Seller not found" }, { status: 404 });
        }

        if (isUploadedFile(coverFile)) {
            const uploadResult = await uploadFileToCloudinary(coverFile, { transformation: COVER_TRANSFORM });
            user.storeCoverImage = uploadResult.secure_url;
            user.storeCoverImageId = uploadResult.public_id;
        }

        if (isUploadedFile(avatarFile)) {
            const uploadResult = await uploadFileToCloudinary(avatarFile, { transformation: AVATAR_TRANSFORM });
            user.storeAvatar = uploadResult.secure_url;
            user.storeAvatarId = uploadResult.public_id;
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: "Store images updated",
            storeCoverImage: user.storeCoverImage,
            storeAvatar: user.storeAvatar,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
