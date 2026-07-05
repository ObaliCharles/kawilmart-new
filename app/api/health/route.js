import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

const getConnectionSnapshot = () => ({
    state: mongoose.connection.readyState,
    host: mongoose.connection.host || "",
    name: mongoose.connection.name || "",
});

export async function GET() {
    const timestamp = new Date().toISOString();

    try {
        await connectDB();

        return NextResponse.json({
            success: true,
            status: "ok",
            timestamp,
            database: getConnectionSnapshot(),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            status: "degraded",
            timestamp,
            database: getConnectionSnapshot(),
            message: error instanceof Error ? error.message : "Database connection failed",
        }, { status: 503 });
    }
}
