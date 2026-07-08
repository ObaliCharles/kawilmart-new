'use client'

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { defaultSiteContent, resolveSiteContent } from '@/lib/defaultSiteContent';
import { homeCategoryValues, getCategoryMeta } from '@/lib/marketplaceCategories';
import { PromotionsPageSkeleton } from '@/components/dashboard/DashboardSkeletons';

const emptyHeroForm = {
    title: '',
    offer: '',
    primaryButtonText: 'Shop Now',
    secondaryButtonText: 'Explore Deals',
    linkType: 'category',
    category: '',
    storeId: '',
    productId: '',
    primaryHref: '',
    secondaryHref: '/all-products?filter=flash',
    imageUrl: '',
    imageFile: null,
};

const emptyFeaturedForm = {
    title: '',
    description: '',
    buttonText: 'Buy now',
    linkType: 'category',
    category: '',
    storeId: '',
    productId: '',
    href: '',
    imageUrl: '',
    imageFile: null,
};

const emptyPromoForm = {
    title: '',
    description: '',
    buttonText: 'Get offer',
    linkType: 'category',
    category: '',
    storeId: '',
    productId: '',
    href: '/all-products?filter=flash',
    imageUrl: '',
    imageFile: null,
};

const emptyCategoryBannerForm = {
    title: '',
    description: '',
    buttonText: 'Shop now',
    placementCategory: '',
    linkType: 'category',
    category: '',
    storeId: '',
    productId: '',
    href: '',
    imageUrl: '',
    imageFile: null,
};

const emptyBrandShowcaseForm = {
    title: '',
    brand: '',
    description: '',
    placementCategory: '',
    imageUrl: '',
    imageFile: null,
};

const linkTypeOptions = [
    { value: 'category', label: 'Category' },
    { value: 'store', label: 'Store' },
    { value: 'product', label: 'Product' },
    { value: 'custom', label: 'Custom URL' },
];

const getTargetHref = (form, hrefKey = 'href') => {
    if (form.linkType === 'category' && form.category) {
        return `/all-products?category=${encodeURIComponent(form.category)}`;
    }

    if (form.linkType === 'store' && form.storeId) {
        return `/store/${encodeURIComponent(form.storeId)}`;
    }

    if (form.linkType === 'product') {
        return '';
    }

    return form[hrefKey] || '';
};

const inferLinkType = (item, hrefKey = 'href') => {
    if (item.linkType) return item.linkType;
    if (item.productId) return 'product';
    const href = item[hrefKey] || '';
    if (href.startsWith('/store/')) return 'store';
    if (href.includes('category=')) return 'category';
    return 'custom';
};

const decodeCategoryFromHref = (href = '') => {
    try {
        const search = href.includes('?') ? href.slice(href.indexOf('?')) : '';
        return new URLSearchParams(search).get('category') || '';
    } catch {
        return '';
    }
};

const decodeStoreFromHref = (href = '') => {
    if (!href.startsWith('/store/')) return '';
    return decodeURIComponent(href.replace('/store/', '').split('?')[0] || '');
};

const TargetSelector = ({ label = 'Click target', form, setForm, hrefKey = 'href', products, stores }) => {
    const linkType = form.linkType || 'custom';

    const setLinkType = (nextType) => {
        setForm((prev) => ({
            ...prev,
            linkType: nextType,
            productId: nextType === 'product' ? prev.productId : '',
            category: nextType === 'category' ? prev.category : '',
            storeId: nextType === 'store' ? prev.storeId : '',
            [hrefKey]: nextType === 'custom' ? prev[hrefKey] : getTargetHref({ ...prev, linkType: nextType }, hrefKey),
        }));
    };

    return (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
                <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                >
                    {linkTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {linkType === 'category' ? (
                <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                        productId: '',
                        storeId: '',
                        [hrefKey]: e.target.value ? `/all-products?category=${encodeURIComponent(e.target.value)}` : '',
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                >
                    <option value="">Select a category</option>
                    {homeCategoryValues.map((category) => (
                        <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                    ))}
                </select>
            ) : null}

            {linkType === 'store' ? (
                <select
                    value={form.storeId}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        storeId: e.target.value,
                        productId: '',
                        category: '',
                        [hrefKey]: e.target.value ? `/store/${encodeURIComponent(e.target.value)}` : '',
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
            ) : null}

            {linkType === 'product' ? (
                <select
                    value={form.productId}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        productId: e.target.value,
                        category: '',
                        storeId: '',
                        [hrefKey]: '',
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                        <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                </select>
            ) : null}

            {linkType === 'custom' ? (
                <input
                    type="text"
                    placeholder="Custom URL"
                    value={form[hrefKey]}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        productId: '',
                        category: '',
                        storeId: '',
                        [hrefKey]: e.target.value,
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                />
            ) : null}
        </div>
    );
};

const toDateTimeLocal = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

export default function AdminPromotions() {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [promotionData, setPromotionData] = useState({
        flashDealEndDate: '',
        promotionType: 'none'
    });
    const [siteContent, setSiteContent] = useState(resolveSiteContent(null));
    const [editingHeroId, setEditingHeroId] = useState(null);
    const [heroForm, setHeroForm] = useState(emptyHeroForm);
    const [editingFeaturedId, setEditingFeaturedId] = useState(null);
    const [featuredForm, setFeaturedForm] = useState(emptyFeaturedForm);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerForm, setBannerForm] = useState({
        ...defaultSiteContent.promoBanner,
        imageFile: null,
    });
    const [editingCategoryBannerId, setEditingCategoryBannerId] = useState(null);
    const [categoryBannerForm, setCategoryBannerForm] = useState({
        ...emptyCategoryBannerForm,
    });
    const [editingBrandShowcaseId, setEditingBrandShowcaseId] = useState(null);
    const [brandShowcaseForm, setBrandShowcaseForm] = useState({
        ...emptyBrandShowcaseForm,
    });
    const [newsletterForm, setNewsletterForm] = useState(defaultSiteContent.newsletter);
    const [savingContent, setSavingContent] = useState(false);
    const featuredCards = Array.isArray(siteContent?.featuredCards) ? siteContent.featuredCards : [];
    const promoBanners = Array.isArray(siteContent?.promoBanners) ? siteContent.promoBanners : [];
    const stores = useMemo(() => {
        const storeMap = new Map();

        products.forEach((product) => {
            const id = product.sellerProfile?.id || product.userId;
            if (!id || storeMap.has(id)) {
                return;
            }

            storeMap.set(id, {
                id,
                name: product.sellerProfile?.name || product.sellerName || `Store ${id.slice(-6)}`,
            });
        });

        return Array.from(storeMap.values()).sort((left, right) => left.name.localeCompare(right.name));
    }, [products]);

    const applySiteContent = (content) => {
        const resolved = resolveSiteContent(content);
        setSiteContent(resolved);
        setBannerForm({
            ...emptyPromoForm,
            imageFile: null,
        });
        setCategoryBannerForm({
            ...emptyCategoryBannerForm,
            imageFile: null,
        });
        setBrandShowcaseForm({
            ...emptyBrandShowcaseForm,
            imageFile: null,
        });
        setNewsletterForm(resolved.newsletter);
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [{ data: productsData }, { data: contentData }] = await Promise.all([
                axios.get('/api/product/list?limit=100', { headers }),
                axios.get('/api/admin/site-content', { headers }),
            ]);

            if (productsData.success) {
                setProducts(productsData.products || []);
            } else {
                toast.error(productsData.message || 'Failed to fetch products');
            }

            if (contentData.success) {
                applySiteContent(contentData.content);
            } else {
                toast.error(contentData.message || 'Failed to fetch homepage content');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to load admin content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) {
            void fetchAdminData();
        }
        // Homepage/admin data should refresh when auth state changes, not on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user]);

    const productName = (productId) => {
        const product = products.find((item) => item._id === productId);
        return product?.name || 'No product linked';
    };

    const storeName = (storeId) => {
        const store = stores.find((item) => item.id === storeId);
        return store?.name || 'No store linked';
    };

    const targetLabel = (item, hrefKey = 'href') => {
        if (item.linkType === 'category' && item.category) {
            return `Category: ${getCategoryMeta(item.category).label}`;
        }

        if (item.linkType === 'store' && item.storeId) {
            return `Store: ${storeName(item.storeId)}`;
        }

        if (item.productId) {
            return `Product: ${productName(item.productId)}`;
        }

        return item[hrefKey] || 'None';
    };

    const updatePromotion = async () => {
        if (!selectedProduct) {
            return;
        }

        try {
            const token = await getToken();
            const { data } = await axios.post('/api/admin/update-promotion',
                {
                    productId: selectedProduct._id,
                    promotionType: promotionData.promotionType,
                    isFlashDeal: promotionData.promotionType === 'flash_deal',
                    flashDealEndDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealEndDate
                        ? new Date(promotionData.flashDealEndDate)
                        : null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success('Promotion updated successfully');
                setProducts((prev) => prev.map((product) =>
                    product._id === selectedProduct._id
                        ? {
                            ...product,
                            promotionType: promotionData.promotionType,
                            isFlashDeal: promotionData.promotionType === 'flash_deal',
                            flashDealEndDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealEndDate
                                ? new Date(promotionData.flashDealEndDate)
                                : null,
                        }
                        : product
                ));
                setSelectedProduct(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update promotion');
        }
    };

    const endFlashDeal = async (productId) => {
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/admin/update-promotion',
                { productId, isFlashDeal: false, flashDealEndDate: null, promotionType: 'none' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Flash deal ended');
                setProducts((prev) => prev.map((product) =>
                    product._id === productId ? { ...product, isFlashDeal: false, flashDealEndDate: null, promotionType: 'none' } : product
                ));
            } else {
                toast.error(data.message || 'Failed to end flash deal');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to end flash deal');
        }
    };

    const postSiteContent = async (action, values, imageFile) => {
        const token = await getToken();
        const formData = new FormData();
        formData.append('action', action);

        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        if (imageFile) {
            formData.append('image', imageFile);
        }

        const { data } = await axios.post('/api/admin/site-content', formData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!data.success) {
            throw new Error(data.message || 'Failed to save content');
        }

        applySiteContent(data.content);
        return data;
    };

    const saveHeroSlide = async () => {
        if (!heroForm.title.trim()) {
            toast.error('Please add a hero title');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('upsertHeroSlide', {
                itemId: editingHeroId || '',
                title: heroForm.title,
                offer: heroForm.offer,
                primaryButtonText: heroForm.primaryButtonText,
                secondaryButtonText: heroForm.secondaryButtonText,
                linkType: heroForm.linkType,
                category: heroForm.category,
                storeId: heroForm.storeId,
                productId: heroForm.productId,
                primaryHref: heroForm.primaryHref,
                secondaryHref: heroForm.secondaryHref,
                imageUrl: heroForm.imageUrl,
            }, heroForm.imageFile);

            toast.success(editingHeroId ? 'Hero slide updated' : 'Hero slide added');
            setEditingHeroId(null);
            setHeroForm(emptyHeroForm);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const deleteHeroSlide = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteHeroSlide', { itemId });
            toast.success('Hero slide deleted');
            if (editingHeroId === itemId) {
                setEditingHeroId(null);
                setHeroForm(emptyHeroForm);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const saveFeaturedCard = async () => {
        if (!featuredForm.title.trim()) {
            toast.error('Please add a featured card title');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('upsertFeaturedCard', {
                itemId: editingFeaturedId || '',
                title: featuredForm.title,
                description: featuredForm.description,
                buttonText: featuredForm.buttonText,
                linkType: featuredForm.linkType,
                category: featuredForm.category,
                storeId: featuredForm.storeId,
                productId: featuredForm.productId,
                href: featuredForm.href,
                imageUrl: featuredForm.imageUrl,
            }, featuredForm.imageFile);

            toast.success(editingFeaturedId ? 'Featured card updated' : 'Featured card added');
            setEditingFeaturedId(null);
            setFeaturedForm(emptyFeaturedForm);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const deleteFeaturedCard = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteFeaturedCard', { itemId });
            toast.success('Featured card deleted');
            if (editingFeaturedId === itemId) {
                setEditingFeaturedId(null);
                setFeaturedForm(emptyFeaturedForm);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const saveBanner = async () => {
        if (!bannerForm.title.trim()) {
            toast.error('Please add a promo offer title');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('upsertPromoBanner', {
                itemId: editingBannerId || '',
                title: bannerForm.title,
                description: bannerForm.description,
                buttonText: bannerForm.buttonText,
                linkType: bannerForm.linkType,
                category: bannerForm.category,
                storeId: bannerForm.storeId,
                productId: bannerForm.productId,
                href: bannerForm.href,
                imageUrl: bannerForm.imageUrl,
            }, bannerForm.imageFile);
            toast.success(editingBannerId ? 'Promo offer updated' : 'Promo offer added');
            setEditingBannerId(null);
            setBannerForm(emptyPromoForm);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const saveCategoryBanner = async () => {
        if (!categoryBannerForm.title.trim()) {
            toast.error('Please add a category banner title');
            return;
        }

        if (!categoryBannerForm.placementCategory) {
            toast.error('Please choose where this banner appears');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('upsertCategoryBanner', {
                itemId: editingCategoryBannerId || '',
                title: categoryBannerForm.title,
                description: categoryBannerForm.description,
                buttonText: categoryBannerForm.buttonText,
                placementCategory: categoryBannerForm.placementCategory,
                linkType: categoryBannerForm.linkType,
                category: categoryBannerForm.category,
                storeId: categoryBannerForm.storeId,
                productId: categoryBannerForm.productId,
                href: categoryBannerForm.href,
                imageUrl: categoryBannerForm.imageUrl,
            }, categoryBannerForm.imageFile);

            toast.success(editingCategoryBannerId ? 'Category banner updated' : 'Category banner added');
            setEditingCategoryBannerId(null);
            setCategoryBannerForm(emptyCategoryBannerForm);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const saveBrandShowcase = async () => {
        if (!brandShowcaseForm.brand.trim()) {
            toast.error('Please add a brand name');
            return;
        }

        if (!brandShowcaseForm.placementCategory) {
            toast.error('Please choose where this brand card appears');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('upsertBrandShowcase', {
                itemId: editingBrandShowcaseId || '',
                title: brandShowcaseForm.title,
                brand: brandShowcaseForm.brand,
                description: brandShowcaseForm.description,
                placementCategory: brandShowcaseForm.placementCategory,
                imageUrl: brandShowcaseForm.imageUrl,
            }, brandShowcaseForm.imageFile);

            toast.success(editingBrandShowcaseId ? 'Brand showcase updated' : 'Brand showcase added');
            setEditingBrandShowcaseId(null);
            setBrandShowcaseForm(emptyBrandShowcaseForm);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const deleteBrandShowcase = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteBrandShowcase', { itemId });
            toast.success('Brand showcase deleted');
            if (editingBrandShowcaseId === itemId) {
                setEditingBrandShowcaseId(null);
                setBrandShowcaseForm(emptyBrandShowcaseForm);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const deleteCategoryBanner = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteCategoryBanner', { itemId });
            toast.success('Category banner deleted');
            if (editingCategoryBannerId === itemId) {
                setEditingCategoryBannerId(null);
                setCategoryBannerForm(emptyCategoryBannerForm);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const deleteBanner = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deletePromoBanner', { itemId });
            toast.success('Promo offer deleted');
            if (editingBannerId === itemId) {
                setEditingBannerId(null);
                setBannerForm(emptyPromoForm);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const saveNewsletter = async () => {
        if (!newsletterForm.title.trim()) {
            toast.error('Please add a newsletter title');
            return;
        }

        try {
            setSavingContent(true);
            await postSiteContent('saveNewsletter', newsletterForm);
            toast.success('Newsletter section updated');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingContent(false);
        }
    };

    const startEditingHero = (slide) => {
        setEditingHeroId(slide._id);
        setHeroForm({
            title: slide.title || '',
            offer: slide.offer || '',
            primaryButtonText: slide.primaryButtonText || 'Shop Now',
            secondaryButtonText: slide.secondaryButtonText || 'Explore Deals',
            linkType: slide.linkType || inferLinkType(slide, 'primaryHref'),
            category: slide.category || decodeCategoryFromHref(slide.primaryHref),
            storeId: slide.storeId || decodeStoreFromHref(slide.primaryHref),
            productId: slide.productId || '',
            primaryHref: slide.primaryHref || '',
            secondaryHref: slide.secondaryHref || '/all-products?filter=flash',
            imageUrl: slide.imageUrl || '',
            imageFile: null,
        });
    };

    const startEditingFeatured = (card) => {
        if (!card?._id) return;
        setEditingFeaturedId(card._id);
        setFeaturedForm({
            title: card.title || '',
            description: card.description || '',
            buttonText: card.buttonText || 'Buy now',
            linkType: card.linkType || inferLinkType(card, 'href'),
            category: card.category || decodeCategoryFromHref(card.href),
            storeId: card.storeId || decodeStoreFromHref(card.href),
            productId: card.productId || '',
            href: card.href || '',
            imageUrl: card.imageUrl || '',
            imageFile: null,
        });
    };

    const startEditingBanner = (banner) => {
        if (!banner?._id) return;
        setEditingBannerId(banner._id);
        setBannerForm({
            title: banner.title || '',
            description: banner.description || '',
            buttonText: banner.buttonText || 'Get offer',
            linkType: banner.linkType || inferLinkType(banner, 'href'),
            category: banner.category || decodeCategoryFromHref(banner.href),
            storeId: banner.storeId || decodeStoreFromHref(banner.href),
            productId: banner.productId || '',
            href: banner.href || '/all-products?filter=flash',
            imageUrl: banner.imageUrl || '',
            imageFile: null,
        });
    };

    const startEditingCategoryBanner = (banner) => {
        setEditingCategoryBannerId(banner._id);
        setCategoryBannerForm({
            title: banner.title || '',
            description: banner.description || '',
            buttonText: banner.buttonText || 'Shop now',
            placementCategory: banner.placementCategory || '',
            linkType: banner.linkType || 'category',
            category: banner.category || '',
            storeId: banner.storeId || '',
            productId: banner.productId || '',
            href: banner.href || '',
            imageUrl: banner.imageUrl || '',
            imageFile: null,
        });
    };

    if (loading) {
        return <PromotionsPageSkeleton />;
    }

    return (
        <div className="w-full md:p-10 p-4 space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Promotions & Homepage Content</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage flash deals and edit the storefront hero, featured cards, banner, and newsletter section.
                </p>
            </div>

            <section className="space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Product Promotions</h2>
                    <p className="text-sm text-gray-500">Choose which products appear as flash deals or featured promotions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={product.image[0]}
                                    alt={product.name}
                                    width={72}
                                    height={72}
                                    className="rounded-xl object-cover h-[72px] w-[72px]"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-gray-900 truncate">{product.name}</h3>
                                    <p className="text-xs text-gray-500">{formatCurrency(product.offerPrice)}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {product.isFlashDeal && (
                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                                Flash Deal
                                            </span>
                                        )}
                                        {product.promotionType === 'featured' && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setPromotionData({
                                            promotionType: product.isFlashDeal ? 'flash_deal' : (product.promotionType || 'none'),
                                            flashDealEndDate: toDateTimeLocal(product.flashDealEndDate),
                                        });
                                    }}
                                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                >
                                    Manage
                                </button>
                                {product.isFlashDeal && (
                                    <button
                                        onClick={() => endFlashDeal(product._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        End Deal
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Hero Slides</h2>
                    <p className="text-sm text-gray-500">Add, edit, or remove the large homepage slides and link them to a product or fallback URL.</p>
                </div>

                <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        {siteContent.heroSlides.map((slide) => (
                            <div key={slide._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                                {slide.imageUrl && (
                                    <Image
                                        src={slide.imageUrl}
                                        alt={slide.title}
                                        width={640}
                                        height={360}
                                        className="rounded-xl object-cover w-full h-44"
                                    />
                                )}
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">{slide.offer}</p>
                                    <h3 className="font-semibold text-gray-900 mt-1">{slide.title}</h3>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Primary link: {slide.productId ? productName(slide.productId) : (slide.primaryHref || 'None')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditingHero(slide)}
                                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => void deleteHeroSlide(slide._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{editingHeroId ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>
                            {editingHeroId && (
                                <button
                                    onClick={() => {
                                        setEditingHeroId(null);
                                        setHeroForm(emptyHeroForm);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Offer badge text"
                            value={heroForm.offer}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, offer: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <textarea
                            placeholder="Hero title"
                            value={heroForm.title}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                        />
                        <div className="grid sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Primary button text"
                                value={heroForm.primaryButtonText}
                                onChange={(e) => setHeroForm((prev) => ({ ...prev, primaryButtonText: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Secondary button text"
                                value={heroForm.secondaryButtonText}
                                onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryButtonText: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <select
                            value={heroForm.productId}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, productId: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            <option value="">Link primary CTA to fallback URL</option>
                            {products.map((product) => (
                                <option key={product._id} value={product._id}>{product.name}</option>
                            ))}
                        </select>
                        <TargetSelector
                            label="Primary CTA target"
                            form={heroForm}
                            setForm={setHeroForm}
                            hrefKey="primaryHref"
                            products={products}
                            stores={stores}
                        />
                        <input
                            type="text"
                            placeholder="Secondary URL"
                            value={heroForm.secondaryHref}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryHref: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="text"
                            placeholder="Image URL or upload a new image below"
                            value={heroForm.imageUrl}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        {heroForm.imageFile && (
                            <p className="text-xs text-gray-500">Selected image: {heroForm.imageFile.name}</p>
                        )}
                        {!heroForm.imageFile && heroForm.imageUrl && (
                            <Image
                                src={heroForm.imageUrl}
                                alt="Hero preview"
                                width={640}
                                height={360}
                                className="rounded-xl object-cover w-full h-40"
                            />
                        )}
                        <button
                            onClick={() => void saveHeroSlide()}
                            disabled={savingContent}
                            className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                        >
                            {savingContent ? 'Saving...' : (editingHeroId ? 'Update Hero Slide' : 'Add Hero Slide')}
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Featured Cards</h2>
                    <p className="text-sm text-gray-500">Control the three featured cards shown beneath popular products.</p>
                </div>

                <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        {featuredCards.map((card, index) => (
                            <div key={card?._id || `featured-card-${index}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                                {card?.imageUrl && (
                                    <Image
                                        src={card.imageUrl}
                                        alt={card?.title || 'Featured card'}
                                        width={640}
                                        height={640}
                                        className="rounded-xl object-cover w-full h-52"
                                    />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{card?.title || 'Featured card'}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{card?.description || ''}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        CTA: {card?.productId ? productName(card.productId) : (card?.href || 'None')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditingFeatured(card)}
                                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => void deleteFeaturedCard(card?._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{editingFeaturedId ? 'Edit Featured Card' : 'Add Featured Card'}</h3>
                            {editingFeaturedId && (
                                <button
                                    onClick={() => {
                                        setEditingFeaturedId(null);
                                        setFeaturedForm(emptyFeaturedForm);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Card title"
                            value={featuredForm.title}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <textarea
                            placeholder="Description"
                            value={featuredForm.description}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                        />
                        <input
                            type="text"
                            placeholder="Button text"
                            value={featuredForm.buttonText}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <select
                            value={featuredForm.productId}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, productId: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            <option value="">Link CTA to fallback URL</option>
                            {products.map((product) => (
                                <option key={product._id} value={product._id}>{product.name}</option>
                            ))}
                        </select>
                        <TargetSelector
                            label="Featured card target"
                            form={featuredForm}
                            setForm={setFeaturedForm}
                            hrefKey="href"
                            products={products}
                            stores={stores}
                        />
                        <input
                            type="text"
                            placeholder="Image URL or upload below"
                            value={featuredForm.imageUrl}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        {featuredForm.imageFile && (
                            <p className="text-xs text-gray-500">Selected image: {featuredForm.imageFile.name}</p>
                        )}
                        {!featuredForm.imageFile && featuredForm.imageUrl && (
                            <Image
                                src={featuredForm.imageUrl}
                                alt="Featured preview"
                                width={640}
                                height={640}
                                className="rounded-xl object-cover w-full h-40"
                            />
                        )}
                        <button
                            onClick={() => void saveFeaturedCard()}
                            disabled={savingContent}
                            className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                        >
                            {savingContent ? 'Saving...' : (editingFeaturedId ? 'Update Featured Card' : 'Add Featured Card')}
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Homepage Promo Offers</h2>
                        <p className="text-sm text-gray-500">Add the right-side hero promotion images that rotate on the storefront.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {promoBanners.map((banner, index) => (
                            <div key={banner?._id || `promo-banner-${index}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                                {banner?.imageUrl && (
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner?.title || 'Promo banner'}
                                        width={480}
                                        height={480}
                                        className="rounded-xl object-cover w-full h-44"
                                    />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{banner?.title || 'Promo banner'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{banner?.description || ''}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        CTA: {banner?.productId ? productName(banner.productId) : (banner?.href || 'None')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditingBanner(banner)}
                                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => void deleteBanner(banner?._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{editingBannerId ? 'Edit Promo Offer' : 'Add Promo Offer'}</h2>
                            <p className="text-sm text-gray-500">Upload the image and CTA used by the right hero panel.</p>
                        </div>
                        {editingBannerId && (
                            <button
                                onClick={() => {
                                    setEditingBannerId(null);
                                    setBannerForm(emptyPromoForm);
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Promo offer title"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <textarea
                        placeholder="Banner description"
                        value={bannerForm.description}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                    />
                    <input
                        type="text"
                        placeholder="Button text"
                        value={bannerForm.buttonText}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <select
                        value={bannerForm.productId}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, productId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                        <option value="">Link banner CTA to fallback URL</option>
                        {products.map((product) => (
                            <option key={product._id} value={product._id}>{product.name}</option>
                        ))}
                    </select>
                        <TargetSelector
                            label="Promo offer target"
                            form={bannerForm}
                            setForm={setBannerForm}
                            hrefKey="href"
                            products={products}
                            stores={stores}
                        />
                    <input
                        type="text"
                        placeholder="Image URL or upload below"
                        value={bannerForm.imageUrl}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                        onClick={() => void saveBanner()}
                        disabled={savingContent}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                    >
                        {savingContent ? 'Saving...' : (editingBannerId ? 'Update Promo Offer' : 'Add Promo Offer')}
                    </button>
                </div>

            </section>

            <section className="space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Category Page Banners</h2>
                    <p className="text-sm text-gray-500">Upload the banner image shown on category pages and choose what it opens.</p>
                </div>

                <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        {siteContent.categoryBanners.map((banner) => (
                            <div key={banner._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                                {banner.imageUrl && (
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        width={720}
                                        height={360}
                                        className="rounded-xl object-cover w-full h-44"
                                    />
                                )}
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">
                                        {banner.placementCategory || 'Unassigned'}
                                    </p>
                                    <h3 className="font-semibold text-gray-900 mt-1">{banner.title}</h3>
                                    <p className="text-xs text-gray-500 mt-2">Clicks to: {targetLabel(banner)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditingCategoryBanner(banner)}
                                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => void deleteCategoryBanner(banner._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">{editingCategoryBannerId ? 'Edit Category Banner' : 'Add Category Banner'}</h3>
                                <p className="text-sm text-gray-500">Use upload plus a clear target so the banner always opens the right place.</p>
                            </div>
                            {editingCategoryBannerId && (
                                <button
                                    onClick={() => {
                                        setEditingCategoryBannerId(null);
                                        setCategoryBannerForm(emptyCategoryBannerForm);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Banner title"
                            value={categoryBannerForm.title}
                            onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <textarea
                            placeholder="Banner description"
                            value={categoryBannerForm.description}
                            onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                        />
                        <input
                            type="text"
                            placeholder="Button text"
                            value={categoryBannerForm.buttonText}
                            onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <select
                            value={categoryBannerForm.placementCategory}
                            onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, placementCategory: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="">Choose category page</option>
                            {homeCategoryValues.map((category) => (
                                <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                            ))}
                        </select>
                        <TargetSelector
                            label="Banner click target"
                            form={categoryBannerForm}
                            setForm={setCategoryBannerForm}
                            hrefKey="href"
                            products={products}
                            stores={stores}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        {categoryBannerForm.imageFile && (
                            <p className="text-xs text-gray-500">Selected image: {categoryBannerForm.imageFile.name}</p>
                        )}
                        {!categoryBannerForm.imageFile && categoryBannerForm.imageUrl && (
                            <Image
                                src={categoryBannerForm.imageUrl}
                                alt="Category banner preview"
                                width={720}
                                height={360}
                                className="rounded-xl object-cover w-full h-40"
                            />
                        )}
                        <button
                            onClick={() => void saveCategoryBanner()}
                            disabled={savingContent}
                            className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                        >
                            {savingContent ? 'Saving...' : (editingCategoryBannerId ? 'Update Category Banner' : 'Add Category Banner')}
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Brand Showcases</h2>
                    <p className="text-sm text-gray-500">Upload brand cards that open the matching brand products list.</p>
                </div>

                <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        {siteContent.brandShowcases.map((item) => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                                {item.imageUrl && (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.brand || item.title}
                                        width={720}
                                        height={360}
                                        className="rounded-xl object-cover w-full h-40"
                                    />
                                )}
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">
                                        {item.placementCategory || 'Unassigned'}
                                    </p>
                                    <h3 className="font-semibold text-gray-900 mt-1">{item.brand || item.title}</h3>
                                    <p className="text-xs text-gray-500 mt-2">Clicks to: Brand collection for {item.brand || 'brand'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingBrandShowcaseId(item._id);
                                            setBrandShowcaseForm({
                                                title: item.title || '',
                                                brand: item.brand || '',
                                                description: item.description || '',
                                                placementCategory: item.placementCategory || '',
                                                imageUrl: item.imageUrl || '',
                                                imageFile: null,
                                            });
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => void deleteBrandShowcase(item._id)}
                                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">{editingBrandShowcaseId ? 'Edit Brand Showcase' : 'Add Brand Showcase'}</h3>
                                <p className="text-sm text-gray-500">Pick the brand name and where it should appear.</p>
                            </div>
                            {editingBrandShowcaseId && (
                                <button
                                    onClick={() => {
                                        setEditingBrandShowcaseId(null);
                                        setBrandShowcaseForm(emptyBrandShowcaseForm);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Brand name"
                            value={brandShowcaseForm.brand}
                            onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, brand: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="text"
                            placeholder="Card title"
                            value={brandShowcaseForm.title}
                            onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        <textarea
                            placeholder="Short description"
                            value={brandShowcaseForm.description}
                            onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                        />
                        <select
                            value={brandShowcaseForm.placementCategory}
                            onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, placementCategory: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="">Choose category page</option>
                            {homeCategoryValues.map((category) => (
                                <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                            ))}
                        </select>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        {brandShowcaseForm.imageFile && (
                            <p className="text-xs text-gray-500">Selected image: {brandShowcaseForm.imageFile.name}</p>
                        )}
                        {!brandShowcaseForm.imageFile && brandShowcaseForm.imageUrl && (
                            <Image
                                src={brandShowcaseForm.imageUrl}
                                alt="Brand showcase preview"
                                width={720}
                                height={360}
                                className="rounded-xl object-cover w-full h-40"
                            />
                        )}
                        <button
                            onClick={() => void saveBrandShowcase()}
                            disabled={savingContent}
                            className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                        >
                            {savingContent ? 'Saving...' : (editingBrandShowcaseId ? 'Update Brand Showcase' : 'Add Brand Showcase')}
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Newsletter Section</h2>
                        <p className="text-sm text-gray-500">Edit the heading and button label shown above the newsletter form.</p>
                    </div>

                    <input
                        type="text"
                        placeholder="Newsletter title"
                        value={newsletterForm.title}
                        onChange={(e) => setNewsletterForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <textarea
                        placeholder="Newsletter description"
                        value={newsletterForm.description}
                        onChange={(e) => setNewsletterForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-24 resize-none"
                    />
                    <input
                        type="text"
                        placeholder="Button text"
                        value={newsletterForm.buttonText}
                        onChange={(e) => setNewsletterForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <button
                        onClick={() => void saveNewsletter()}
                        disabled={savingContent}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-70"
                    >
                        {savingContent ? 'Saving...' : 'Save Newsletter Content'}
                    </button>

                    {bannerForm.imageFile && (
                        <p className="text-xs text-gray-500">Selected image: {bannerForm.imageFile.name}</p>
                    )}

                    {!bannerForm.imageFile && bannerForm.imageUrl && (
                        <Image
                            src={bannerForm.imageUrl}
                            alt="Banner preview"
                            width={640}
                            height={360}
                            className="rounded-2xl object-cover w-full h-52"
                        />
                    )}
                </div>
            </section>

            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Manage Promotion: {selectedProduct.name}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Promotion Type</label>
                                <select
                                    value={promotionData.promotionType}
                                    onChange={(e) => setPromotionData((prev) => ({ ...prev, promotionType: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    <option value="none">None</option>
                                    <option value="flash_deal">Flash Deal</option>
                                    <option value="featured">Featured</option>
                                    <option value="discount">Discount</option>
                                </select>
                            </div>

                            {promotionData.promotionType === 'flash_deal' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Flash Deal End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={promotionData.flashDealEndDate}
                                        onChange={(e) => setPromotionData((prev) => ({ ...prev, flashDealEndDate: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => void updatePromotion()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Update Promotion
                            </button>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
