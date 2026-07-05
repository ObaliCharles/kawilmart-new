import "server-only";

import connectDB from "@/config/db";
import { resolveSiteContent } from "@/lib/defaultSiteContent";
import SiteContent from "@/models/SiteContent";

export const getResolvedSiteContent = async () => {
    try {
        await connectDB();
        const content = await SiteContent.findOne({ key: "homepage" }).lean();
        return resolveSiteContent(content);
    } catch {
        return resolveSiteContent(null);
    }
};
