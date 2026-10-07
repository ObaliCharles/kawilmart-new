import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import SavedSearch from "@/models/SavedSearch";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        const { id } = await params;
        const body = await request.json();
        if (!userId) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        const update = {};
        if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim().slice(0, 80);
        if (typeof body.enabled === "boolean") update.enabled = body.enabled;
        const search = await SavedSearch.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
        if (!search) return NextResponse.json({ success: false, message: "Saved search not found" }, { status: 404 });
        return NextResponse.json({ success: true, search });
    } catch {
        return NextResponse.json({ success: false, message: "Unable to update saved search." }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const userId = await getRequestUserId(request);
        const { id } = await params;
        if (!userId) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        const result = await SavedSearch.deleteOne({ _id: id, userId });
        return NextResponse.json({ success: result.deletedCount > 0 });
    } catch {
        return NextResponse.json({ success: false, message: "Unable to delete saved search." }, { status: 400 });
    }
}
