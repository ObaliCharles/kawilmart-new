import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/config/db";
import User from "@/models/User";
import { getRequestUserId } from "@/lib/requestAuth";

export async function POST(request) {
  try {
    const currentUserId = await getRequestUserId(request);
    if (!currentUserId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { sellerId } = await request.json();
    if (!sellerId || !isValidObjectId(sellerId) || String(sellerId) === String(currentUserId)) {
      return NextResponse.json({ success: false, message: "Invalid seller" }, { status: 400 });
    }

    await connectDB();

    const [currentUser, seller] = await Promise.all([
      User.findById(currentUserId),
      User.findById(sellerId),
    ]);

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!seller) {
      return NextResponse.json({ success: false, message: "Seller not found" }, { status: 404 });
    }

    const followedStores = Array.isArray(currentUser?.followedStores) ? [...currentUser.followedStores] : [];
    const storeFollowerIds = Array.isArray(seller?.storeFollowerIds) ? [...seller.storeFollowerIds] : [];
    const isFollowing = followedStores.includes(String(sellerId));

    if (isFollowing) {
      currentUser.followedStores = followedStores.filter((id) => String(id) !== String(sellerId));
      seller.storeFollowerIds = storeFollowerIds.filter((id) => String(id) !== String(currentUserId));
    } else {
      currentUser.followedStores = [...new Set([...followedStores, String(sellerId)])];
      seller.storeFollowerIds = [...new Set([...storeFollowerIds, String(currentUserId)])];
    }

    seller.storeFollowersCount = seller.storeFollowerIds.length;

    await Promise.all([
      currentUser.save(),
      seller.save(),
    ]);

    return NextResponse.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: seller.storeFollowersCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Unable to update follow status" }, { status: 500 });
  }
}
