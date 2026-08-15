import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import AuditLog from "@/models/AuditLog";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const targetType = searchParams.get("targetType") || "";
        const targetId = searchParams.get("targetId") || "";
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
        const query = {};

        if (targetType) {
            query.targetType = targetType;
        }

        if (targetId) {
            query.targetId = targetId;
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
