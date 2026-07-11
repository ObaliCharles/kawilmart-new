'use client'

import Image from "next/image";
import { useMemo, useState } from "react";
import MegaStoreHome from "@/components/MegaStoreHome";
import { useAppContext } from "@/context/AppContext";
import { getProductImage } from "@/lib/categoryExperiences";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";

const normalizeText = (value = "") => (
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const findProduct = (products, categories = [], keywords = []) => (
  products.find((product) => {
    const haystack = `${normalizeText(product?.name)} ${normalizeText(product?.description)} ${normalizeText(product?.category)}`;
    const categoryMatch = categories.some((category) => (
      categoryMatchesSelection(product?.category, category)
      || normalizeText(product?.category).includes(normalizeText(category))
    ));
    const keywordMatch = keywords.some((keyword) => haystack.includes(normalizeText(keyword)));

    return categoryMatch || keywordMatch;
  }) || products[0] || null
);

const iconPaths = {
  basket: "M6 9h12l-1.5 10h-9L6 9Zm2-3 3-3m5 3-3-3M4 9h16",
  phone: "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  tv: "M5 6h14v10H5V6Zm-2 13h18",
  bottle: "M10 3h4v4l1.5 2v11h-7V9L10 7V3Z",
  dress: "M9 4h6l2 5-2 1.5V20H9v-9.5L7 9l2-5Z",
  shirt: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
  laptop: "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
  ball: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  leaf: "M5 18c6 1 11-4 14-12-8 0-14 5-14 12Zm3-2c1-2 4-4 8-5",
};

const CategoryIcon = ({ type, className = "h-7 w-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={iconPaths[type] || iconPaths.basket} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const departments = [
  {
    label: "Supermarket",
    icon: "basket",
    sections: [
      {
        title: "Supermarket",
        seeAll: "Home & Living",
        tiles: [
          { label: "Snacks", categories: ["Home & Living"], keywords: ["snack", "chips", "biscuit"] },
          { label: "Soft Drinks", categories: ["Appliances"], keywords: ["soda", "drink", "cola", "sprite"] },
          { label: "Fruit Juice", categories: ["Appliances"], keywords: ["juice", "fruit", "mango", "orange"] },
          { label: "Water", categories: ["Home & Living"], keywords: ["water", "bottled"] },
          { label: "Coffee, Tea & Cocoa", categories: ["Home & Living", "Appliances"], keywords: ["coffee", "tea", "cocoa"] },
          { label: "Milk & Cream", categories: ["Home & Living"], keywords: ["milk", "cream", "dairy"] },
          { label: "Pasta", categories: ["Home & Living"], keywords: ["pasta", "spaghetti", "macaroni"] },
          { label: "Cooking Oil", categories: ["Home & Living", "Appliances"], keywords: ["oil", "sunseed"] },
          { label: "Spices", categories: ["Home & Living"], keywords: ["spice", "seasoning", "pepper"] },
          { label: "Breakfast Foods", categories: ["Home & Living"], keywords: ["cereal", "breakfast", "flakes"] },
        ],
      },
      {
        title: "Beer, Wine & Spirits",
        seeAll: "Home & Living",
        tiles: [
          { label: "Vodka", categories: ["Home & Living"], keywords: ["vodka"] },
          { label: "Red & Rose wine", categories: ["Home & Living"], keywords: ["wine", "rose"] },
          { label: "Spirits & Liquors", categories: ["Home & Living"], keywords: ["spirits", "liquor", "whisky"] },
          { label: "Beer", categories: ["Home & Living"], keywords: ["beer"] },
          { label: "White wine", categories: ["Home & Living"], keywords: ["white wine"] },
          { label: "Whisky", categories: ["Home & Living"], keywords: ["whisky", "whiskey"] },
        ],
      },
    ],
  },
  {
    label: "Phones & Tablets",
    icon: "phone",
    sections: [
      {
        title: "Phones & Tablets",
        seeAll: "Phones & Tablets",
        tiles: [
          { label: "Smartphones", categories: ["Phones & Tablets", "Smartphone"], keywords: ["phone", "smartphone", "iphone", "galaxy"] },
          { label: "Tablets", categories: ["Phones & Tablets"], keywords: ["tablet", "ipad"] },
          { label: "Cases", categories: ["Accessories"], keywords: ["case", "cover"] },
          { label: "Chargers", categories: ["Accessories"], keywords: ["charger", "adapter"] },
          { label: "Power Banks", categories: ["Accessories"], keywords: ["power bank"] },
          { label: "Earphones", categories: ["Audio"], keywords: ["earphone", "earbud"] },
        ],
      },
    ],
  },
  {
    label: "Home & Office",
    icon: "home",
    sections: [
      {
        title: "Home & Office",
        seeAll: "Home & Living",
        tiles: [
          { label: "Furniture", categories: ["Home & Living"], keywords: ["chair", "table", "sofa"] },
          { label: "Kitchen", categories: ["Appliances", "Home & Living"], keywords: ["kitchen", "cook"] },
          { label: "Storage", categories: ["Home & Living"], keywords: ["storage", "organizer"] },
          { label: "Office Supplies", categories: ["Office & Stationery"], keywords: ["office", "stationery"] },
          { label: "Decor", categories: ["Home & Living"], keywords: ["decor", "frame"] },
          { label: "Appliances", categories: ["Appliances"], keywords: ["appliance", "kettle", "blender"] },
        ],
      },
    ],
  },
  {
    label: "Electronics",
    icon: "tv",
    sections: [
      {
        title: "Electronics",
        seeAll: "Computers & Electronics",
        tiles: [
          { label: "Laptops", categories: ["Computers & Electronics", "Laptop"], keywords: ["laptop", "macbook"] },
          { label: "TVs", categories: ["Computers & Electronics", "Appliances"], keywords: ["tv", "television"] },
          { label: "Cameras", categories: ["Computers & Electronics", "Camera"], keywords: ["camera", "canon"] },
          { label: "Audio", categories: ["Audio", "Headphone", "Earphone"], keywords: ["headphone", "speaker"] },
          { label: "Wearables", categories: ["Watches & Wearables", "Watch"], keywords: ["watch"] },
          { label: "Accessories", categories: ["Accessories"], keywords: ["charger", "cable"] },
        ],
      },
    ],
  },
  {
    label: "Health & Beauty",
    icon: "bottle",
    sections: [
      {
        title: "Health & Beauty",
        seeAll: "Beauty & Cosmetics",
        tiles: [
          { label: "Skincare", categories: ["Beauty & Cosmetics"], keywords: ["skin", "cream", "lotion"] },
          { label: "Makeup", categories: ["Beauty & Cosmetics"], keywords: ["makeup", "lipstick"] },
          { label: "Hair Care", categories: ["Beauty & Cosmetics"], keywords: ["hair", "shampoo"] },
          { label: "Grooming", categories: ["Health & Personal Care"], keywords: ["groom", "shaver"] },
          { label: "Fragrance", categories: ["Beauty & Cosmetics"], keywords: ["perfume", "fragrance"] },
          { label: "Wellness", categories: ["Health & Personal Care"], keywords: ["wellness", "vitamin"] },
        ],
      },
    ],
  },
  {
    label: "Women's Fashion",
    icon: "dress",
    sections: [
      {
        title: "Women's Fashion",
        seeAll: "Fashion",
        tiles: [
          { label: "Dresses", categories: ["Fashion"], keywords: ["dress"] },
          { label: "Tops", categories: ["Fashion"], keywords: ["top", "shirt"] },
          { label: "Shoes", categories: ["Fashion"], keywords: ["shoe", "sneaker", "heel"] },
          { label: "Bags", categories: ["Fashion", "Accessories"], keywords: ["bag", "handbag"] },
          { label: "Jewelry", categories: ["Fashion"], keywords: ["jewelry", "necklace"] },
          { label: "Accessories", categories: ["Accessories", "Fashion"], keywords: ["belt", "wallet"] },
        ],
      },
    ],
  },
  {
    label: "Men's Fashion",
    icon: "shirt",
    sections: [
      {
        title: "Men's Fashion",
        seeAll: "Fashion",
        tiles: [
          { label: "Shirts", categories: ["Fashion"], keywords: ["shirt"] },
          { label: "Trousers", categories: ["Fashion"], keywords: ["trouser", "jeans"] },
          { label: "Shoes", categories: ["Fashion"], keywords: ["shoe", "sneaker"] },
          { label: "Watches", categories: ["Watches & Wearables", "Fashion"], keywords: ["watch"] },
          { label: "Bags", categories: ["Fashion", "Accessories"], keywords: ["bag", "backpack"] },
          { label: "Accessories", categories: ["Accessories", "Fashion"], keywords: ["belt", "cap"] },
        ],
      },
    ],
  },
  {
    label: "Computing",
    icon: "laptop",
    sections: [
      {
        title: "Computing",
        seeAll: "Computers & Electronics",
        tiles: [
          { label: "Laptops", categories: ["Computers & Electronics", "Laptop"], keywords: ["laptop"] },
          { label: "Desktops", categories: ["Computers & Electronics"], keywords: ["desktop", "pc"] },
          { label: "Monitors", categories: ["Computers & Electronics"], keywords: ["monitor", "display"] },
          { label: "Printers", categories: ["Office & Stationery", "Computers & Electronics"], keywords: ["printer"] },
          { label: "Storage", categories: ["Computers & Electronics"], keywords: ["ssd", "drive"] },
          { label: "Networking", categories: ["Computers & Electronics"], keywords: ["router", "wifi"] },
        ],
      },
    ],
  },
  {
    label: "Sporting Goods",
    icon: "ball",
    sections: [
      {
        title: "Sporting Goods",
        seeAll: "Sports & Outdoors",
        tiles: [
          { label: "Fitness", categories: ["Sports & Outdoors"], keywords: ["fitness", "gym"] },
          { label: "Football", categories: ["Sports & Outdoors"], keywords: ["football", "ball"] },
          { label: "Cycling", categories: ["Sports & Outdoors"], keywords: ["cycle", "bike"] },
          { label: "Camping", categories: ["Sports & Outdoors"], keywords: ["camp", "tent"] },
          { label: "Running", categories: ["Sports & Outdoors"], keywords: ["run", "running"] },
          { label: "Outdoor Gear", categories: ["Sports & Outdoors"], keywords: ["outdoor", "travel"] },
        ],
      },
    ],
  },
  {
    label: "Garden & Outdoors",
    icon: "leaf",
    sections: [
      {
        title: "Garden & Outdoors",
        seeAll: "Home & Living",
        tiles: [
          { label: "Plants", categories: ["Home & Living"], keywords: ["plant", "garden"] },
          { label: "Tools", categories: ["Construction & Tools"], keywords: ["tool", "spade"] },
          { label: "Outdoor Furniture", categories: ["Home & Living"], keywords: ["outdoor", "chair"] },
          { label: "Storage", categories: ["Home & Living"], keywords: ["storage"] },
          { label: "Lighting", categories: ["Home & Living"], keywords: ["light", "lamp"] },
          { label: "Grilling", categories: ["Home & Living", "Appliances"], keywords: ["grill", "bbq"] },
        ],
      },
    ],
  },
];

const categoryHref = (category) => `/all-products?category=${encodeURIComponent(category)}`;

const CategoryTile = ({ tile, product, onClick, compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-w-0 flex-col items-center justify-center rounded-lg bg-white text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition active:scale-[0.985] ${compact ? "min-h-[8.35rem] p-2" : "min-h-[9.85rem] p-2.5 min-[390px]:p-3"}`}
  >
    <span className={`flex w-full items-center justify-center ${compact ? "h-[4.55rem]" : "h-[5.7rem]"}`}>
      {product ? (
        <Image
          src={getProductImage(product)}
          alt={tile.label}
          width={compact ? 100 : 120}
          height={compact ? 86 : 104}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <CategoryIcon type="basket" className="h-7 w-7" />
        </span>
      )}
    </span>
    <span className={`line-clamp-2 min-h-8 ${compact ? "mt-2 text-[12px] leading-4" : "mt-3 text-[13px] leading-4 min-[390px]:text-[14px] min-[390px]:leading-5"} font-medium text-gray-950`}>
      {tile.label}
    </span>
  </button>
);

const CategoryBrowserPage = ({ siteContent, initialProducts = [] }) => {
  const { products, navigate, setIsRouteLoading } = useAppContext();
  const [selectedDepartment, setSelectedDepartment] = useState("Supermarket");
  const storefrontProducts = products.length ? products : initialProducts;
  const currentDepartment = useMemo(
    () => departments.find((department) => department.label === selectedDepartment) || departments[0],
    [selectedDepartment]
  );

  const goToCategory = (category) => {
    setIsRouteLoading(true);
    navigate(categoryHref(category));
  };

  return (
    <>
      <div className="hidden lg:block">
        <MegaStoreHome siteContent={siteContent} initialProducts={initialProducts} />
      </div>

      <main className="grid min-h-screen grid-cols-[6.75rem_minmax(0,1fr)] bg-[#fbfbfb] pb-24 min-[390px]:grid-cols-[7.35rem_minmax(0,1fr)] lg:hidden">
        <aside className="border-r border-gray-100 bg-white">
          <div className="sticky top-0">
            {departments.map((department) => {
              const active = department.label === currentDepartment.label;

              return (
                <button
                  key={department.label}
                  type="button"
                  onClick={() => setSelectedDepartment(department.label)}
                  className={`relative flex h-[5.55rem] w-full items-center gap-1.5 border-b border-gray-100 px-2.5 text-left transition min-[390px]:h-[5.75rem] min-[390px]:gap-2 min-[390px]:px-3 ${active ? "bg-white text-gray-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)]" : "text-gray-900"}`}
                >
                  {active ? <span className="absolute left-0 top-3 h-[3.9rem] w-1 bg-orange-600 min-[390px]:h-[4.15rem]" /> : null}
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center min-[390px]:h-8 min-[390px]:w-8 ${active ? "text-orange-600" : "text-gray-700"}`}>
                    <CategoryIcon type={department.icon} className="h-5 w-5 min-[390px]:h-6 min-[390px]:w-6" />
                  </span>
                  <span className="text-[12px] font-semibold leading-[16px] min-[390px]:text-[13px] min-[390px]:leading-[18px]">{department.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 px-3 py-5 min-[390px]:px-4">
          <h1 className="mb-5 text-[25px] font-bold leading-tight text-gray-950 min-[390px]:text-[26px]">
            {currentDepartment.sections[0].title}
          </h1>

          <div className="space-y-6">
            {currentDepartment.sections.map((section, sectionIndex) => (
              <section
                key={section.title}
                className={sectionIndex === 0 ? "" : "rounded-xl bg-white p-3 shadow-[0_8px_26px_rgba(15,23,42,0.06)]"}
              >
                {sectionIndex > 0 ? (
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-bold uppercase tracking-wide text-gray-950">{section.title}</h2>
                    <button type="button" onClick={() => goToCategory(section.seeAll)} className="shrink-0 text-[14px] font-medium text-orange-600">
                      See All
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-3 gap-2.5 min-[390px]:gap-3">
                  {section.tiles.map((tile) => {
                    const product = findProduct(storefrontProducts, tile.categories, tile.keywords);
                    const targetCategory = currentDepartment.label === "Supermarket"
                      ? section.seeAll
                      : tile.categories?.[0] || section.seeAll;

                    return (
                      <CategoryTile
                        key={`${section.title}-${tile.label}`}
                        tile={tile}
                        product={product}
                        compact={sectionIndex > 0}
                        onClick={() => goToCategory(targetCategory)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default CategoryBrowserPage;
