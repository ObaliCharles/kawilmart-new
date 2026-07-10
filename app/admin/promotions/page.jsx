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
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</label>
                <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                />
            ) : null}
        </div>
    );
};

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const FormInput = ({ placeholder, value, onChange, type = 'text', textarea = false }) => {
    const classes = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200 placeholder:text-gray-400";
    if (textarea) {
        return (
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`${classes} min-h-[5rem] resize-none`}
            />
        );
    }
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={classes}
        />
    );
};

const ImageUpload = ({ imageUrl, imageFile, onUrlChange, onFileChange, previewHeight = 'h-40' }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <FormInput placeholder="Image URL" value={imageUrl} onChange={onUrlChange} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Upload
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
        </div>
        {imageFile && (
            <p className="text-xs text-gray-500">Selected: {imageFile.name}</p>
        )}
        {!imageFile && imageUrl && (
            <div className={`relative ${previewHeight} w-full overflow-hidden rounded-lg bg-gray-50`}>
                <Image src={imageUrl} alt="Preview" width={640} height={360} className="h-full w-full object-cover" />
            </div>
        )}
    </div>
);

const SectionCard = ({ title, description, children, className = '' }) => (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
        <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="p-5">
            {children}
        </div>
    </div>
);

const ActionButton = ({ onClick, variant = 'primary', children, disabled }) => {
    const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";
    const styles = {
        primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
        secondary: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
        edit: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
    };
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
            {children}
        </button>
    );
};

const ContentCard = ({ children, className = '' }) => (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md ${className}`}>
        {children}
    </div>
);

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
            if (!id || storeMap.has(id)) return;
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
        setBannerForm({ ...emptyPromoForm, imageFile: null });
        setCategoryBannerForm({ ...emptyCategoryBannerForm, imageFile: null });
        setBrandShowcaseForm({ ...emptyBrandShowcaseForm, imageFile: null });
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
            if (productsData.success) setProducts(productsData.products || []);
            else toast.error(productsData.message || 'Failed to fetch products');
            if (contentData.success) applySiteContent(contentData.content);
            else toast.error(contentData.message || 'Failed to fetch homepage content');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to load admin content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) void fetchAdminData();
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
        if (item.linkType === 'category' && item.category) return `Category: ${getCategoryMeta(item.category).label}`;
        if (item.linkType === 'store' && item.storeId) return `Store: ${storeName(item.storeId)}`;
        if (item.productId) return `Product: ${productName(item.productId)}`;
        return item[hrefKey] || 'None';
    };

    const updatePromotion = async () => {
        if (!selectedProduct) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/admin/update-promotion',
                {
                    productId: selectedProduct._id,
                    promotionType: promotionData.promotionType,
                    isFlashDeal: promotionData.promotionType === 'flash_deal',
                    flashDealEndDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealEndDate
                        ? new Date(promotionData.flashDealEndDate) : null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Promotion updated successfully');
                setProducts((prev) => prev.map((product) =>
                    product._id === selectedProduct._id
                        ? { ...product, promotionType: promotionData.promotionType, isFlashDeal: promotionData.promotionType === 'flash_deal', flashDealEndDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealEndDate ? new Date(promotionData.flashDealEndDate) : null }
                        : product
                ));
                setSelectedProduct(null);
            } else toast.error(data.message);
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
            } else toast.error(data.message || 'Failed to end flash deal');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to end flash deal');
        }
    };

    const postSiteContent = async (action, values, imageFile) => {
        const token = await getToken();
        const formData = new FormData();
        formData.append('action', action);
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, value);
        });
        if (imageFile) formData.append('image', imageFile);
        const { data } = await axios.post('/api/admin/site-content', formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!data.success) throw new Error(data.message || 'Failed to save content');
        applySiteContent(data.content);
        return data;
    };

    const saveHeroSlide = async () => {
        if (!heroForm.title.trim()) { toast.error('Please add a hero title'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('upsertHeroSlide', {
                itemId: editingHeroId || '', title: heroForm.title, offer: heroForm.offer,
                primaryButtonText: heroForm.primaryButtonText, secondaryButtonText: heroForm.secondaryButtonText,
                linkType: heroForm.linkType, category: heroForm.category, storeId: heroForm.storeId,
                productId: heroForm.productId, primaryHref: heroForm.primaryHref, secondaryHref: heroForm.secondaryHref,
                imageUrl: heroForm.imageUrl,
            }, heroForm.imageFile);
            toast.success(editingHeroId ? 'Hero slide updated' : 'Hero slide added');
            setEditingHeroId(null);
            setHeroForm(emptyHeroForm);
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const deleteHeroSlide = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteHeroSlide', { itemId });
            toast.success('Hero slide deleted');
            if (editingHeroId === itemId) { setEditingHeroId(null); setHeroForm(emptyHeroForm); }
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const saveFeaturedCard = async () => {
        if (!featuredForm.title.trim()) { toast.error('Please add a featured card title'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('upsertFeaturedCard', {
                itemId: editingFeaturedId || '', title: featuredForm.title, description: featuredForm.description,
                buttonText: featuredForm.buttonText, linkType: featuredForm.linkType, category: featuredForm.category,
                storeId: featuredForm.storeId, productId: featuredForm.productId, href: featuredForm.href,
                imageUrl: featuredForm.imageUrl,
            }, featuredForm.imageFile);
            toast.success(editingFeaturedId ? 'Featured card updated' : 'Featured card added');
            setEditingFeaturedId(null);
            setFeaturedForm(emptyFeaturedForm);
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const deleteFeaturedCard = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteFeaturedCard', { itemId });
            toast.success('Featured card deleted');
            if (editingFeaturedId === itemId) { setEditingFeaturedId(null); setFeaturedForm(emptyFeaturedForm); }
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const saveBanner = async () => {
        if (!bannerForm.title.trim()) { toast.error('Please add a promo offer title'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('upsertPromoBanner', {
                itemId: editingBannerId || '', title: bannerForm.title, description: bannerForm.description,
                buttonText: bannerForm.buttonText, linkType: bannerForm.linkType, category: bannerForm.category,
                storeId: bannerForm.storeId, productId: bannerForm.productId, href: bannerForm.href,
                imageUrl: bannerForm.imageUrl,
            }, bannerForm.imageFile);
            toast.success(editingBannerId ? 'Promo offer updated' : 'Promo offer added');
            setEditingBannerId(null);
            setBannerForm(emptyPromoForm);
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const saveCategoryBanner = async () => {
        if (!categoryBannerForm.title.trim()) { toast.error('Please add a category banner title'); return; }
        if (!categoryBannerForm.placementCategory) { toast.error('Please choose where this banner appears'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('upsertCategoryBanner', {
                itemId: editingCategoryBannerId || '', title: categoryBannerForm.title, description: categoryBannerForm.description,
                buttonText: categoryBannerForm.buttonText, placementCategory: categoryBannerForm.placementCategory,
                linkType: categoryBannerForm.linkType, category: categoryBannerForm.category, storeId: categoryBannerForm.storeId,
                productId: categoryBannerForm.productId, href: categoryBannerForm.href, imageUrl: categoryBannerForm.imageUrl,
            }, categoryBannerForm.imageFile);
            toast.success(editingCategoryBannerId ? 'Category banner updated' : 'Category banner added');
            setEditingCategoryBannerId(null);
            setCategoryBannerForm(emptyCategoryBannerForm);
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const saveBrandShowcase = async () => {
        if (!brandShowcaseForm.brand.trim()) { toast.error('Please add a brand name'); return; }
        if (!brandShowcaseForm.placementCategory) { toast.error('Please choose where this brand card appears'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('upsertBrandShowcase', {
                itemId: editingBrandShowcaseId || '', title: brandShowcaseForm.title, brand: brandShowcaseForm.brand,
                description: brandShowcaseForm.description, placementCategory: brandShowcaseForm.placementCategory,
                imageUrl: brandShowcaseForm.imageUrl,
            }, brandShowcaseForm.imageFile);
            toast.success(editingBrandShowcaseId ? 'Brand showcase updated' : 'Brand showcase added');
            setEditingBrandShowcaseId(null);
            setBrandShowcaseForm(emptyBrandShowcaseForm);
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const deleteBrandShowcase = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteBrandShowcase', { itemId });
            toast.success('Brand showcase deleted');
            if (editingBrandShowcaseId === itemId) { setEditingBrandShowcaseId(null); setBrandShowcaseForm(emptyBrandShowcaseForm); }
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const deleteCategoryBanner = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deleteCategoryBanner', { itemId });
            toast.success('Category banner deleted');
            if (editingCategoryBannerId === itemId) { setEditingCategoryBannerId(null); setCategoryBannerForm(emptyCategoryBannerForm); }
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const deleteBanner = async (itemId) => {
        try {
            setSavingContent(true);
            await postSiteContent('deletePromoBanner', { itemId });
            toast.success('Promo offer deleted');
            if (editingBannerId === itemId) { setEditingBannerId(null); setBannerForm(emptyPromoForm); }
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const saveNewsletter = async () => {
        if (!newsletterForm.title.trim()) { toast.error('Please add a newsletter title'); return; }
        try {
            setSavingContent(true);
            await postSiteContent('saveNewsletter', newsletterForm);
            toast.success('Newsletter section updated');
        } catch (error) { toast.error(error.message); }
        finally { setSavingContent(false); }
    };

    const startEditingHero = (slide) => {
        setEditingHeroId(slide._id);
        setHeroForm({
            title: slide.title || '', offer: slide.offer || '',
            primaryButtonText: slide.primaryButtonText || 'Shop Now', secondaryButtonText: slide.secondaryButtonText || 'Explore Deals',
            linkType: slide.linkType || inferLinkType(slide, 'primaryHref'),
            category: slide.category || decodeCategoryFromHref(slide.primaryHref),
            storeId: slide.storeId || decodeStoreFromHref(slide.primaryHref),
            productId: slide.productId || '', primaryHref: slide.primaryHref || '',
            secondaryHref: slide.secondaryHref || '/all-products?filter=flash',
            imageUrl: slide.imageUrl || '', imageFile: null,
        });
    };

    const startEditingFeatured = (card) => {
        if (!card?._id) return;
        setEditingFeaturedId(card._id);
        setFeaturedForm({
            title: card.title || '', description: card.description || '', buttonText: card.buttonText || 'Buy now',
            linkType: card.linkType || inferLinkType(card, 'href'),
            category: card.category || decodeCategoryFromHref(card.href),
            storeId: card.storeId || decodeStoreFromHref(card.href),
            productId: card.productId || '', href: card.href || '', imageUrl: card.imageUrl || '', imageFile: null,
        });
    };

    const startEditingBanner = (banner) => {
        if (!banner?._id) return;
        setEditingBannerId(banner._id);
        setBannerForm({
            title: banner.title || '', description: banner.description || '', buttonText: banner.buttonText || 'Get offer',
            linkType: banner.linkType || inferLinkType(banner, 'href'),
            category: banner.category || decodeCategoryFromHref(banner.href),
            storeId: banner.storeId || decodeStoreFromHref(banner.href),
            productId: banner.productId || '', href: banner.href || '/all-products?filter=flash',
            imageUrl: banner.imageUrl || '', imageFile: null,
        });
    };

    const startEditingCategoryBanner = (banner) => {
        setEditingCategoryBannerId(banner._id);
        setCategoryBannerForm({
            title: banner.title || '', description: banner.description || '', buttonText: banner.buttonText || 'Shop now',
            placementCategory: banner.placementCategory || '', linkType: banner.linkType || 'category',
            category: banner.category || '', storeId: banner.storeId || '', productId: banner.productId || '',
            href: banner.href || '', imageUrl: banner.imageUrl || '', imageFile: null,
        });
    };

    if (loading) return <PromotionsPageSkeleton />;

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promotions & Content</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage flash deals, hero slides, banners, and homepage content.</p>
                </div>
            </div>

            {/* Product Promotions */}
            <SectionCard title="Product Promotions" description="Choose which products appear as flash deals or featured promotions.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <ContentCard key={product._id}>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                                    <Image src={product.image[0]} alt={product.name} width={64} height={64} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500">{formatCurrency(product.offerPrice)}</p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {product.isFlashDeal && <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">Flash Deal</span>}
                                        {product.promotionType === 'featured' && <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">Featured</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <ActionButton variant="edit" onClick={() => {
                                    setSelectedProduct(product);
                                    setPromotionData({
                                        promotionType: product.isFlashDeal ? 'flash_deal' : (product.promotionType || 'none'),
                                        flashDealEndDate: toDateTimeLocal(product.flashDealEndDate),
                                    });
                                }}>
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M15.2 4.2a2.8 2.8 0 1 1 4 4L7 20.5 3 21l.5-4L15.2 4.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Manage
                                </ActionButton>
                                {product.isFlashDeal && (
                                    <ActionButton variant="danger" onClick={() => endFlashDeal(product._id)}>End Deal</ActionButton>
                                )}
                            </div>
                        </ContentCard>
                    ))}
                </div>
            </SectionCard>

            {/* Hero Slides */}
            <SectionCard title="Hero Slides" description="Add, edit, or remove the large homepage slides and link them to a product or fallback URL.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {siteContent.heroSlides.map((slide) => (
                            <ContentCard key={slide._id}>
                                {slide.imageUrl && (
                                    <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={slide.imageUrl} alt={slide.title} width={640} height={360} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="mb-3">
                                    {slide.offer && <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{slide.offer}</p>}
                                    <h3 className="mt-0.5 font-semibold text-gray-900">{slide.title}</h3>
                                    <p className="mt-1 text-xs text-gray-500">Primary: {slide.productId ? productName(slide.productId) : (slide.primaryHref || 'None')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <ActionButton variant="edit" onClick={() => startEditingHero(slide)}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteHeroSlide(slide._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">{editingHeroId ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>
                            {editingHeroId && (
                                <button onClick={() => { setEditingHeroId(null); setHeroForm(emptyHeroForm); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <FormInput placeholder="Offer badge text" value={heroForm.offer} onChange={(e) => setHeroForm((prev) => ({ ...prev, offer: e.target.value }))} />
                            <FormInput placeholder="Hero title" value={heroForm.title} onChange={(e) => setHeroForm((prev) => ({ ...prev, title: e.target.value }))} textarea />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormInput placeholder="Primary button text" value={heroForm.primaryButtonText} onChange={(e) => setHeroForm((prev) => ({ ...prev, primaryButtonText: e.target.value }))} />
                                <FormInput placeholder="Secondary button text" value={heroForm.secondaryButtonText} onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryButtonText: e.target.value }))} />
                            </div>
                            <select value={heroForm.productId} onChange={(e) => setHeroForm((prev) => ({ ...prev, productId: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                <option value="">Link primary CTA to fallback URL</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>{product.name}</option>
                                ))}
                            </select>
                            <TargetSelector label="Primary CTA target" form={heroForm} setForm={setHeroForm} hrefKey="primaryHref" products={products} stores={stores} />
                            <FormInput placeholder="Secondary URL" value={heroForm.secondaryHref} onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryHref: e.target.value }))} />
                            <ImageUpload
                                imageUrl={heroForm.imageUrl}
                                imageFile={heroForm.imageFile}
                                onUrlChange={(e) => setHeroForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                onFileChange={(e) => setHeroForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            />
                            <ActionButton onClick={() => void saveHeroSlide()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingHeroId ? 'Update Hero Slide' : 'Add Hero Slide')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Featured Cards */}
            <SectionCard title="Featured Cards" description="Control the three featured cards shown beneath popular products.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {featuredCards.map((card, index) => (
                            <ContentCard key={card?._id || `featured-card-${index}`}>
                                {card?.imageUrl && (
                                    <div className="mb-3 h-44 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={card.imageUrl} alt={card?.title || 'Featured card'} width={640} height={640} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <h3 className="font-semibold text-gray-900">{card?.title || 'Featured card'}</h3>
                                <p className="mt-1 text-sm text-gray-500">{card?.description || ''}</p>
                                <p className="mt-2 text-xs text-gray-500">CTA: {card?.productId ? productName(card.productId) : (card?.href || 'None')}</p>
                                <div className="mt-3 flex gap-2">
                                    <ActionButton variant="edit" onClick={() => startEditingFeatured(card)}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteFeaturedCard(card?._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">{editingFeaturedId ? 'Edit Featured Card' : 'Add Featured Card'}</h3>
                            {editingFeaturedId && (
                                <button onClick={() => { setEditingFeaturedId(null); setFeaturedForm(emptyFeaturedForm); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <FormInput placeholder="Card title" value={featuredForm.title} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, title: e.target.value }))} />
                            <FormInput placeholder="Description" value={featuredForm.description} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, description: e.target.value }))} textarea />
                            <FormInput placeholder="Button text" value={featuredForm.buttonText} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, buttonText: e.target.value }))} />
                            <select value={featuredForm.productId} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, productId: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                <option value="">Link CTA to fallback URL</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>{product.name}</option>
                                ))}
                            </select>
                            <TargetSelector label="Featured card target" form={featuredForm} setForm={setFeaturedForm} hrefKey="href" products={products} stores={stores} />
                            <ImageUpload
                                imageUrl={featuredForm.imageUrl}
                                imageFile={featuredForm.imageFile}
                                onUrlChange={(e) => setFeaturedForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                onFileChange={(e) => setFeaturedForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            />
                            <ActionButton onClick={() => void saveFeaturedCard()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingFeaturedId ? 'Update Featured Card' : 'Add Featured Card')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Homepage Promo Offers */}
            <SectionCard title="Homepage Promo Offers" description="Add the right-side hero promotion images that rotate on the storefront.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {promoBanners.map((banner, index) => (
                            <ContentCard key={banner?._id || `promo-banner-${index}`}>
                                {banner?.imageUrl && (
                                    <div className="mb-3 h-36 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={banner.imageUrl} alt={banner?.title || 'Promo banner'} width={480} height={480} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <h3 className="font-semibold text-gray-900">{banner?.title || 'Promo banner'}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{banner?.description || ''}</p>
                                <p className="mt-2 text-xs text-gray-500">CTA: {banner?.productId ? productName(banner.productId) : (banner?.href || 'None')}</p>
                                <div className="mt-3 flex gap-2">
                                    <ActionButton variant="edit" onClick={() => startEditingBanner(banner)}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteBanner(banner?._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{editingBannerId ? 'Edit Promo Offer' : 'Add Promo Offer'}</h3>
                                <p className="text-sm text-gray-500">Upload the image and CTA used by the right hero panel.</p>
                            </div>
                            {editingBannerId && (
                                <button onClick={() => { setEditingBannerId(null); setBannerForm(emptyPromoForm); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <FormInput placeholder="Promo offer title" value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} />
                            <FormInput placeholder="Banner description" value={bannerForm.description} onChange={(e) => setBannerForm((prev) => ({ ...prev, description: e.target.value }))} textarea />
                            <FormInput placeholder="Button text" value={bannerForm.buttonText} onChange={(e) => setBannerForm((prev) => ({ ...prev, buttonText: e.target.value }))} />
                            <select value={bannerForm.productId} onChange={(e) => setBannerForm((prev) => ({ ...prev, productId: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                <option value="">Link banner CTA to fallback URL</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>{product.name}</option>
                                ))}
                            </select>
                            <TargetSelector label="Promo offer target" form={bannerForm} setForm={setBannerForm} hrefKey="href" products={products} stores={stores} />
                            <ImageUpload
                                imageUrl={bannerForm.imageUrl}
                                imageFile={bannerForm.imageFile}
                                onUrlChange={(e) => setBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                onFileChange={(e) => setBannerForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            />
                            <ActionButton onClick={() => void saveBanner()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingBannerId ? 'Update Promo Offer' : 'Add Promo Offer')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Category Page Banners */}
            <SectionCard title="Category Page Banners" description="Upload the banner image shown on category pages and choose what it opens.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {siteContent.categoryBanners.map((banner) => (
                            <ContentCard key={banner._id}>
                                {banner.imageUrl && (
                                    <div className="mb-3 h-36 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={banner.imageUrl} alt={banner.title} width={720} height={360} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{banner.placementCategory || 'Unassigned'}</p>
                                <h3 className="mt-0.5 font-semibold text-gray-900">{banner.title}</h3>
                                <p className="mt-1 text-xs text-gray-500">Clicks to: {targetLabel(banner)}</p>
                                <div className="mt-3 flex gap-2">
                                    <ActionButton variant="edit" onClick={() => startEditingCategoryBanner(banner)}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteCategoryBanner(banner._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{editingCategoryBannerId ? 'Edit Category Banner' : 'Add Category Banner'}</h3>
                                <p className="text-sm text-gray-500">Use upload plus a clear target so the banner always opens the right place.</p>
                            </div>
                            {editingCategoryBannerId && (
                                <button onClick={() => { setEditingCategoryBannerId(null); setCategoryBannerForm(emptyCategoryBannerForm); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <FormInput placeholder="Banner title" value={categoryBannerForm.title} onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, title: e.target.value }))} />
                            <FormInput placeholder="Banner description" value={categoryBannerForm.description} onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, description: e.target.value }))} textarea />
                            <FormInput placeholder="Button text" value={categoryBannerForm.buttonText} onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, buttonText: e.target.value }))} />
                            <select value={categoryBannerForm.placementCategory} onChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, placementCategory: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                <option value="">Choose category page</option>
                                {homeCategoryValues.map((category) => (
                                    <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                                ))}
                            </select>
                            <TargetSelector label="Banner click target" form={categoryBannerForm} setForm={setCategoryBannerForm} hrefKey="href" products={products} stores={stores} />
                            <ImageUpload
                                imageUrl={categoryBannerForm.imageUrl}
                                imageFile={categoryBannerForm.imageFile}
                                onUrlChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                onFileChange={(e) => setCategoryBannerForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            />
                            <ActionButton onClick={() => void saveCategoryBanner()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingCategoryBannerId ? 'Update Category Banner' : 'Add Category Banner')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Brand Showcases */}
            <SectionCard title="Brand Showcases" description="Upload brand cards that open the matching brand products list.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {siteContent.brandShowcases.map((item) => (
                            <ContentCard key={item._id}>
                                {item.imageUrl && (
                                    <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={item.imageUrl} alt={item.brand || item.title} width={720} height={360} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{item.placementCategory || 'Unassigned'}</p>
                                <h3 className="mt-0.5 font-semibold text-gray-900">{item.brand || item.title}</h3>
                                <p className="mt-1 text-xs text-gray-500">Brand collection for {item.brand || 'brand'}</p>
                                <div className="mt-3 flex gap-2">
                                    <ActionButton variant="edit" onClick={() => {
                                        setEditingBrandShowcaseId(item._id);
                                        setBrandShowcaseForm({
                                            title: item.title || '', brand: item.brand || '', description: item.description || '',
                                            placementCategory: item.placementCategory || '', imageUrl: item.imageUrl || '', imageFile: null,
                                        });
                                    }}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteBrandShowcase(item._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{editingBrandShowcaseId ? 'Edit Brand Showcase' : 'Add Brand Showcase'}</h3>
                                <p className="text-sm text-gray-500">Pick the brand name and where it should appear.</p>
                            </div>
                            {editingBrandShowcaseId && (
                                <button onClick={() => { setEditingBrandShowcaseId(null); setBrandShowcaseForm(emptyBrandShowcaseForm); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <FormInput placeholder="Brand name" value={brandShowcaseForm.brand} onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, brand: e.target.value }))} />
                            <FormInput placeholder="Card title" value={brandShowcaseForm.title} onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, title: e.target.value }))} />
                            <FormInput placeholder="Short description" value={brandShowcaseForm.description} onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, description: e.target.value }))} textarea />
                            <select value={brandShowcaseForm.placementCategory} onChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, placementCategory: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                <option value="">Choose category page</option>
                                {homeCategoryValues.map((category) => (
                                    <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                                ))}
                            </select>
                            <ImageUpload
                                imageUrl={brandShowcaseForm.imageUrl}
                                imageFile={brandShowcaseForm.imageFile}
                                onUrlChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                onFileChange={(e) => setBrandShowcaseForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                            />
                            <ActionButton onClick={() => void saveBrandShowcase()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingBrandShowcaseId ? 'Update Brand Showcase' : 'Add Brand Showcase')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Newsletter Section */}
            <SectionCard title="Newsletter Section" description="Edit the heading and button label shown above the newsletter form.">
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="space-y-3">
                        <FormInput placeholder="Newsletter title" value={newsletterForm.title} onChange={(e) => setNewsletterForm((prev) => ({ ...prev, title: e.target.value }))} />
                        <FormInput placeholder="Newsletter description" value={newsletterForm.description} onChange={(e) => setNewsletterForm((prev) => ({ ...prev, description: e.target.value }))} textarea />
                        <FormInput placeholder="Button text" value={newsletterForm.buttonText} onChange={(e) => setNewsletterForm((prev) => ({ ...prev, buttonText: e.target.value }))} />
                        <ActionButton onClick={() => void saveNewsletter()} disabled={savingContent} variant="primary">
                            {savingContent ? 'Saving...' : 'Save Newsletter Content'}
                        </ActionButton>
                    </div>
                </div>
            </SectionCard>

            {/* Promotion Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">Manage Promotion</h3>
                        <p className="mt-1 text-sm text-gray-500">{selectedProduct.name}</p>
                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Promotion Type</label>
                                <select value={promotionData.promotionType} onChange={(e) => setPromotionData((prev) => ({ ...prev, promotionType: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200">
                                    <option value="none">None</option>
                                    <option value="flash_deal">Flash Deal</option>
                                    <option value="featured">Featured</option>
                                    <option value="discount">Discount</option>
                                </select>
                            </div>
                            {promotionData.promotionType === 'flash_deal' && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Flash Deal End Date</label>
                                    <input type="datetime-local" value={promotionData.flashDealEndDate} onChange={(e) => setPromotionData((prev) => ({ ...prev, flashDealEndDate: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex gap-3">
                            <ActionButton onClick={() => void updatePromotion()} variant="primary">Update Promotion</ActionButton>
                            <ActionButton onClick={() => setSelectedProduct(null)} variant="secondary">Cancel</ActionButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}