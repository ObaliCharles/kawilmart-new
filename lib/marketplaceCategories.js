const categoryGroups = [
    {
        label: "Marketplace categories",
        items: [
            {
                value: "Fashion",
                label: "Fashion",
                icon: "👠",
                description: "Clothes, shoes, bags, and accessories.",
                accent: "from-rose-500 via-orange-400 to-amber-300",
            },
            {
                value: "Beauty & Cosmetics",
                label: "Beauty & Cosmetics",
                icon: "💄",
                description: "Makeup, skincare, haircare, and fragrances.",
                accent: "from-pink-500 via-rose-400 to-orange-300",
            },
            {
                value: "Health & Personal Care",
                label: "Health & Personal Care",
                icon: "🧴",
                description: "Grooming, wellness, and daily personal care.",
                accent: "from-emerald-500 via-teal-400 to-cyan-300",
            },
            {
                value: "Home & Living",
                label: "Home & Living",
                icon: "🛋️",
                description: "Home decor, bedding, storage, and essentials.",
                accent: "from-amber-500 via-orange-400 to-yellow-300",
            },
            {
                value: "Phones & Tablets",
                label: "Phones & Tablets",
                icon: "📱",
                description: "Smartphones, tablets, and mobile accessories.",
                accent: "from-sky-500 via-blue-500 to-indigo-400",
                aliases: ["Smartphone"],
            },
            {
                value: "Computers & Electronics",
                label: "Computers & Electronics",
                icon: "💻",
                description: "Laptops, cameras, gadgets, and office tech.",
                accent: "from-slate-700 via-slate-600 to-slate-500",
                aliases: ["Laptop", "Camera"],
            },
            {
                value: "Audio",
                label: "Audio",
                icon: "🎧",
                description: "Headphones, earphones, speakers, and sound gear.",
                accent: "from-violet-600 via-fuchsia-500 to-pink-400",
                aliases: ["Headphone", "Earphone"],
            },
            {
                value: "Watches & Wearables",
                label: "Watches & Wearables",
                icon: "⌚",
                description: "Smart watches, trackers, and wearables.",
                accent: "from-zinc-700 via-gray-600 to-slate-500",
                aliases: ["Watch"],
            },
            {
                value: "Accessories",
                label: "Accessories",
                icon: "🔌",
                description: "Chargers, cables, adapters, and handy add-ons.",
                accent: "from-orange-600 via-amber-500 to-yellow-400",
            },
            {
                value: "Appliances",
                label: "Appliances",
                icon: "🍳",
                description: "Kitchen, home, and small electrical appliances.",
                accent: "from-cyan-600 via-sky-500 to-blue-400",
            },
            {
                value: "Baby Products",
                label: "Baby Products",
                icon: "🍼",
                description: "Baby care, feeding, nursery, and kid essentials.",
                accent: "from-fuchsia-500 via-pink-400 to-rose-300",
            },
            {
                value: "Office & Stationery",
                label: "Office & Stationery",
                icon: "✏️",
                description: "School, office, printing, and stationery supplies.",
                accent: "from-indigo-600 via-blue-500 to-cyan-400",
            },
            {
                value: "Sports & Outdoors",
                label: "Sports & Outdoors",
                icon: "⚽",
                description: "Fitness, travel, camping, and outdoor gear.",
                accent: "from-green-600 via-emerald-500 to-lime-400",
            },
            {
                value: "Automotive",
                label: "Automotive",
                icon: "🚗",
                description: "Car accessories, tools, and maintenance products.",
                accent: "from-red-600 via-orange-500 to-amber-400",
            },
            {
                value: "Books & Learning",
                label: "Books & Learning",
                icon: "📚",
                description: "Books, revision materials, and learning aids.",
                accent: "from-purple-600 via-indigo-500 to-blue-400",
            },
            {
                value: "Construction & Tools",
                label: "Construction & Tools",
                icon: "🛠️",
                description: "Hardware, building supplies, and work tools.",
                accent: "from-stone-700 via-orange-600 to-amber-500",
            },
        ],
    },
    {
        label: "Legacy electronics categories",
        items: [
            {
                value: "Smartphone",
                label: "Smartphone",
                icon: "📱",
                description: "Legacy mobile category for existing listings.",
                accent: "from-sky-500 via-blue-500 to-indigo-400",
                aliases: ["Phones & Tablets"],
            },
            {
                value: "Laptop",
                label: "Laptop",
                icon: "💻",
                description: "Legacy computer category for existing listings.",
                accent: "from-slate-700 via-slate-600 to-slate-500",
                aliases: ["Computers & Electronics"],
            },
            {
                value: "Camera",
                label: "Camera",
                icon: "📷",
                description: "Legacy camera category for existing listings.",
                accent: "from-slate-700 via-slate-600 to-slate-500",
                aliases: ["Computers & Electronics"],
            },
            {
                value: "Headphone",
                label: "Headphone",
                icon: "🎧",
                description: "Legacy audio category for existing listings.",
                accent: "from-violet-600 via-fuchsia-500 to-pink-400",
                aliases: ["Audio"],
            },
            {
                value: "Earphone",
                label: "Earphone",
                icon: "🎵",
                description: "Legacy audio category for existing listings.",
                accent: "from-violet-600 via-fuchsia-500 to-pink-400",
                aliases: ["Audio"],
            },
            {
                value: "Watch",
                label: "Watch",
                icon: "⌚",
                description: "Legacy wearable category for existing listings.",
                accent: "from-zinc-700 via-gray-600 to-slate-500",
                aliases: ["Watches & Wearables"],
            },
        ],
    },
];

const flattenCategories = () =>
    categoryGroups.flatMap((group) =>
        group.items.map((item) => ({
            ...item,
            aliases: Array.isArray(item.aliases) ? item.aliases : [],
        }))
    );

const flatCategories = flattenCategories();
const categoryMetaByValue = new Map(flatCategories.map((category) => [category.value, category]));

const dedupeValues = (values) => [...new Set(values.filter(Boolean))];

export const sellerCategoryGroups = categoryGroups;
export const defaultSellerCategory = "Fashion";

export const marketplaceFilterCategories = dedupeValues(
    flatCategories.map((category) => category.value)
);

export const homeCategoryValues = [
    "Fashion",
    "Beauty & Cosmetics",
    "Health & Personal Care",
    "Home & Living",
    "Phones & Tablets",
    "Computers & Electronics",
    "Audio",
    "Watches & Wearables",
    "Accessories",
    "Appliances",
    "Baby Products",
    "Office & Stationery",
];

export const homeOfferCollectionValues = [
    "Fashion",
    "Beauty & Cosmetics",
    "Home & Living",
    "Phones & Tablets",
    "Computers & Electronics",
    "Audio",
    "Watches & Wearables",
    "Accessories",
    "Appliances",
    "Sports & Outdoors",
];

export const buildCategoryHref = (category) =>
    `/all-products?category=${encodeURIComponent(category)}`;

export const getCategoryMeta = (value) =>
    categoryMetaByValue.get(value) || {
        value,
        label: value || "More products",
        icon: "🛍️",
        description: "Discover more offers across the marketplace.",
        accent: "from-slate-700 via-slate-600 to-slate-500",
        aliases: [],
    };

export const getCategoryMonogram = (value) =>
    getCategoryMeta(value)
        .label
        .split(/[\s&]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

export const getCategoryIcon = (value) => getCategoryMeta(value).icon;

export const categoryMatchesSelection = (productCategory, selectedCategory) => {
    if (!selectedCategory || selectedCategory === "All") {
        return true;
    }

    if (productCategory === selectedCategory) {
        return true;
    }

    const selectedCategoryMeta = categoryMetaByValue.get(selectedCategory);
    if (selectedCategoryMeta?.aliases.includes(productCategory)) {
        return true;
    }

    const productCategoryMeta = categoryMetaByValue.get(productCategory);
    if (productCategoryMeta?.aliases.includes(selectedCategory)) {
        return true;
    }

    return false;
};
