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

const CategoryIcon = ({ type, className = "h-5 w-5" }) => (
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

const sectionBackgrounds = [
  "bg-orange-50",
  "bg-blue-50",
  "bg-green-50",
  "bg-purple-50",
  "bg-pink-50",
  "bg-cyan-50",
  "bg-amber-50",
  "bg-rose-50",
];

const CategoryTile = ({ tile, product, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-gray-50 text-center transition-all duration-150 hover:bg-orange-100 hover:shadow-sm active:scale-[0.98]"
  >
    <span className="flex w-full items-center justify-center h-[3.4rem] p-1.5">
      {product ? (
        <Image
          src={getProductImage(product)}
          alt={tile.label}
          width={65}
          height={55}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
          <CategoryIcon type="basket" className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
    <span className="line-clamp-2 min-h-5 px-1 pb-1.5 text-center font-medium text-gray-800 text-[9px] leading-[12px]">
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

      <main className="flex min-h-screen bg-[#f8fafc] pb-24 lg:hidden">
        {/* Left panel - scrollable */}
        <aside className="w-[5.2rem] shrink-0 overflow-y-auto border-r border-gray-100 bg-white min-[390px]:w-[5.6rem]">
          <div className="flex flex-col">
            {departments.map((department) => {
              const active = department.label === currentDepartment.label;
              return (
                <button
                  key={department.label}
                  type="button"
                  onClick={() => setSelectedDepartment(department.label)}
                  className={`relative flex w-full flex-col items-center gap-0.5 border-b border-gray-100 py-2 text-center transition min-[390px]:py-2.5 ${
                    active ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 active:bg-gray-50"
                  }`}
                >
                  {active ? <span className="absolute left-0 top-0 h-full w-[3px] bg-orange-600" /> : null}
                  <span className={`flex h-5 w-5 items-center justify-center ${active ? "text-orange-600" : "text-gray-400"}`}>
                    <CategoryIcon type={department.icon} className="h-[14px] w-[14px] min-[390px]:h-4 min-[390px]:w-4" />
                  </span>
                  <span className={`leading-tight ${active ? "font-semibold text-gray-950" : "font-medium text-gray-500"} text-[8px] min-[390px]:text-[9px]`}>
                    {department.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto px-2 py-3 min-[390px]:px-2.5">
          <h1 className="mb-2.5 text-sm font-bold text-gray-900">
            {currentDepartment.sections[0].title}
          </h1>

          <div className="space-y-3">
            {currentDepartment.sections.map((section, sectionIndex) => (
              <section key={section.title}>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <h2 className="text-[12px] font-semibold text-gray-700">
                    {sectionIndex === 0 ? "All categories" : section.title}
                  </h2>
                  <button type="button" onClick={() => goToCategory(section.seeAll)} className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600">
                    See All
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                {/* Section card with tinted background like cart's ring */}
                <div className="rounded-xl bg-white p-2 shadow-sm">
                  <div className="grid grid-cols-3 gap-1.5">
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
                          onClick={() => goToCategory(targetCategory)}
                        />
                      );
                    })}
                  </div>
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