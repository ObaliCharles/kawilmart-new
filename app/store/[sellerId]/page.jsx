'use client'

import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SellerTrustBadge from "@/components/SellerTrustBadge";
import { useAppContext } from "@/context/AppContext";
import { assets } from "@/assets/assets";
import { categoryMatchesSelection, getCategoryMeta } from "@/lib/marketplaceCategories";
import { getProductActivitySnapshot } from "@/lib/liveCommerce";
import { getProductRatingSnapshot } from "@/lib/productRating";
import { getProductStockSnapshot } from "@/lib/productStock";

const priceRanges = [
  { label: "All prices", min: 0, max: Infinity },
  { label: "Under UGX 50,000", min: 0, max: 50000 },
  { label: "UGX 50K - 150K", min: 50000, max: 150000 },
  { label: "UGX 150K - 500K", min: 150000, max: 500000 },
  { label: "UGX 500K - 1M", min: 500000, max: 1000000 },
  { label: "Above UGX 1M", min: 1000000, max: Infinity },
];

const ratingOptions = [
  { label: "Any rating", value: 0 },
  { label: "4.5 & up", value: 4.5 },
  { label: "4.0 & up", value: 4 },
  { label: "3.5 & up", value: 3.5 },
];

const storeTabs = [
  { key: "home", label: "Home" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "reviews", label: "Reviews" },
  { key: "about", label: "About" },
];

const normalizeText = (value = "") => (
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const formatCount = (count) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(count) || 0));

const getImage = (product) => {
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  if (typeof image === "string" && image.trim()) {
    return image.trim();
  }

  if (image && typeof image === "object" && typeof image.src === "string") {
    return image.src;
  }

  return assets.upload_area;
};

const getBrandLabel = (product) => {
  const explicit = product?.brand || product?.manufacturer || product?.sellerProfile?.name;

  if (explicit && String(explicit).trim()) {
    return String(explicit).trim();
  }

  const token = normalizeText(product?.name).split(" ").find((word) => word.length > 2);
  return token ? token[0].toUpperCase() + token.slice(1) : "Other";
};

const getProductSearchScore = (product, query) => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const haystack = normalizeText([
    product?.name,
    product?.category,
    product?.description,
    getBrandLabel(product),
    product?.sellerProfile?.name,
    product?.sellerLocation,
  ].join(" "));

  return haystack.includes(normalizedQuery) ? 1 : 0;
};

const StarRow = ({ rating, reviewCount }) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const filledStars = Math.round(safeRating);

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((star) => (
          <Image
            key={star}
            src={star < filledStars ? assets.star_icon : assets.star_dull_icon}
            alt=""
            className="h-3.5 w-3.5"
          />
        ))}
      </span>
      <span>{safeRating ? safeRating.toFixed(1) : "New"}{reviewCount > 0 ? ` (${reviewCount})` : ""}</span>
    </div>
  );
};

const StoreProductCard = ({ product, layout = "grid" }) => {
  const { addToCart, formatCurrency, navigate, prefetchRoute, toggleProductLike } = useAppContext();
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(Boolean(product.likedByCurrentUser));
  const [isAdding, setIsAdding] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const cartPulseTimerRef = useRef(null);
  const productHref = `/product/${product._id}`;
  const ratingSnapshot = getProductRatingSnapshot(product);
  const stockSnapshot = getProductStockSnapshot(product);
  const activity = getProductActivitySnapshot(product);
  const discountPercent = activity.hasDiscount
    ? activity.priceDropPercent
    : (product.price && product.price > product.offerPrice
      ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
      : null);

  useEffect(() => {
    setLiked(Boolean(product.likedByCurrentUser));
  }, [product.likedByCurrentUser]);

  useEffect(() => () => {
    if (cartPulseTimerRef.current) {
      window.clearTimeout(cartPulseTimerRef.current);
    }
  }, []);

  const handleLikeClick = async (event) => {
    event.stopPropagation();
    if (liking) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLiking(true);
    const result = await toggleProductLike(product._id);
    if (!result?.success) {
      setLiked(!nextLiked);
    } else if (typeof result.product?.likedByCurrentUser === "boolean") {
      setLiked(result.product.likedByCurrentUser);
    }
    setLiking(false);
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation();
    if (isAdding || stockSnapshot.status === "out") return;

    setIsAdding(true);
    const result = await addToCart(product._id);
    if (result?.success) {
      setCartPulse(true);
      if (cartPulseTimerRef.current) {
        window.clearTimeout(cartPulseTimerRef.current);
      }
      cartPulseTimerRef.current = window.setTimeout(() => setCartPulse(false), 900);
    }
    setIsAdding(false);
  };

  return (
    <article
      onClick={() => navigate(productHref)}
      onMouseEnter={() => prefetchRoute(productHref)}
      onFocus={() => prefetchRoute(productHref)}
      className={`group min-w-0 cursor-pointer overflow-hidden rounded-[0.9rem] border border-gray-200 bg-white transition hover:border-orange-300 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)] ${
        layout === "list" ? "flex items-center gap-2.5 p-2" : "flex h-full flex-col p-2"
      }`}
    >
      <div className={`relative flex items-center justify-center overflow-hidden rounded-[0.8rem] bg-white ${layout === "list" ? "h-20 w-20 shrink-0" : "aspect-[1.04/1]"}`}>
        <Image
          src={getImage(product)}
          alt={product.name}
          className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
          width={340}
          height={300}
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, (max-width: 1535px) 22vw, 18vw"
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
        />
        {discountPercent ? (
          <span className="absolute left-0 top-0 rounded-br-md rounded-tl-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
            -{discountPercent}%
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border transition ${
            liked ? "border-red-100 bg-red-50 text-red-600" : "border-gray-200 bg-white hover:border-orange-200"
          } ${liking ? "opacity-60" : ""}`}
          aria-label={liked ? "Unlike product" : "Like product"}
        >
          <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"}>
            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
        </button>
      </div>

      <div className={`${layout === "list" ? "min-w-0 flex-1" : "mt-2.5 min-h-[2.2rem]"}`}>
        <h3 className="line-clamp-2 text-[12.5px] font-semibold leading-[16px] text-gray-950">
          {product.name}
        </h3>
        <div className="mt-1">
          <StarRow rating={ratingSnapshot.rating || product.displayRating || 0} reviewCount={ratingSnapshot.reviewCount || product.reviews?.length || 0} />
          <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-gray-500">
            <span className={`h-2 w-2 rounded-full ${stockSnapshot.status === "out" ? "bg-gray-300" : "bg-emerald-500"}`} />
            <span>{stockSnapshot.label}</span>
          </div>
          {Number(product.soldCount) > 0 ? (
            <p className="mt-0.5 text-[10.5px] text-gray-500">{formatCount(product.soldCount)} sold</p>
          ) : null}
        </div>
      </div>

      <div className={`flex items-end justify-between gap-2.5 ${layout === "list" ? "mt-0 min-w-[6.8rem]" : "mt-2.5"}`}>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-orange-600">{formatCurrency(product.offerPrice)}</p>
          {product.price > product.offerPrice ? (
            <p className="text-[9.5px] text-gray-400 line-through">{formatCurrency(product.price)}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || stockSnapshot.status === "out"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition ${
            stockSnapshot.status === "out"
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : cartPulse
                ? "border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-200"
                : "border-orange-300 bg-white text-orange-600 hover:bg-orange-50"
          } ${cartPulse ? "animate-pulse" : ""}`}
          aria-label="Add to cart"
        >
          {cartPulse ? (
            <svg className="h-4.5 w-4.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          ) : (
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M3 4h2.4l2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 1.9-1.5L20 8H6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              <path d="M10 20h.01M17 20h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
};

const StoreSidebar = ({
  title,
  children,
  onClear,
}) => (
  <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm">
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <p className="text-[12.5px] font-semibold text-gray-950">{title}</p>
      {onClear ? (
        <button type="button" onClick={onClear} className="text-[11px] font-semibold text-gray-500 hover:text-orange-600">
          Clear all
        </button>
      ) : null}
    </div>
    {children}
  </div>
);

const StorePage = () => {
  const { sellerId } = useParams();
  const { products, loadingProducts, navigate, userData, fetchUserData, fetchProductData, getToken } = useAppContext();
  const [coverOverride, setCoverOverride] = useState("");
  const [avatarOverride, setAvatarOverride] = useState("");
  const [uploadingStoreImage, setUploadingStoreImage] = useState("");
  const [selectedTab, setSelectedTab] = useState("products");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const sellerProducts = useMemo(
    () => products.filter((product) => String(product.userId) === String(sellerId)),
    [products, sellerId]
  );
  const leadProduct = sellerProducts[0];
  const seller = leadProduct?.sellerProfile;
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(Number(seller?.followersCount) || 0);
  const categories = useMemo(() => {
    const counts = sellerProducts.reduce((acc, product) => {
      const category = product.category || "Uncategorized";
      acc.set(category, (acc.get(category) || 0) + 1);
      return acc;
    }, new Map());

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([label, count]) => ({ label, value: label, count }));
  }, [sellerProducts]);
  const brands = useMemo(() => {
    const counts = sellerProducts.reduce((acc, product) => {
      const brand = getBrandLabel(product);
      acc.set(brand, (acc.get(brand) || 0) + 1);
      return acc;
    }, new Map());

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([label, count]) => ({ label, value: label, count }));
  }, [sellerProducts]);
  const topProducts = useMemo(() => {
    const items = sellerProducts.map((product) => ({
      product,
      rating: getProductRatingSnapshot(product).rating,
      searchHit: getProductSearchScore(product, deferredSearchQuery),
    }));

    const range = priceRanges[selectedPriceRange];
    const filtered = items.filter(({ product, searchHit }) => {
      if (deferredSearchQuery.trim() && !searchHit) return false;
      if (selectedCategory !== "All" && !categoryMatchesSelection(product.category, selectedCategory)) return false;
      if (selectedBrand !== "all" && getBrandLabel(product) !== selectedBrand) return false;
      if (selectedRating > 0 && getProductRatingSnapshot(product).rating < selectedRating) return false;
      if (!(product.offerPrice >= range.min && product.offerPrice <= range.max)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.product.offerPrice - b.product.offerPrice;
      if (sortBy === "price_desc") return b.product.offerPrice - a.product.offerPrice;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest") return (Number(b.product.date) || 0) - (Number(a.product.date) || 0);
      if (sortBy === "popular") return (Number(b.product.soldCount) || 0) - (Number(a.product.soldCount) || 0);
      return b.searchHit - a.searchHit;
    });

    return sorted.map(({ product }) => product);
  }, [sellerProducts, deferredSearchQuery, selectedCategory, selectedBrand, selectedPriceRange, selectedRating, sortBy]);
  const filteredProducts = topProducts;
  const rating = seller?.ratingSummary?.overall || 0;
  const reviews = seller?.ratingSummary?.totalReviews || 0;
  const selectedDealProduct = useMemo(() => {
    const flashDeal = sellerProducts.find((product) => getProductActivitySnapshot(product).flashDealActive);
    if (flashDeal) return flashDeal;

    return [...sellerProducts].sort((a, b) => {
      const aDiscount = a.price > a.offerPrice ? (a.price - a.offerPrice) / a.price : 0;
      const bDiscount = b.price > b.offerPrice ? (b.price - b.offerPrice) / b.price : 0;
      return bDiscount - aDiscount;
    })[0] || null;
  }, [sellerProducts]);
  const storeCategories = categories.slice(0, 6);
  const isStoreOwner = Boolean(userData?._id) && String(userData._id) === String(sellerId);
  const storeCoverImage = coverOverride || seller?.coverImage || "";
  const storeAvatarImage = avatarOverride || seller?.avatarUrl || "";
  const heroImage = storeCoverImage || (selectedDealProduct ? getImage(selectedDealProduct) : assets.header_macbook_image.src);

  const uploadStoreImage = async (kind, file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploadingStoreImage(kind);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const formData = new FormData();
      formData.append(kind === 'cover' ? 'cover' : 'avatar', file);
      const { data } = await axios.post('/api/seller/store-images', formData, { headers });
      if (data.success) {
        toast.success('Store image updated');
        if (kind === 'cover' && data.storeCoverImage) setCoverOverride(data.storeCoverImage);
        if (kind === 'avatar' && data.storeAvatar) setAvatarOverride(data.storeAvatar);
        void fetchProductData({ background: true });
      } else {
        toast.error(data.message || 'Could not update image');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update image');
    } finally {
      setUploadingStoreImage("");
    }
  };
  const heroTags = categories.slice(0, 3).map((category) => getCategoryMeta(category.label).label);
  const otherStores = useMemo(() => {
    const storeMap = new Map();

    products.forEach((product) => {
      const id = String(product.userId || product.sellerProfile?.id || "");
      if (!id || id === String(sellerId) || storeMap.has(id)) {
        return;
      }

      storeMap.set(id, {
        id,
        name: product.sellerProfile?.name || "Store",
        avatarUrl: product.sellerProfile?.avatarUrl || "",
        count: 0,
      });
    });

    products.forEach((product) => {
      const id = String(product.userId || product.sellerProfile?.id || "");
      if (storeMap.has(id)) {
        storeMap.get(id).count += 1;
      }
    });

    return [...storeMap.values()]
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 8);
  }, [products, sellerId, sellerProducts]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sellerId]);

  useEffect(() => {
    setFollowersCount(Number(seller?.followersCount) || 0);
  }, [seller?.followersCount]);

  useEffect(() => {
    setFollowing(Boolean(userData?.followedStores?.includes(String(sellerId))));
  }, [sellerId, userData?.followedStores]);

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedBrand("all");
    setSelectedPriceRange(0);
    setSelectedRating(0);
    setSearchQuery("");
    setSortBy("popular");
  };

  const toggleStoreFollow = async () => {
    if (followLoading) {
      return;
    }

    setFollowLoading(true);
    try {
      const response = await fetch("/api/store/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      const data = await response.json();

      if (!data?.success) {
        throw new Error(data?.message || "Unable to update follow status");
      }

      setFollowing(Boolean(data.isFollowing));
      if (Number.isFinite(Number(data.followersCount))) {
        setFollowersCount(Number(data.followersCount));
      }

      if (typeof fetchUserData === "function") {
        void fetchUserData();
      }
    } catch (error) {
      toast.error(error?.message || "Unable to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const FilterContent = () => (
    <div className="space-y-3.5">
      <div>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`flex w-full items-center justify-between rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
              selectedCategory === "All" ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>All Products</span>
            <span className="text-[10px] opacity-70">{formatCount(sellerProducts.length)}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
              className={`flex w-full items-center justify-between rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
                selectedCategory === category.value ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{getCategoryMeta(category.value).label}</span>
              <span className="text-[10px] opacity-70">{formatCount(category.count)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-[12.5px] font-semibold text-gray-950">Price Range</p>
        <div className="space-y-0.5">
          {priceRanges.map((range, index) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setSelectedPriceRange(index)}
              className={`w-full rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
                selectedPriceRange === index ? "bg-orange-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-[12.5px] font-semibold text-gray-950">Brands</p>
        <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSelectedBrand("all")}
            className={`flex w-full items-center justify-between rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
              selectedBrand === "all" ? "bg-orange-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>All brands</span>
            <span className="text-[10px] opacity-70">{formatCount(brands.length)}</span>
          </button>
          {brands.map((brand) => (
            <button
              key={brand.value}
              type="button"
              onClick={() => setSelectedBrand(brand.value)}
              className={`flex w-full items-center justify-between rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
                selectedBrand === brand.value ? "bg-orange-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{brand.label}</span>
              <span className="text-[10px] opacity-70">{brand.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 border-t border-gray-200 pt-3 text-[12.5px] font-semibold text-gray-950">Rating</p>
        <div className="space-y-0.5">
          {ratingOptions.map((ratingOption) => (
            <button
              key={ratingOption.value}
              type="button"
              onClick={() => setSelectedRating(ratingOption.value)}
              className={`w-full rounded-full px-2.5 py-1.5 text-left text-[11px] transition ${
                selectedRating === ratingOption.value ? "bg-orange-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {ratingOption.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const DealCard = () => {
    const { formatCurrency } = useAppContext();
    const activity = selectedDealProduct ? getProductActivitySnapshot(selectedDealProduct) : null;
    const dealImage = selectedDealProduct ? getImage(selectedDealProduct) : assets.jbl_soundbox_image.src;
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      const timer = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(timer);
    }, []);

    const hasDeadline = activity?.hasFlashDealDeadline && activity.flashDealEndsAt > 0;
    const isExpired = hasDeadline && activity.flashDealEndsAt <= now;
    const timeLeftMs = hasDeadline ? Math.max(0, activity.flashDealEndsAt - now) : 0;
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, "0");
    const countdown = hasDeadline ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : (activity?.flashDealCountdownLabel || "24h 00m");

    return (
      <div className={`rounded-[0.9rem] border p-3 shadow-sm ${isExpired ? "border-gray-200 bg-gray-50" : "border-red-200 bg-gradient-to-br from-red-50 to-orange-50"}`}>
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[12.5px] font-semibold text-gray-950">Deals of the Day</p>
            <p className="text-[10.5px] text-gray-500">Featured products from this store</p>
          </div>
          {isExpired ? (
            <span className="rounded-full border-2 border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
              Ended
            </span>
          ) : hasDeadline ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {countdown}
            </span>
          ) : (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              {countdown}
            </span>
          )}
        </div>
        {selectedDealProduct ? (
          <button
            type="button"
            onClick={() => navigate(`/product/${selectedDealProduct._id}`)}
            className="group w-full overflow-hidden rounded-[0.9rem] border border-gray-200 bg-white text-left transition hover:border-orange-300"
          >
            <div className="relative aspect-[1.05/1] bg-gray-50">
              <Image
                src={dealImage}
                alt={selectedDealProduct.name}
                fill
                className="object-contain p-2.5 transition duration-300 group-hover:scale-105"
                sizes="280px"
              />
              {activity?.priceDropPercent ? (
                <span className="absolute left-2 top-2 rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  -{activity.priceDropPercent}%
                </span>
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 text-[12.5px] font-semibold text-gray-950">{selectedDealProduct.name}</p>
              <p className="mt-1 text-[13px] font-bold text-orange-600">{formatCurrency(selectedDealProduct.offerPrice)}</p>
              {selectedDealProduct.price > selectedDealProduct.offerPrice ? (
                <p className="text-[10px] text-gray-400 line-through">{formatCurrency(selectedDealProduct.price)}</p>
              ) : null}
              <p className="mt-1 text-[10px] text-emerald-600">{getProductStockSnapshot(selectedDealProduct).label}</p>
            </div>
          </button>
        ) : (
          <div className="rounded-[0.9rem] border border-dashed border-gray-200 p-5 text-sm text-gray-500">
            No deal available yet.
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate(`/all-products?seller=${encodeURIComponent(String(sellerId))}`)}
          className="mt-2.5 text-[12px] font-semibold text-orange-600"
        >
          View all deals →
        </button>
      </div>
    );
  };

  const TopCategoriesRail = () => (
    <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12.5px] font-semibold text-gray-950">Top Categories</p>
        <button type="button" onClick={() => setSelectedTab("categories")} className="text-[11px] font-semibold text-orange-600">
          View all
        </button>
      </div>
      <div className="space-y-1.5">
        {storeCategories.slice(0, 5).map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => {
              setSelectedCategory(category.value);
              setSelectedTab("products");
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[11.5px] transition hover:bg-gray-50"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700">
                <span className="text-[10px]">⌂</span>
              </span>
              <span className="min-w-0 truncate text-gray-700">{getCategoryMeta(category.value).label}</span>
            </span>
            <span className="text-[10px] text-gray-400">{category.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const WhyShopCard = () => (
    <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-[12.5px] font-semibold text-gray-950">Why shop from this store?</p>
      <div className="mt-3 space-y-2 text-[11.5px] text-gray-600">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
          <span>{seller?.isVerified ? "Verified seller profile" : "Trusted marketplace seller"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">★</span>
          <span>{rating ? `${rating.toFixed(1)} rating from ${reviews} reviews` : "New store on KawilMart"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">⤴</span>
          <span>{formatCount(followersCount)} followers</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(`/all-products?seller=${encodeURIComponent(String(sellerId))}`)}
        className="mt-2.5 text-[12px] font-semibold text-orange-600"
      >
        Learn more →
      </button>
    </div>
  );

  const StoreAboutCard = () => (
    <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700">
          {seller?.avatarUrl ? (
            <Image src={seller.avatarUrl} alt={seller?.name || "Store"} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <span>{(seller?.name || "S").slice(0, 1)}</span>
          )}
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-gray-950">{seller?.name || "KawilMart Store"}</p>
          <p className="text-xs text-gray-500">{seller?.location || leadProduct?.sellerLocation || "Location pending"}</p>
          <SellerTrustBadge sellerProfile={seller} className="mt-1.5" />
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] leading-5 text-gray-600">
        {seller?.description || "Browse this seller's active marketplace listings, categories, and store details."}
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(`/all-products?seller=${encodeURIComponent(String(sellerId))}`)} className="rounded-full border border-orange-200 px-2.5 py-1 text-[11.5px] font-semibold text-orange-600">
          View offers
        </button>
        <button type="button" onClick={() => navigate(`/inbox?tab=chats&peer=${encodeURIComponent(String(sellerId))}`)} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-700">
          Chat with store
        </button>
      </div>
    </div>
  );

  if (loadingProducts && !leadProduct) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white px-4 py-4 sm:px-6 md:px-10 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-gray-100" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!leadProduct) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white px-4 py-4 sm:px-6 md:px-10 lg:px-12">
          <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <h1 className="text-2xl font-bold text-gray-950">Store not found</h1>
            <p className="mt-2 text-sm text-gray-500">This seller has no active public products right now.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white px-4 py-3 pb-16 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-2 text-[10.5px] text-gray-500">
            <span>Home <span className="mx-2 text-gray-400">&gt;</span> Stores <span className="mx-2 text-gray-400">&gt;</span> <span className="font-semibold text-gray-950">{seller?.name || "Store"}</span> <span className="mx-2 text-gray-400">&gt;</span> Products</span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)_244px]">
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <StoreSidebar title="Filters" onClear={clearAllFilters}>
                  <FilterContent />
                </StoreSidebar>
              </div>
            </aside>

            <section className="min-w-0">
              <section className="overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-sm">
                <div className="relative min-h-[220px] overflow-hidden bg-[#101923] px-4 py-4 text-white sm:px-5 lg:px-6">
                  <div className="absolute inset-0 opacity-60">
                    <Image
                      src={heroImage}
                      alt={seller?.name || "Store hero"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 72vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
                  {isStoreOwner ? (
                    <label className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-800 shadow-sm transition hover:bg-white">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Zm8 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {uploadingStoreImage === 'cover' ? 'Uploading...' : 'Change cover'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={Boolean(uploadingStoreImage)} onChange={(e) => uploadStoreImage('cover', e.target.files?.[0])} />
                    </label>
                  ) : null}
                  <div className="relative flex min-h-[176px] flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white">
                        {storeAvatarImage ? (
                          <Image src={storeAvatarImage} alt={seller?.name || "Store avatar"} width={72} height={72} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-gray-900">{(seller?.name || "S").slice(0, 1)}</span>
                        )}
                        {isStoreOwner ? (
                          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 text-white opacity-0 transition hover:opacity-100" title="Change profile image">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Zm8 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={Boolean(uploadingStoreImage)} onChange={(e) => uploadStoreImage('avatar', e.target.files?.[0])} />
                          </label>
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h1 className="text-[1.05rem] font-extrabold leading-tight sm:text-[1.3rem]">{seller?.name || "KawilMart Store"}</h1>
                          <SellerTrustBadge sellerProfile={seller} />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/90">
                          <span className="text-amber-400">★</span>
                          <span className="font-semibold">{rating ? rating.toFixed(1) : "0.0"}</span>
                          <span className="text-white/65">({formatCount(reviews)} reviews)</span>
                        </div>
                        <p className="mt-1 text-[10.5px] text-white/75">
                          {heroTags.length ? heroTags.join(" · ") : (seller?.location || "Local marketplace seller")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/inbox?tab=chats&peer=${encodeURIComponent(String(sellerId))}`)}
                        className="rounded-md border border-white/25 bg-black/20 px-3 py-1 text-[11.5px] font-semibold text-white backdrop-blur hover:bg-white/10"
                      >
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleStoreFollow()}
                        disabled={followLoading}
                        className="rounded-md bg-orange-600 px-3 py-1 text-[11.5px] font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {followLoading ? "Saving..." : (following ? "Following" : "Follow")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-200 bg-white px-4 py-2 sm:px-5">
                  {storeTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedTab(tab.key)}
                      className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
                        selectedTab === tab.key ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-3.5 flex items-center gap-2 lg:hidden">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-gray-500">⌕</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search in store"
                    className="min-w-0 flex-1 text-[12px] outline-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm"
                >
                  ⌄
                </button>
              </div>

              <div className="mt-3.5 hidden items-center gap-2.5 lg:flex">
                <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-gray-500">⌕</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search in store"
                    className="min-w-0 flex-1 text-[12px] outline-none placeholder:text-gray-400"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11.5px] outline-none"
                >
                  <option value="popular">Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                </select>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white p-0.5 shadow-sm">
                  {["grid", "list"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11.5px] font-semibold transition ${
                        viewMode === mode ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-[10px]">{mode === "grid" ? "▦" : "☰"}</span>
                      {mode === "grid" ? "Grid" : "List"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 rounded-[0.9rem] border border-gray-200 bg-gray-50 px-2 py-2 sm:px-3">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[0.75rem] bg-white px-2 py-2 shadow-sm">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Products</p>
                    <p className="mt-0.5 text-[0.95rem] font-extrabold leading-none text-gray-950">{formatCount(filteredProducts.length)}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500">Showing now</p>
                  </div>
                  <div className="rounded-[0.75rem] bg-white px-2 py-2 shadow-sm">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Rating</p>
                    <p className="mt-0.5 text-[0.95rem] font-extrabold leading-none text-gray-950">{rating ? rating.toFixed(1) : "New"}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500">{formatCount(reviews)} reviews</p>
                  </div>
                  <div className="rounded-[0.75rem] bg-white px-2 py-2 shadow-sm">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Categories</p>
                    <p className="mt-0.5 text-[0.95rem] font-extrabold leading-none text-gray-950">{formatCount(categories.length)}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500">Unique categories</p>
                  </div>
                  <div className="rounded-[0.75rem] bg-white px-2 py-2 shadow-sm">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Followers</p>
                    <p className="mt-0.5 text-[0.95rem] font-extrabold leading-none text-gray-950">{formatCount(followersCount)}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500">Store followers</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...new Set(categories.map((category) => category.label))].slice(0, 6).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedTab("products");
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      selectedCategory === category ? "border-orange-600 bg-orange-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                    }`}
                  >
                    {getCategoryMeta(category).label}
                  </button>
                ))}
              </div>

              {selectedTab === "home" ? (
                <section className="mt-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">Store Overview</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-gray-900">Curated storefront</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Products, categories, and details.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">Support</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-gray-900">{seller?.supportEmail || seller?.email || "Via KawilMart"}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Contact after checkout or inbox.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">Location</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-gray-900">{seller?.location || "Location pending"}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Location and delivery details.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">Trust</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-gray-900">{seller?.isVerified ? "Verified" : "Marketplace seller"}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Badge and protection notes.</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[0.95rem] font-extrabold text-gray-950">Featured products</h2>
                      <button type="button" onClick={() => setSelectedTab("products")} className="text-[11.5px] font-semibold text-orange-600">
                        View all →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 min-[340px]:grid-cols-2 xl:grid-cols-4">
                      {sellerProducts.slice(0, 4).map((product, index) => (
                        <StoreProductCard key={`featured-${index}-${product._id || product.name}`} product={product} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : selectedTab === "categories" ? (
                <section className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[0.95rem] font-extrabold text-gray-950">Store Categories</h2>
                    <p className="text-[11px] text-gray-500">{formatCount(categories.length)} categories</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.value);
                          setSelectedTab("products");
                        }}
                        className="rounded-[0.9rem] border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
                      >
                        <p className="text-[11.5px] font-semibold text-gray-950">{getCategoryMeta(category.value).label}</p>
                        <p className="mt-1 text-[10px] text-gray-500">{formatCount(category.count)} products</p>
                      </button>
                    ))}
                  </div>
                </section>
              ) : selectedTab === "reviews" ? (
                <section className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm md:col-span-1">
                      <p className="text-[11.5px] font-semibold text-gray-950">Store rating</p>
                      <p className="mt-1 text-[1.5rem] font-black text-gray-950">{rating ? rating.toFixed(1) : "New"}</p>
                      <p className="mt-1 text-[11px] text-gray-500">{formatCount(reviews)} reviews</p>
                    </div>
                    <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm md:col-span-2">
                      <p className="text-[11.5px] font-semibold text-gray-950">Customer trust</p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        <div className="rounded-[0.75rem] bg-gray-50 px-2 py-2">
                          <p className="text-[9px] text-gray-400">Verified</p>
                          <p className="mt-0.5 text-[11px] font-bold text-gray-950">{seller?.isVerified ? "Yes" : "No"}</p>
                        </div>
                        <div className="rounded-[0.75rem] bg-gray-50 px-2 py-2">
                          <p className="text-[9px] text-gray-400">Followers</p>
                          <p className="mt-0.5 text-[11px] font-bold text-gray-950">{formatCount(followersCount)}</p>
                        </div>
                        <div className="rounded-[0.75rem] bg-gray-50 px-2 py-2">
                          <p className="text-[9px] text-gray-400">Products</p>
                          <p className="mt-0.5 text-[11px] font-bold text-gray-950">{formatCount(sellerProducts.length)}</p>
                        </div>
                        <div className="rounded-[0.75rem] bg-gray-50 px-2 py-2">
                          <p className="text-[9px] text-gray-400">Rating</p>
                          <p className="mt-0.5 text-[11px] font-bold text-gray-950">{rating ? rating.toFixed(1) : "New"}</p>
                        </div>
                    </div>
                  </div>
                  </div>
                </section>
              ) : selectedTab === "about" ? (
                <section className="mt-4 space-y-4">
                  <StoreAboutCard />
                </section>
              ) : (
                <section className="mt-4 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                    <h2 className="text-[0.95rem] font-extrabold text-gray-950">All Products ({formatCount(filteredProducts.length)})</h2>
                      <p className="mt-1 text-[11px] text-gray-500">Showing {formatCount(filteredProducts.length)} of {formatCount(sellerProducts.length)} products</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-[11.5px] font-medium text-gray-700">Sort by:</label>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11.5px] outline-none"
                      >
                        <option value="popular">Popular</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="newest">Newest</option>
                        <option value="rating">Top Rated</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2.5 rounded-[0.9rem] border border-gray-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[0.85rem] border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Original</p>
                      <p className="mt-1 text-[11px] text-gray-500">Genuine products</p>
                    </div>
                    <div className="rounded-[0.85rem] border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Fast Delivery</p>
                      <p className="mt-1 text-[11px] text-gray-500">Get it in 24 - 48hrs</p>
                    </div>
                    <div className="rounded-[0.85rem] border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Easy Returns</p>
                      <p className="mt-1 text-[11px] text-gray-500">Return policy applies</p>
                    </div>
                    <div className="rounded-[0.85rem] border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Secure Payment</p>
                      <p className="mt-1 text-[11px] text-gray-500">Pay safely</p>
                    </div>
                  </div>

                  <div className={viewMode === "list" ? "space-y-2.5 pb-5" : "grid grid-cols-1 gap-2.5 pb-5 min-[340px]:grid-cols-2 xl:grid-cols-4"}>
                    {filteredProducts.map((product, index) => (
                      <StoreProductCard key={`store-${viewMode}-${index}-${product._id || product.name}`} product={product} layout={viewMode} />
                    ))}
                  </div>
                </section>
              )}
            </section>

            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <DealCard />
                <TopCategoriesRail />
                <WhyShopCard />
                <div className="rounded-[0.9rem] border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-gray-950">Stores list</p>
                    <button type="button" onClick={() => navigate("/all-products")} className="text-[11px] font-semibold text-orange-600">
                      Browse
                    </button>
                  </div>
                  <div className="space-y-2">
                    {otherStores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => navigate(`/store/${store.id}`)}
                        className="flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-left transition hover:border-orange-200 hover:bg-orange-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-xs font-semibold text-gray-700">
                          {store.avatarUrl ? (
                            <Image src={store.avatarUrl} alt={store.name} width={40} height={40} className="h-full w-full object-cover" />
                          ) : (
                            <span>{store.name.slice(0, 1)}</span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-semibold text-gray-950">{store.name}</span>
                          <span className="block text-[9.5px] text-gray-500">{formatCount(store.count)} products</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {showMobileFilters ? (
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute bottom-0 right-0 top-0 w-full max-w-[18.5rem] overflow-y-auto bg-white p-4" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[15px] font-bold text-gray-950">Filters</p>
                <button type="button" onClick={() => setShowMobileFilters(false)} className="text-xl text-gray-400">×</button>
              </div>
              <StoreSidebar title="Filters" onClear={clearAllFilters}>
                <FilterContent />
              </StoreSidebar>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </>
  );
};

export default StorePage;
