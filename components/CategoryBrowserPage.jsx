'use client'

import Image from "next/image";
import { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import CategoryLineIcon from "@/components/CategoryLineIcon";
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
    const categoryMatch = categories.some((category) => categoryMatchesSelection(product?.category, category) || normalizeText(product?.category).includes(normalizeText(category)));
    const keywordMatch = keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
    return categoryMatch || keywordMatch;
  }) || products[0] || null
);

const formatCount = (count) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(count) || 0));

const sidebarDepartments = [
  {
    label: "Supermarket",
    icon: "home",
    sections: [
      {
        title: "Supermarket",
        seeAll: "Home & Living",
        tiles: [
          { label: "Snacks", categories: ["Home & Living"], keywords: ["snack", "chips", "biscuit"], description: "Chips, crackers and treats" },
          { label: "Soft Drinks", categories: ["Appliances"], keywords: ["soda", "drink", "cola", "sprite"], description: "Chilled drinks and sodas" },
          { label: "Fruit Juice", categories: ["Appliances"], keywords: ["juice", "fruit", "mango", "orange"], description: "Juices and cartons" },
          { label: "Water", categories: ["Home & Living"], keywords: ["water", "bottled"], description: "Everyday hydration" },
          { label: "Coffee, Tea & Cocoa", categories: ["Home & Living", "Appliances"], keywords: ["coffee", "tea", "cocoa"], description: "Hot drinks staples" },
          { label: "Milk & Cream", categories: ["Home & Living"], keywords: ["milk", "cream", "dairy"], description: "Dairy essentials" },
          { label: "Pasta", categories: ["Home & Living"], keywords: ["pasta", "spaghetti", "macaroni"], description: "Pantry basics" },
          { label: "Cooking Oil", categories: ["Home & Living", "Appliances"], keywords: ["oil", "sunseed"], description: "Kitchen staples" },
          { label: "Spices", categories: ["Home & Living"], keywords: ["spice", "seasoning", "pepper"], description: "Flavor boosters" },
          { label: "Breakfast Foods", categories: ["Home & Living"], keywords: ["cereal", "breakfast", "flakes"], description: "Morning favorites" },
        ],
      },
      {
        title: "Beer, Wine & Spirits",
        seeAll: "Home & Living",
        tiles: [
          { label: "Vodka", categories: ["Home & Living"], keywords: ["vodka"], description: "Party essentials" },
          { label: "Red & Rose Wine", categories: ["Home & Living"], keywords: ["wine", "rose"], description: "Table wines" },
          { label: "Spirits & Liquors", categories: ["Home & Living"], keywords: ["spirits", "liquor", "whisky"], description: "Premium bottles" },
          { label: "Beer", categories: ["Home & Living"], keywords: ["beer"], description: "Chilled beer" },
          { label: "White Wine", categories: ["Home & Living"], keywords: ["white wine"], description: "Light wines" },
          { label: "Whisky", categories: ["Home & Living"], keywords: ["whisky", "whiskey"], description: "Classic spirits" },
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
          { label: "Smartphones", categories: ["Phones & Tablets", "Smartphone"], keywords: ["phone", "smartphone", "iphone"], description: "Latest mobile phones" },
          { label: "Tablets", categories: ["Phones & Tablets"], keywords: ["tablet", "ipad"], description: "Portable screens" },
          { label: "Cases", categories: ["Accessories"], keywords: ["case", "cover"], description: "Protection and style" },
          { label: "Chargers", categories: ["Accessories"], keywords: ["charger", "adapter"], description: "Power accessories" },
          { label: "Power Banks", categories: ["Accessories"], keywords: ["power bank"], description: "On-the-go power" },
          { label: "Earphones", categories: ["Audio"], keywords: ["earphone", "earbud"], description: "Mobile sound" },
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
          { label: "Furniture", categories: ["Home & Living"], keywords: ["chair", "table", "sofa"], description: "Home basics" },
          { label: "Kitchen", categories: ["Appliances", "Home & Living"], keywords: ["kitchen", "cook"], description: "Daily cooking" },
          { label: "Storage", categories: ["Home & Living"], keywords: ["storage", "organizer"], description: "Keep it tidy" },
          { label: "Lighting", categories: ["Home & Living"], keywords: ["light", "lamp"], description: "Brighten rooms" },
          { label: "Office Supplies", categories: ["Office & Stationery"], keywords: ["office", "stationery"], description: "Work desk tools" },
          { label: "Decor", categories: ["Home & Living"], keywords: ["decor", "frame"], description: "Finish the space" },
        ],
      },
    ],
  },
  {
    label: "Electronics",
    icon: "computer",
    sections: [
      {
        title: "Electronics",
        seeAll: "Computers & Electronics",
        tiles: [
          { label: "Laptops", categories: ["Computers & Electronics", "Laptop"], keywords: ["laptop", "macbook"], description: "Work and study" },
          { label: "TVs", categories: ["Computers & Electronics", "Appliances"], keywords: ["tv", "television"], description: "Entertainment screens" },
          { label: "Cameras", categories: ["Computers & Electronics", "Camera"], keywords: ["camera", "canon"], description: "Capture gear" },
          { label: "Audio", categories: ["Audio", "Headphone", "Earphone"], keywords: ["headphone", "speaker"], description: "Sound gear" },
          { label: "Wearables", categories: ["Watches & Wearables", "Watch"], keywords: ["watch"], description: "Smart accessories" },
          { label: "Accessories", categories: ["Accessories"], keywords: ["charger", "cable"], description: "Handy add-ons" },
        ],
      },
    ],
  },
  {
    label: "Health & Beauty",
    icon: "health",
    sections: [
      {
        title: "Health & Beauty",
        seeAll: "Beauty & Cosmetics",
        tiles: [
          { label: "Skincare", categories: ["Beauty & Cosmetics"], keywords: ["skin", "cream", "lotion"], description: "Daily care" },
          { label: "Makeup", categories: ["Beauty & Cosmetics"], keywords: ["makeup", "lipstick"], description: "Beauty picks" },
          { label: "Hair Care", categories: ["Beauty & Cosmetics"], keywords: ["hair", "shampoo"], description: "Hair essentials" },
          { label: "Grooming", categories: ["Health & Personal Care"], keywords: ["groom", "shaver"], description: "Self-care basics" },
          { label: "Fragrance", categories: ["Beauty & Cosmetics"], keywords: ["perfume", "fragrance"], description: "Signature scents" },
          { label: "Wellness", categories: ["Health & Personal Care"], keywords: ["wellness", "vitamin"], description: "Healthy habits" },
        ],
      },
    ],
  },
  {
    label: "Women's Fashion",
    icon: "fashion",
    sections: [
      {
        title: "Women's Fashion",
        seeAll: "Fashion",
        tiles: [
          { label: "Dresses", categories: ["Fashion"], keywords: ["dress"], description: "Everyday and occasion wear" },
          { label: "Tops", categories: ["Fashion"], keywords: ["top", "shirt"], description: "Easy style picks" },
          { label: "Shoes", categories: ["Fashion"], keywords: ["shoe", "sneaker", "heel"], description: "Footwear styles" },
          { label: "Bags", categories: ["Fashion", "Accessories"], keywords: ["bag", "handbag"], description: "Carry in style" },
          { label: "Jewelry", categories: ["Fashion"], keywords: ["jewelry", "necklace"], description: "Sparkling finish" },
          { label: "Accessories", categories: ["Accessories", "Fashion"], keywords: ["belt", "wallet"], description: "Style add-ons" },
        ],
      },
    ],
  },
  {
    label: "Men's Fashion",
    icon: "fashion",
    sections: [
      {
        title: "Men's Fashion",
        seeAll: "Fashion",
        tiles: [
          { label: "Shirts", categories: ["Fashion"], keywords: ["shirt"], description: "Smart and casual" },
          { label: "Trousers", categories: ["Fashion"], keywords: ["trouser", "jeans"], description: "Everyday fits" },
          { label: "Shoes", categories: ["Fashion"], keywords: ["shoe", "sneaker"], description: "Footwear" },
          { label: "Watches", categories: ["Watches & Wearables", "Fashion"], keywords: ["watch"], description: "Wrist wear" },
          { label: "Bags", categories: ["Fashion", "Accessories"], keywords: ["bag", "backpack"], description: "Carryalls" },
          { label: "Accessories", categories: ["Accessories", "Fashion"], keywords: ["belt", "cap"], description: "Finish looks" },
        ],
      },
    ],
  },
  {
    label: "Computing",
    icon: "computer",
    sections: [
      {
        title: "Computing",
        seeAll: "Computers & Electronics",
        tiles: [
          { label: "Laptops", categories: ["Computers & Electronics", "Laptop"], keywords: ["laptop"], description: "Portable computers" },
          { label: "Desktops", categories: ["Computers & Electronics"], keywords: ["desktop", "pc"], description: "Workstations" },
          { label: "Monitors", categories: ["Computers & Electronics"], keywords: ["monitor", "display"], description: "Bigger screens" },
          { label: "Printers", categories: ["Office & Stationery", "Computers & Electronics"], keywords: ["printer"], description: "Print and scan" },
          { label: "Storage", categories: ["Computers & Electronics"], keywords: ["ssd", "drive"], description: "More space" },
          { label: "Networking", categories: ["Computers & Electronics"], keywords: ["router", "wifi"], description: "Stay connected" },
        ],
      },
    ],
  },
  {
    label: "Sporting Goods",
    icon: "sports",
    sections: [
      {
        title: "Sporting Goods",
        seeAll: "Sports & Outdoors",
        tiles: [
          { label: "Fitness", categories: ["Sports & Outdoors"], keywords: ["fitness", "gym"], description: "Workout tools" },
          { label: "Football", categories: ["Sports & Outdoors"], keywords: ["football", "ball"], description: "Pitch essentials" },
          { label: "Cycling", categories: ["Sports & Outdoors"], keywords: ["cycle", "bike"], description: "Ride gear" },
          { label: "Camping", categories: ["Sports & Outdoors"], keywords: ["camp", "tent"], description: "Outdoor fun" },
          { label: "Running", categories: ["Sports & Outdoors"], keywords: ["run", "running"], description: "Activewear" },
          { label: "Outdoor Gear", categories: ["Sports & Outdoors"], keywords: ["outdoor", "travel"], description: "Adventure kit" },
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
          { label: "Plants", categories: ["Home & Living"], keywords: ["plant", "garden"], description: "Green spaces" },
          { label: "Tools", categories: ["Construction & Tools"], keywords: ["tool", "spade"], description: "Hands-on work" },
          { label: "Outdoor Furniture", categories: ["Home & Living"], keywords: ["outdoor", "chair"], description: "Patio comfort" },
          { label: "Storage", categories: ["Home & Living"], keywords: ["storage"], description: "Organize outside" },
          { label: "Lighting", categories: ["Home & Living"], keywords: ["light", "lamp"], description: "Outdoor glow" },
          { label: "Grilling", categories: ["Home & Living", "Appliances"], keywords: ["grill", "bbq"], description: "Cook outdoors" },
        ],
      },
    ],
  },
];

const iconMap = {
  all: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  food: "M6 6h12l-1 10H7L6 6Zm2-2h8M9 4v4m6-4v4",
  fresh: "M12 4c4 0 7 3 7 7s-3 9-7 9-7-5-7-9 3-7 7-7Zm0 3v10M8 8c1 2 2.5 3 4 3",
  beverage: "M9 3h6v3l-1 2v11H10V8L9 6V3Zm3 8h1",
  house: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  personal: "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
  baby: "M8 10a4 4 0 0 1 8 0v2h1.5A2.5 2.5 0 0 1 20 14.5V19H4v-4.5A2.5 2.5 0 0 1 6.5 12H8v-2Z",
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  phone: "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  computer: "M5 7h14v9H5V7Zm-2 12h18M9 19l1-3m4 3-1-3M8 4h8",
  health: "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
  fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
  sports: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  leaf: "M5 18c6 1 11-4 14-12-8 0-14 5-14 12Zm3-2c1-2 4-4 8-5",
};

const iconFor = (name) => iconMap[name] || iconMap.home;

const SidebarIcon = ({ name }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={iconFor(name)} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CardIcon = ({ name, className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={iconFor(name)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getCategoryHref = (category) => `/all-products?category=${encodeURIComponent(category)}`;

const getTileProduct = (products, tile) => findProduct(products, tile.categories, tile.keywords);

const ProductCard = ({ tile, product, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-[16rem] flex-col rounded-[1.5rem] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
  >
    <span className="flex items-center justify-end">
      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
        See all
      </span>
    </span>
    <span className="mt-2 flex flex-1 items-center justify-center">
      {product ? (
        <Image src={getProductImage(product)} alt={tile.label} width={180} height={180} className="max-h-28 w-auto object-contain transition group-hover:scale-105" />
      ) : (
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <CardIcon name="home" className="h-7 w-7" />
        </span>
      )}
    </span>
    <span className="mt-3 text-center text-base font-semibold text-gray-950">{tile.label}</span>
    <span className="mt-1 text-center text-[11px] leading-4 text-gray-500">{tile.description || "Browse more"}</span>
  </button>
);

const CategoryBrowserPage = ({ initialProducts = [] }) => {
  const { products, setIsRouteLoading, navigate } = useAppContext();
  const storefrontProducts = products.length ? products : initialProducts;
  const [selectedDepartment, setSelectedDepartment] = useState("Supermarket");

  const selectedDepartmentData = useMemo(
    () => sidebarDepartments.find((department) => department.label === selectedDepartment) || sidebarDepartments[0],
    [selectedDepartment]
  );

  const desktopSidebar = useMemo(() => sidebarDepartments.map((department) => ({
    ...department,
    count: department.sections.reduce((sum, section) => sum + section.tiles.reduce((tileSum, tile) => tileSum + (findProduct(storefrontProducts, tile.categories, tile.keywords) ? 1 : 0), 0), 0),
  })), [storefrontProducts]);

  const goToCategory = (category) => {
    setIsRouteLoading(true);
    navigate(getCategoryHref(category));
  };

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto grid max-w-[1600px] gap-0 px-0 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-gray-100 bg-white lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            {desktopSidebar.map((department, index) => {
              const active = department.label === selectedDepartment;
              const iconName = ["home", "phone", "home", "computer", "health", "fashion", "fashion", "computer", "sports", "leaf"][index] || "home";

              return (
                <button
                  key={department.label}
                  type="button"
                  onClick={() => setSelectedDepartment(department.label)}
                  className={`flex w-full items-center gap-4 border-b border-gray-100 px-5 py-6 text-left transition ${
                    active ? "bg-white shadow-[inset_3px_0_0_0_#ff7a00]" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"}`}>
                    <SidebarIcon name={iconName} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-gray-900">{department.label}</span>
                    <span className="block text-[11px] text-gray-500">{department.count ? `${formatCount(department.count)} products` : "Browse categories"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 bg-[#fafafa]">
          <div className="border-b border-gray-100 bg-white px-3 py-3 shadow-sm sm:px-4 lg:hidden">
            <div className="flex items-center gap-3 rounded-[1.75rem] border border-gray-100 bg-[#fafafa] px-4 py-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search for products, brands..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              <button type="button" className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                <span className="inline-flex h-4 w-4 items-center justify-center">⌕</span>
              </button>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {sidebarDepartments.map((department, index) => {
                const active = department.label === selectedDepartment;
                const iconName = ["home", "phone", "home", "computer", "health", "fashion", "fashion", "computer", "sports", "leaf"][index] || "home";

                return (
                  <button
                    key={department.label}
                    type="button"
                    onClick={() => setSelectedDepartment(department.label)}
                    className={`flex min-h-[5rem] min-w-[6.9rem] flex-col items-center justify-center gap-2 rounded-[1.3rem] border px-3 text-center shadow-sm transition ${
                      active ? "border-orange-500 bg-white text-orange-700" : "border-gray-100 bg-white text-gray-700"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"}`}>
                      <CardIcon name={iconName} className="h-5 w-5" />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-semibold leading-4">{department.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 p-3 sm:p-4 lg:hidden">
            <div className="rounded-[1.5rem] border border-gray-100 bg-white px-4 py-4 shadow-sm">
              <h1 className="text-2xl font-black tracking-tight text-gray-950">{selectedDepartmentData.label}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse the department and tap any category to continue.
              </p>
            </div>

            {selectedDepartmentData.sections.map((section) => (
              <section key={section.title} className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                  <p className="text-[13px] font-black uppercase tracking-wide text-gray-900">{section.title}</p>
                  <button type="button" onClick={() => goToCategory(section.seeAll)} className="text-sm font-semibold text-orange-600">
                    See All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 min-[430px]:grid-cols-3">
                  {section.tiles.map((tile) => {
                    const product = getTileProduct(storefrontProducts, tile);
                    return (
                      <button
                        key={`${section.title}-${tile.label}`}
                        type="button"
                        onClick={() => goToCategory(section.seeAll)}
                        className="rounded-[1.25rem] border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-200"
                      >
                        <span className="flex aspect-[1.12/1] items-center justify-center">
                          {product ? (
                            <Image src={getProductImage(product)} alt={tile.label} width={130} height={120} className="h-full w-full object-contain p-1" />
                          ) : (
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                              <CardIcon name="home" className="h-6 w-6" />
                            </span>
                          )}
                        </span>
                        <span className="mt-2 block text-center text-[12px] font-medium leading-4 text-gray-900">{tile.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="hidden p-5 lg:block xl:p-6">
            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <h1 className="text-4xl font-black tracking-tight text-gray-950">{selectedDepartmentData.label}</h1>
              <div className="mt-6 space-y-6">
                {selectedDepartmentData.sections.map((section) => (
                  <div key={section.title} className="rounded-[1.5rem] border border-gray-100 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                      <p className="text-base font-black uppercase tracking-wide text-gray-900">{section.title}</p>
                      <button type="button" onClick={() => goToCategory(section.seeAll)} className="text-sm font-semibold text-orange-600">
                        See All
                      </button>
                    </div>
                    <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
                      {section.tiles.map((tile) => {
                        const product = getTileProduct(storefrontProducts, tile);
                        return (
                          <button
                            key={`${section.title}-${tile.label}`}
                            type="button"
                            onClick={() => goToCategory(section.seeAll)}
                            className="flex min-h-[16rem] flex-col rounded-[1.35rem] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                          >
                            <span className="flex flex-1 items-center justify-center">
                              {product ? (
                                <Image src={getProductImage(product)} alt={tile.label} width={180} height={160} className="max-h-28 w-auto object-contain" />
                              ) : (
                                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                                  <CardIcon name="home" className="h-7 w-7" />
                                </span>
                              )}
                            </span>
                            <span className="mt-3 text-center text-[15px] font-medium text-gray-900">{tile.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CategoryBrowserPage;
