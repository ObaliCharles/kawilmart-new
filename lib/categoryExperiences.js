import { assets } from "@/assets/assets";
import { getCategoryMeta } from "@/lib/marketplaceCategories";

const normalizeText = (value = "") => (
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

export const getProductImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  if (typeof image === "string" && image.trim()) {
    return image.trim();
  }

  if (image && typeof image === "object" && typeof image.src === "string") {
    return image.src;
  }

  return assets.upload_area;
};

const countMatches = (products, categories, keywords) => (
  products.filter((product) => {
    const haystack = `${normalizeText(product?.name)} ${normalizeText(product?.description)} ${normalizeText(product?.category)}`;
    return categories.some((category) => normalizeText(product?.category).includes(normalizeText(category)))
      || keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
  }).length
);

const findRepresentativeProduct = (products, categories, keywords, fallbackCategory) => (
  products.find((product) => {
    const haystack = `${normalizeText(product?.name)} ${normalizeText(product?.description)} ${normalizeText(product?.category)}`;
    return categories.some((category) => normalizeText(product?.category).includes(normalizeText(category)))
      || keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
  }) || products.find((product) => normalizeText(product?.category).includes(normalizeText(fallbackCategory))) || products[0] || null
);

const toTile = (label, categories, keywords, description) => ({ label, categories, keywords, description });

const categoryBlueprints = {
  "Fashion": {
    heroTitle: "Fashion Finds",
    heroSubtitle: "Style drops, wardrobe basics, and everyday accessories.",
    heroTint: "from-[#221722] via-[#381e2e] to-[#5a2940]",
    heroBadge: "New season edits",
    ctaLabel: "Shop Fashion",
    tiles: [
      toTile("Shoes", ["Fashion"], ["shoe", "sneaker", "boot"], "Footwear for every day"),
      toTile("Clothing", ["Fashion"], ["shirt", "dress", "jacket", "trouser"], "Ready-to-wear staples"),
      toTile("Bags", ["Fashion", "Accessories"], ["bag", "backpack", "handbag"], "Carryall styles"),
      toTile("Watches", ["Watches & Wearables", "Fashion"], ["watch"], "Dress and smart watches"),
      toTile("Accessories", ["Accessories", "Fashion"], ["belt", "wallet", "cap", "sunglasses"], "Easy add-ons"),
      toTile("Sale Picks", ["Fashion"], ["sale", "deal", "discount"], "Best value picks"),
    ],
  },
  "Beauty & Cosmetics": {
    heroTitle: "Beauty Essentials",
    heroSubtitle: "Skincare, makeup, haircare, and self-care favorites.",
    heroTint: "from-[#29151f] via-[#431b2c] to-[#7a2e4a]",
    heroBadge: "Glow up",
    ctaLabel: "Shop Beauty",
    tiles: [
      toTile("Skincare", ["Beauty & Cosmetics"], ["skin", "skincare", "cream", "lotion"], "Cleansers and creams"),
      toTile("Makeup", ["Beauty & Cosmetics"], ["makeup", "lipstick", "powder", "foundation"], "Everyday beauty"),
      toTile("Hair Care", ["Beauty & Cosmetics"], ["hair", "shampoo", "conditioner"], "Hair essentials"),
      toTile("Fragrance", ["Beauty & Cosmetics"], ["perfume", "fragrance", "body mist"], "Scent picks"),
      toTile("Bath & Body", ["Beauty & Cosmetics"], ["soap", "body wash", "deodorant"], "Daily care"),
      toTile("Gifts", ["Beauty & Cosmetics"], ["gift", "set"], "Bundles and sets"),
    ],
  },
  "Health & Personal Care": {
    heroTitle: "Health & Wellness",
    heroSubtitle: "Wellness, grooming, and personal care essentials.",
    heroTint: "from-[#123023] via-[#174134] to-[#2f6d4d]",
    heroBadge: "Everyday care",
    ctaLabel: "Shop Health",
    tiles: [
      toTile("Wellness", ["Health & Personal Care"], ["wellness", "vitamin", "supplement"], "General wellness"),
      toTile("Grooming", ["Health & Personal Care"], ["groom", "shaver", "razor"], "Mens grooming"),
      toTile("Oral Care", ["Health & Personal Care"], ["toothbrush", "toothpaste", "oral"], "Smile care"),
      toTile("First Aid", ["Health & Personal Care"], ["first aid", "bandage"], "Home medical basics"),
      toTile("Fitness", ["Health & Personal Care"], ["fitness", "exercise", "gym"], "Workout helpers"),
      toTile("Family Care", ["Health & Personal Care"], ["family", "care", "baby"], "Shared essentials"),
    ],
  },
  "Home & Living": {
    heroTitle: "Home & Living",
    heroSubtitle: "Furniture, kitchen items, decor, and daily household needs.",
    heroTint: "from-[#1f2829] via-[#2f3a38] to-[#51635f]",
    heroBadge: "For the home",
    ctaLabel: "Shop Home",
    tiles: [
      toTile("Furniture", ["Home & Living"], ["chair", "table", "sofa", "furniture"], "Living room basics"),
      toTile("Kitchen", ["Home & Living", "Appliances"], ["kitchen", "cook", "pot", "pan"], "Cooking and prep"),
      toTile("Decor", ["Home & Living"], ["decor", "lamp", "wall", "frame"], "Home accents"),
      toTile("Storage", ["Home & Living"], ["storage", "organizer", "box"], "Keep things tidy"),
      toTile("Bedding", ["Home & Living"], ["bedding", "blanket", "sheet", "pillow"], "Bedroom comfort"),
      toTile("Cleaning", ["Home & Living"], ["clean", "mop", "broom", "detergent"], "Cleaning essentials"),
    ],
  },
  "Phones & Tablets": {
    heroTitle: "Phones & Tablets",
    heroSubtitle: "Smartphones, tablets, and the accessories people buy with them.",
    heroTint: "from-[#0f2946] via-[#163b67] to-[#1f67ad]",
    heroBadge: "Top mobile picks",
    ctaLabel: "Shop Phones",
    tiles: [
      toTile("Smartphones", ["Phones & Tablets", "Smartphone"], ["phone", "smartphone", "iphone", "galaxy"], "Latest phones"),
      toTile("Tablets", ["Phones & Tablets"], ["tablet", "ipad"], "Portable displays"),
      toTile("Cases", ["Accessories"], ["case", "cover"], "Protection and style"),
      toTile("Chargers", ["Accessories"], ["charger", "adapter", "fast charge"], "Power up fast"),
      toTile("Power Banks", ["Accessories"], ["power bank", "battery"], "On-the-go power"),
      toTile("Audio", ["Audio"], ["earphone", "earbud", "headphone"], "Mobile sound"),
    ],
  },
  "Computers & Electronics": {
    heroTitle: "Computers & Electronics",
    heroSubtitle: "Laptops, desktops, monitors, cameras, and creator gear.",
    heroTint: "from-[#111317] via-[#1b2230] to-[#2d3d58]",
    heroBadge: "Work and play",
    ctaLabel: "Shop Electronics",
    tiles: [
      toTile("Laptops", ["Computers & Electronics", "Laptop"], ["laptop", "macbook", "thinkpad"], "Portable computing"),
      toTile("Desktops", ["Computers & Electronics"], ["desktop", "pc", "tower"], "Desk setups"),
      toTile("Monitors", ["Computers & Electronics"], ["monitor", "display"], "Bigger screens"),
      toTile("Cameras", ["Computers & Electronics", "Camera"], ["camera", "canon", "nikon"], "Capture gear"),
      toTile("Audio", ["Audio"], ["speaker", "headphone"], "Sound essentials"),
      toTile("Wearables", ["Watches & Wearables", "Watch"], ["watch", "wearable"], "Connected tech"),
    ],
  },
  Audio: {
    heroTitle: "Audio",
    heroSubtitle: "Headphones, speakers, and sound gear for everyday listening.",
    heroTint: "from-[#24111e] via-[#3a1630] to-[#5a226a]",
    heroBadge: "Listen louder",
    ctaLabel: "Shop Audio",
    tiles: [
      toTile("Headphones", ["Audio", "Headphone"], ["headphone", "headset"], "Over-ear and on-ear"),
      toTile("Earphones", ["Audio", "Earphone"], ["earphone", "earbud"], "Compact listening"),
      toTile("Speakers", ["Audio"], ["speaker", "boom box"], "Portable speakers"),
      toTile("Soundbars", ["Audio"], ["soundbar"], "Home audio upgrades"),
      toTile("Microphones", ["Audio"], ["microphone", "mic"], "Recording gear"),
      toTile("Accessories", ["Audio", "Accessories"], ["cable", "adapter"], "Audio add-ons"),
    ],
  },
  "Watches & Wearables": {
    heroTitle: "Watches & Wearables",
    heroSubtitle: "Smart watches, fitness trackers, and straps.",
    heroTint: "from-[#21212b] via-[#353746] to-[#5d6174]",
    heroBadge: "Wrist tech",
    ctaLabel: "Shop Wearables",
    tiles: [
      toTile("Smartwatches", ["Watches & Wearables", "Watch"], ["watch", "smartwatch"], "Connected watches"),
      toTile("Fitness Bands", ["Watches & Wearables"], ["band", "fitness"], "Track activity"),
      toTile("Watch Straps", ["Accessories", "Watches & Wearables"], ["strap", "band"], "Swappable straps"),
      toTile("Chargers", ["Accessories"], ["charger", "dock"], "Power accessories"),
      toTile("Accessories", ["Accessories"], ["case", "protector"], "Handy extras"),
    ],
  },
  Accessories: {
    heroTitle: "Accessories",
    heroSubtitle: "Chargers, cables, adapters, and add-ons people actually need.",
    heroTint: "from-[#3b2511] via-[#5e3716] to-[#8d531e]",
    heroBadge: "Add-ons",
    ctaLabel: "Shop Accessories",
    tiles: [
      toTile("Chargers", ["Accessories"], ["charger", "fast charge", "adapter"], "Power essentials"),
      toTile("Cables", ["Accessories"], ["cable", "cord", "usb"], "Everyday cords"),
      toTile("Cases", ["Accessories"], ["case", "cover"], "Device protection"),
      toTile("Adapters", ["Accessories"], ["adapter", "converter"], "Compatibility tools"),
      toTile("Power Banks", ["Accessories"], ["power bank"], "Portable power"),
      toTile("Mounts", ["Accessories"], ["mount", "holder", "stand"], "Desk and car mounts"),
    ],
  },
  Appliances: {
    heroTitle: "Appliances",
    heroSubtitle: "Kitchen, laundry, and household appliances for daily life.",
    heroTint: "from-[#182026] via-[#253345] to-[#3f556d]",
    heroBadge: "Practical picks",
    ctaLabel: "Shop Appliances",
    tiles: [
      toTile("Kitchen", ["Appliances", "Home & Living"], ["kitchen", "cook", "stove"], "Cooking gear"),
      toTile("Laundry", ["Appliances"], ["washing machine", "laundry"], "Wash day essentials"),
      toTile("Refrigeration", ["Appliances"], ["fridge", "refrigerator"], "Cold storage"),
      toTile("Microwaves", ["Appliances"], ["microwave"], "Quick heating"),
      toTile("Fans", ["Appliances"], ["fan"], "Cooling comfort"),
      toTile("Small Appliances", ["Appliances"], ["blender", "iron", "kettle"], "Compact helpers"),
    ],
  },
  "Baby Products": {
    heroTitle: "Baby Products",
    heroSubtitle: "Baby care, feeding, nursery, and family essentials.",
    heroTint: "from-[#2a1c33] via-[#3f264d] to-[#6a3874]",
    heroBadge: "Family care",
    ctaLabel: "Shop Baby",
    tiles: [
      toTile("Feeding", ["Baby Products"], ["feeding", "bottle", "meal"], "Mealtime basics"),
      toTile("Diapers", ["Baby Products"], ["diaper", "nappy"], "Everyday care"),
      toTile("Nursery", ["Baby Products"], ["nursery", "crib"], "Sleep and comfort"),
      toTile("Baby Care", ["Baby Products"], ["baby care", "wash", "lotion"], "Gentle essentials"),
      toTile("Toys", ["Baby Products"], ["toy", "play"], "Playtime picks"),
      toTile("Travel", ["Baby Products"], ["stroller", "carrier"], "On-the-go helpers"),
    ],
  },
  "Office & Stationery": {
    heroTitle: "Office & Stationery",
    heroSubtitle: "Pens, notebooks, printers, and productivity basics.",
    heroTint: "from-[#13293d] via-[#184a72] to-[#3478a9]",
    heroBadge: "Work desk",
    ctaLabel: "Shop Office",
    tiles: [
      toTile("Notebooks", ["Office & Stationery"], ["notebook", "pad", "paper"], "Write it down"),
      toTile("Pens", ["Office & Stationery"], ["pen", "marker", "pencil"], "Writing essentials"),
      toTile("Printers", ["Office & Stationery", "Computers & Electronics"], ["printer", "scanner"], "Printing tools"),
      toTile("Desk Supplies", ["Office & Stationery"], ["desk", "stationery", "file"], "Daily office items"),
      toTile("Binders", ["Office & Stationery"], ["binder", "folder"], "Keep documents tidy"),
      toTile("School Tools", ["Office & Stationery"], ["school", "revision"], "Learning helpers"),
    ],
  },
  "Sports & Outdoors": {
    heroTitle: "Sports & Outdoors",
    heroSubtitle: "Fitness, camping, travel, and active lifestyle gear.",
    heroTint: "from-[#133026] via-[#1b4933] to-[#3f7a47]",
    heroBadge: "Move more",
    ctaLabel: "Shop Sports",
    tiles: [
      toTile("Fitness", ["Sports & Outdoors"], ["fitness", "gym", "exercise"], "Training basics"),
      toTile("Camping", ["Sports & Outdoors"], ["camp", "tent", "outdoor"], "Outdoor gear"),
      toTile("Travel", ["Sports & Outdoors"], ["travel", "bag"], "Trip-ready picks"),
      toTile("Football", ["Sports & Outdoors"], ["football", "ball"], "Match day"),
      toTile("Cycling", ["Sports & Outdoors"], ["cycle", "bike"], "Ride essentials"),
      toTile("Gear", ["Sports & Outdoors"], ["sport", "outdoor"], "General equipment"),
    ],
  },
  Automotive: {
    heroTitle: "Automotive",
    heroSubtitle: "Car accessories, maintenance basics, and road-ready tools.",
    heroTint: "from-[#291111] via-[#482121] to-[#7a3636]",
    heroBadge: "Car care",
    ctaLabel: "Shop Auto",
    tiles: [
      toTile("Car Care", ["Automotive"], ["car care", "cleaner", "polish"], "Keep it fresh"),
      toTile("Interior", ["Automotive"], ["seat", "mat", "interior"], "Cabin upgrades"),
      toTile("Exterior", ["Automotive"], ["cover", "wiper", "exterior"], "Outside protection"),
      toTile("Tools", ["Automotive", "Construction & Tools"], ["tool", "jack", "wrench"], "Workshop basics"),
      toTile("Electronics", ["Automotive"], ["car charger", "dashboard", "radio"], "In-car tech"),
      toTile("Accessories", ["Automotive", "Accessories"], ["adapter", "mount"], "Useful add-ons"),
    ],
  },
  "Books & Learning": {
    heroTitle: "Books & Learning",
    heroSubtitle: "Reading, revision, and school supplies for curious minds.",
    heroTint: "from-[#22172e] via-[#352149] to-[#5a3970]",
    heroBadge: "Learn more",
    ctaLabel: "Shop Books",
    tiles: [
      toTile("Textbooks", ["Books & Learning"], ["textbook", "book"], "Study materials"),
      toTile("Novels", ["Books & Learning"], ["novel", "story", "fiction"], "Reading picks"),
      toTile("Revision", ["Books & Learning"], ["revision", "exam"], "Exam prep"),
      toTile("Stationery", ["Office & Stationery"], ["pen", "notebook"], "Study kit"),
      toTile("Learning Tools", ["Books & Learning"], ["learning", "guide"], "Helpful resources"),
    ],
  },
  "Construction & Tools": {
    heroTitle: "Construction & Tools",
    heroSubtitle: "Hardware, repair, and building essentials for practical work.",
    heroTint: "from-[#181818] via-[#2b2b2b] to-[#4b3520]",
    heroBadge: "Work tools",
    ctaLabel: "Shop Tools",
    tiles: [
      toTile("Hand Tools", ["Construction & Tools"], ["hammer", "screwdriver", "wrench"], "Grab-and-go tools"),
      toTile("Power Tools", ["Construction & Tools"], ["drill", "saw", "grinder"], "Powered equipment"),
      toTile("Safety Gear", ["Construction & Tools"], ["helmet", "glove", "safety"], "Protective gear"),
      toTile("Hardware", ["Construction & Tools"], ["bolt", "nail", "hardware"], "Fasteners and parts"),
      toTile("Measuring", ["Construction & Tools"], ["measure", "tape"], "Accuracy tools"),
      toTile("Repair", ["Construction & Tools"], ["repair", "tool"], "General fixes"),
    ],
  },
};

const fallbackBlueprint = (meta) => ({
  heroTitle: meta.label,
  heroSubtitle: meta.description,
  heroTint: "from-[#161616] via-[#2a2a2a] to-[#414141]",
  heroBadge: "Browse more",
  ctaLabel: `Shop ${meta.label}`,
  tiles: [
    toTile("Top Picks", [meta.value], [meta.label], "Curated selection"),
    toTile("New Arrivals", [meta.value], ["new", "latest"], "Fresh inventory"),
    toTile("Best Sellers", [meta.value], ["best", "popular"], "Popular items"),
    toTile("Deals", [meta.value], ["deal", "sale", "discount"], "Value picks"),
    toTile("Accessories", [meta.value, "Accessories"], ["accessory", "add-on"], "Handy extras"),
  ],
});

export const getCategoryExperience = (products, categoryValue) => {
  const meta = getCategoryMeta(categoryValue);
  const blueprint = categoryBlueprints[meta.value] || fallbackBlueprint(meta);

  const tiles = blueprint.tiles.map((tile) => {
    const product = findRepresentativeProduct(products, tile.categories, tile.keywords, meta.value);
    return {
      ...tile,
      product,
      count: countMatches(products, tile.categories, tile.keywords),
    };
  });

  return {
    meta,
    ...blueprint,
    tiles,
    heroProducts: tiles.slice(0, 4).map((tile) => tile.product).filter(Boolean),
    featuredProduct: tiles.find((tile) => tile.product)?.product || products[0] || null,
  };
};
