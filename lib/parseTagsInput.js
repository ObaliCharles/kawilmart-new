import Tag from "@/models/Tag";

export const parseTagsInput = async (formData) => {
    const raw = formData.get("tags");
    if (typeof raw !== "string" || !raw) return [];

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return [];
    }

    if (!Array.isArray(parsed)) return [];
    const slugs = [...new Set(parsed.filter((value) => typeof value === "string" && value))];
    if (!slugs.length) return [];

    const validTags = await Tag.find({ slug: { $in: slugs } }).select("slug").lean();
    const validSlugs = new Set(validTags.map((tag) => tag.slug));

    return slugs.filter((slug) => validSlugs.has(slug));
};
