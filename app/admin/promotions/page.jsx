'use client'

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { defaultSiteContent, resolveSiteContent } from '@/lib/defaultSiteContent';
import { homeCategoryValues, getCategoryMeta } from '@/lib/marketplaceCategories';
import { PromotionsPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import BannerImageUploader from '@/components/admin/BannerImageUploader';

const linkTypeOptions = [
    { value: 'category', label: 'Category' },
    { value: 'store', label: 'Store' },
    { value: 'product', label: 'Product' },
    { value: 'custom', label: 'Custom URL' },
];

const bannerTypeConfigs = [
    { type: 'hero', label: 'Hero Slides', description: 'Large homepage slides linked to a product, category, store, or URL. Upload a wide banner (~15:4, e.g. 1920×512) so it fits the hero cleanly — the image is shown as uploaded.', aspect: 15 / 4, hasSecondaryCta: true, hasDescription: false, hasOffer: true, hasPlacement: false, hasBrand: false, hasTarget: true, ctaLabel: 'Primary button text', defaultCta: 'Shop Now' },
    { type: 'featured', label: 'Featured Cards', description: 'Cards shown beneath popular products.', aspect: 4 / 3, hasSecondaryCta: false, hasDescription: true, hasOffer: false, hasPlacement: false, hasBrand: false, hasTarget: true, ctaLabel: 'Button text', defaultCta: 'Buy now' },
    { type: 'promo', label: 'Homepage Promo Offers', description: 'Right-side hero promotion images that rotate on the storefront.', aspect: 4 / 3, hasSecondaryCta: false, hasDescription: true, hasOffer: false, hasPlacement: false, hasBrand: false, hasTarget: true, ctaLabel: 'Button text', defaultCta: 'Get offer' },
    { type: 'sidebarPromo', label: 'Sidebar Promo Banners', description: 'Small promo banners shown in sidebar placements.', aspect: 1, hasSecondaryCta: false, hasDescription: true, hasOffer: false, hasPlacement: false, hasBrand: false, hasTarget: true, ctaLabel: 'Button text', defaultCta: 'View offer' },
    { type: 'category', label: 'Category Page Banners', description: 'Banner shown on category pages, plus what it opens.', aspect: 16 / 9, hasSecondaryCta: false, hasDescription: true, hasOffer: false, hasPlacement: true, hasBrand: false, hasTarget: true, ctaLabel: 'Button text', defaultCta: 'Shop now' },
    { type: 'brandShowcase', label: 'Brand Showcases', description: 'Brand cards that open the matching brand products list.', aspect: 1, hasSecondaryCta: false, hasDescription: true, hasOffer: false, hasPlacement: true, hasBrand: true, hasTarget: false, ctaLabel: null, defaultCta: '' },
];

const configByType = Object.fromEntries(bannerTypeConfigs.map((config) => [config.type, config]));

const emptyBannerForm = (type) => ({
    title: '',
    subtitle: '',
    ctaText: configByType[type]?.defaultCta || '',
    secondaryCtaText: 'Explore Deals',
    linkType: 'category',
    category: '',
    storeId: '',
    productId: '',
    href: '',
    secondaryHref: '/all-products?filter=flash',
    brand: '',
    placementCategory: '',
    startDate: '',
    endDate: '',
    isDraft: false,
    showOverlay: false,
});

const getTargetHref = (form) => {
    if (form.linkType === 'category' && form.category) {
        return `/all-products?category=${encodeURIComponent(form.category)}`;
    }
    if (form.linkType === 'store' && form.storeId) {
        return `/store/${encodeURIComponent(form.storeId)}`;
    }
    if (form.linkType === 'product') {
        return '';
    }
    return form.href || '';
};

const inferLinkType = (banner) => {
    if (banner.linkType) return banner.linkType;
    if (banner.productId) return 'product';
    const href = banner.href || '';
    if (href.startsWith('/store/')) return 'store';
    if (href.includes('category=')) return 'category';
    return 'custom';
};

const TargetSelector = ({ label = 'Click target', form, setForm, products, stores }) => {
    const linkType = form.linkType || 'custom';
    const setLinkType = (nextType) => {
        setForm((prev) => ({
            ...prev,
            linkType: nextType,
            productId: nextType === 'product' ? prev.productId : '',
            category: nextType === 'category' ? prev.category : '',
            storeId: nextType === 'store' ? prev.storeId : '',
            href: nextType === 'custom' ? prev.href : getTargetHref({ ...prev, linkType: nextType }),
        }));
    };

    return (
        <div className="space-y-3 rounded-xl bg-white ring-1 ring-gray-100 p-4 shadow-sm">
            <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</label>
                <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
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
                        href: e.target.value ? `/all-products?category=${encodeURIComponent(e.target.value)}` : '',
                    }))}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
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
                        href: e.target.value ? `/store/${encodeURIComponent(e.target.value)}` : '',
                    }))}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
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
                        href: '',
                    }))}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
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
                    value={form.href}
                    onChange={(e) => setForm((prev) => ({
                        ...prev,
                        productId: '',
                        category: '',
                        storeId: '',
                        href: e.target.value,
                    }))}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
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
    const classes = "w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200 placeholder:text-gray-400";
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

const SectionCard = ({ title, description, children, className = '' }) => (
    <div className={`rounded-xl bg-white ring-1 ring-gray-100 shadow-sm ${className}`}>
        <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

const ActionButton = ({ onClick, variant = 'primary', children, disabled, className = '' }) => {
    const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";
    const styles = {
        primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
        edit: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
    };
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
            {children}
        </button>
    );
};

const ContentCard = ({ children, className = '' }) => (
    <div className={`rounded-xl bg-white p-4 ring-1 ring-gray-100 transition hover:shadow-md ${className}`}>
        {children}
    </div>
);

const statusBadgeStyles = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    expired: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

const computeBannerLifecycleStatus = (banner, now = new Date()) => {
    if (banner.status === 'draft') return 'draft';
    if (banner.startDate && now < new Date(banner.startDate)) return 'scheduled';
    if (banner.endDate && now > new Date(banner.endDate)) return 'expired';
    return 'active';
};

const StatusBadge = ({ banner }) => {
    const status = computeBannerLifecycleStatus(banner);
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeStyles[status]}`}>
            {status}
        </span>
    );
};

export default function AdminPromotions() {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [promotionData, setPromotionData] = useState({
        flashDealStartDate: '',
        flashDealEndDate: '',
        promotionType: 'none'
    });
    const [newsletterForm, setNewsletterForm] = useState(defaultSiteContent.newsletter);
    const [savingContent, setSavingContent] = useState(false);
    const [activeBannerType, setActiveBannerType] = useState('hero');
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerForm, setBannerForm] = useState(emptyBannerForm('hero'));
    const [bannerImageFile, setBannerImageFile] = useState(null);
    const [bannerImagePreview, setBannerImagePreview] = useState('');
    const [existingBannerImageUrl, setExistingBannerImageUrl] = useState('');

    const activeConfig = configByType[activeBannerType];
    const bannersForActiveType = useMemo(
        () => banners.filter((banner) => banner.type === activeBannerType).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        [banners, activeBannerType]
    );

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

    const resetBannerForm = () => {
        setEditingBannerId(null);
        setBannerForm(emptyBannerForm(activeBannerType));
        setBannerImageFile(null);
        setBannerImagePreview('');
        setExistingBannerImageUrl('');
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [{ data: productsData }, { data: contentData }, { data: bannersData }] = await Promise.all([
                axios.get('/api/product/list?limit=100', { headers }),
                axios.get('/api/admin/site-content', { headers }),
                axios.get('/api/admin/banners', { headers }),
            ]);
            if (productsData.success) setProducts(productsData.products || []);
            else toast.error(productsData.message || 'Failed to fetch products');
            if (contentData.success) setNewsletterForm(resolveSiteContent(contentData.content).newsletter);
            else toast.error(contentData.message || 'Failed to fetch homepage content');
            if (bannersData.success) setBanners(bannersData.banners || []);
            else toast.error(bannersData.message || 'Failed to fetch banners');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to load admin content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) void fetchAdminData();
    }, [authReady, user]);

    useEffect(() => {
        resetBannerForm();
        // Switching tabs should clear any in-progress edit for the previous type.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBannerType]);

    const productName = (productId) => {
        const product = products.find((item) => item._id === productId);
        return product?.name || 'No product linked';
    };

    const storeName = (storeId) => {
        const store = stores.find((item) => item.id === storeId);
        return store?.name || 'No store linked';
    };

    const targetLabel = (banner) => {
        if (banner.linkType === 'category' && banner.category) return `Category: ${getCategoryMeta(banner.category).label}`;
        if (banner.linkType === 'store' && banner.storeId) return `Store: ${storeName(banner.storeId)}`;
        if (banner.productId) return `Product: ${productName(banner.productId)}`;
        return banner.href || 'None';
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
                    flashDealStartDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealStartDate
                        ? new Date(promotionData.flashDealStartDate) : null,
                    flashDealEndDate: promotionData.promotionType === 'flash_deal' && promotionData.flashDealEndDate
                        ? new Date(promotionData.flashDealEndDate) : null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Promotion updated successfully');
                setProducts((prev) => prev.map((product) =>
                    product._id === selectedProduct._id
                        ? {
                            ...product,
                            promotionType: data.product.promotionType,
                            isFlashDeal: data.product.isFlashDeal,
                            flashDealStartDate: data.product.flashDealStartDate,
                            flashDealEndDate: data.product.flashDealEndDate,
                        }
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

    const postSiteContent = async (action, values) => {
        const token = await getToken();
        const formData = new FormData();
        formData.append('action', action);
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, value);
        });
        const { data } = await axios.post('/api/admin/site-content', formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!data.success) throw new Error(data.message || 'Failed to save content');
        setNewsletterForm(resolveSiteContent(data.content).newsletter);
        return data;
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

    const saveBanner = async () => {
        if (!bannerForm.title.trim() && activeBannerType !== 'brandShowcase') {
            toast.error('Please add a title');
            return;
        }
        if (activeBannerType === 'brandShowcase' && !bannerForm.brand.trim()) {
            toast.error('Please add a brand name');
            return;
        }
        if (activeConfig.hasPlacement && !bannerForm.placementCategory) {
            toast.error('Please choose where this banner appears');
            return;
        }

        try {
            setSavingContent(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('type', activeBannerType);
            formData.append('title', bannerForm.title);
            formData.append('subtitle', bannerForm.subtitle);
            formData.append('linkType', bannerForm.linkType);
            formData.append('category', bannerForm.category);
            formData.append('storeId', bannerForm.storeId);
            formData.append('productId', bannerForm.productId);

            if (activeBannerType === 'brandShowcase') {
                formData.append('brand', bannerForm.brand);
                formData.append('href', bannerForm.brand ? `/all-products?brand=${encodeURIComponent(bannerForm.brand)}` : '');
            } else {
                formData.append('href', bannerForm.href);
                formData.append('ctaText', bannerForm.ctaText);
            }

            if (activeConfig.hasSecondaryCta) {
                formData.append('secondaryCtaText', bannerForm.secondaryCtaText);
                formData.append('secondaryHref', bannerForm.secondaryHref);
            }
            if (activeConfig.hasPlacement) {
                formData.append('placementCategory', bannerForm.placementCategory);
            }

            formData.append('status', bannerForm.isDraft ? 'draft' : 'active');
            formData.append('showOverlay', bannerForm.showOverlay ? 'true' : 'false');
            formData.append('startDate', bannerForm.startDate ? new Date(bannerForm.startDate).toISOString() : '');
            formData.append('endDate', bannerForm.endDate ? new Date(bannerForm.endDate).toISOString() : '');

            if (bannerImageFile) {
                formData.append('image', bannerImageFile);
            }

            const headers = { Authorization: `Bearer ${token}` };
            const { data } = editingBannerId
                ? await axios.patch(`/api/admin/banners/${editingBannerId}`, formData, { headers })
                : await axios.post('/api/admin/banners', formData, { headers });

            if (!data.success) throw new Error(data.message || 'Failed to save banner');

            toast.success(editingBannerId ? 'Banner updated' : 'Banner added');
            resetBannerForm();
            await fetchAdminData();
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to save banner');
        } finally {
            setSavingContent(false);
        }
    };

    const deleteBannerItem = async (id) => {
        try {
            setSavingContent(true);
            const token = await getToken();
            const { data } = await axios.delete(`/api/admin/banners/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!data.success) throw new Error(data.message || 'Failed to delete banner');
            toast.success('Banner deleted');
            if (editingBannerId === id) resetBannerForm();
            setBanners((prev) => prev.filter((banner) => banner._id !== id));
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to delete banner');
        } finally {
            setSavingContent(false);
        }
    };

    const startEditingBanner = (banner) => {
        setEditingBannerId(banner._id);
        setBannerForm({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            ctaText: banner.ctaText || activeConfig.defaultCta,
            secondaryCtaText: banner.secondaryCtaText || 'Explore Deals',
            linkType: banner.linkType || inferLinkType(banner),
            category: banner.category || '',
            storeId: banner.storeId || '',
            productId: banner.productId || '',
            href: banner.href || '',
            secondaryHref: banner.secondaryHref || '/all-products?filter=flash',
            brand: banner.brand || '',
            placementCategory: banner.placementCategory || '',
            startDate: toDateTimeLocal(banner.startDate),
            endDate: toDateTimeLocal(banner.endDate),
            isDraft: banner.status === 'draft',
            showOverlay: Boolean(banner.showOverlay),
        });
        setBannerImageFile(null);
        setBannerImagePreview('');
        setExistingBannerImageUrl(banner.imageUrl || '');
    };

    if (loading) return <PromotionsPageSkeleton />;

    return (
        <div className="mx-auto max-w-7xl space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-gray-950">Promotions & Content</h1>
                    <p className="mt-0.5 text-xs text-gray-500">Manage flash deals, banners, and homepage content.</p>
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
                                        flashDealStartDate: toDateTimeLocal(product.flashDealStartDate),
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

            {/* Banners */}
            <SectionCard title="Banners" description="Manage every homepage and category banner from one place — with scheduling and drafts.">
                <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                    {bannerTypeConfigs.map((config) => (
                        <button
                            key={config.type}
                            type="button"
                            onClick={() => setActiveBannerType(config.type)}
                            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                                activeBannerType === config.type
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
                <p className="mb-4 text-sm text-gray-500">{activeConfig.description}</p>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {bannersForActiveType.length === 0 ? (
                            <p className="text-sm text-gray-400">No {activeConfig.label.toLowerCase()} yet.</p>
                        ) : bannersForActiveType.map((banner) => (
                            <ContentCard key={banner._id}>
                                {banner.imageUrl && (
                                    <div className="mb-3 h-36 w-full overflow-hidden rounded-lg bg-gray-50">
                                        <Image src={banner.imageUrl} alt={banner.title || banner.brand || 'Banner'} width={640} height={360} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <StatusBadge banner={banner} />
                                    {activeConfig.hasPlacement && banner.placementCategory && (
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{banner.placementCategory}</span>
                                    )}
                                </div>
                                <h3 className="mt-1.5 font-semibold text-gray-900">{banner.title || banner.brand || 'Untitled'}</h3>
                                {banner.subtitle && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{banner.subtitle}</p>}
                                {activeConfig.hasTarget && (
                                    <p className="mt-2 text-xs text-gray-500">Clicks to: {targetLabel(banner)}</p>
                                )}
                                <div className="mt-3 flex gap-2">
                                    <ActionButton variant="edit" onClick={() => startEditingBanner(banner)}>Edit</ActionButton>
                                    <ActionButton variant="danger" onClick={() => void deleteBannerItem(banner._id)}>Delete</ActionButton>
                                </div>
                            </ContentCard>
                        ))}
                    </div>

                    <div className="rounded-lg bg-gray-50/80 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">{editingBannerId ? `Edit ${activeConfig.label.replace(/s$/, '')}` : `Add ${activeConfig.label.replace(/s$/, '')}`}</h3>
                            {editingBannerId && (
                                <button onClick={resetBannerForm} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {activeConfig.hasBrand && (
                                <FormInput placeholder="Brand name" value={bannerForm.brand} onChange={(e) => setBannerForm((prev) => ({ ...prev, brand: e.target.value }))} />
                            )}
                            {activeConfig.hasOffer && (
                                <FormInput placeholder="Offer badge text" value={bannerForm.subtitle} onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))} />
                            )}
                            <FormInput placeholder={activeConfig.hasBrand ? 'Card title (optional)' : 'Title'} value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} />
                            {activeConfig.hasDescription && (
                                <FormInput placeholder="Description" value={bannerForm.subtitle} onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))} textarea />
                            )}
                            {activeConfig.ctaLabel && (
                                <FormInput placeholder={activeConfig.ctaLabel} value={bannerForm.ctaText} onChange={(e) => setBannerForm((prev) => ({ ...prev, ctaText: e.target.value }))} />
                            )}
                            {activeConfig.hasSecondaryCta && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormInput placeholder="Secondary button text" value={bannerForm.secondaryCtaText} onChange={(e) => setBannerForm((prev) => ({ ...prev, secondaryCtaText: e.target.value }))} />
                                    <FormInput placeholder="Secondary URL" value={bannerForm.secondaryHref} onChange={(e) => setBannerForm((prev) => ({ ...prev, secondaryHref: e.target.value }))} />
                                </div>
                            )}
                            {activeConfig.hasPlacement && (
                                <select
                                    value={bannerForm.placementCategory}
                                    onChange={(e) => setBannerForm((prev) => ({ ...prev, placementCategory: e.target.value }))}
                                    className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
                                >
                                    <option value="">Choose category page</option>
                                    {homeCategoryValues.map((category) => (
                                        <option key={category} value={category}>{getCategoryMeta(category).label}</option>
                                    ))}
                                </select>
                            )}
                            {activeConfig.hasTarget && (
                                <TargetSelector label="Click target" form={bannerForm} setForm={setBannerForm} products={products} stores={stores} />
                            )}

                            <BannerImageUploader
                                imageUrl={bannerImagePreview || existingBannerImageUrl}
                                aspect={activeConfig.aspect}
                                label={activeConfig.label}
                                onImageReady={(file, previewUrl) => {
                                    setBannerImageFile(file);
                                    setBannerImagePreview(previewUrl);
                                }}
                            />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">Start date (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={bannerForm.startDate}
                                        onChange={(e) => setBannerForm((prev) => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">End date (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={bannerForm.endDate}
                                        onChange={(e) => setBannerForm((prev) => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={bannerForm.isDraft}
                                    onChange={(e) => setBannerForm((prev) => ({ ...prev, isDraft: e.target.checked }))}
                                />
                                Save as draft (hidden from the storefront regardless of dates)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={bannerForm.showOverlay}
                                    onChange={(e) => setBannerForm((prev) => ({ ...prev, showOverlay: e.target.checked }))}
                                />
                                Show title/CTA text over the image (off by default — banners are pure clickable images)
                            </label>

                            <ActionButton onClick={() => void saveBanner()} disabled={savingContent} variant="primary" className="w-full">
                                {savingContent ? 'Saving...' : (editingBannerId ? 'Update Banner' : 'Add Banner')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Newsletter Section */}
            <SectionCard title="Newsletter Section" description="Edit the heading and button label shown above the newsletter form.">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
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
                    <div className="mx-4 w-full max-w-md rounded-xl bg-white ring-1 ring-gray-100 p-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">Manage Promotion</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{selectedProduct.name}</p>
                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Promotion Type</label>
                                <select value={promotionData.promotionType} onChange={(e) => setPromotionData((prev) => ({ ...prev, promotionType: e.target.value }))} className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200">
                                    <option value="none">None</option>
                                    <option value="flash_deal">Flash Deal</option>
                                    <option value="featured">Featured</option>
                                    <option value="discount">Discount</option>
                                </select>
                            </div>
                            {promotionData.promotionType === 'flash_deal' && (
                                <div className="space-y-4">
                                    {selectedProduct.price <= selectedProduct.offerPrice && (
                                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                                            This product has no discount (price is not higher than the offer price), so it won&apos;t appear as an active flash deal until you lower the offer price below the regular price.
                                        </p>
                                    )}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date (optional)</label>
                                        <input type="datetime-local" value={promotionData.flashDealStartDate} onChange={(e) => setPromotionData((prev) => ({ ...prev, flashDealStartDate: e.target.value }))} className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Flash Deal End Date</label>
                                        <input type="datetime-local" value={promotionData.flashDealEndDate} onChange={(e) => setPromotionData((prev) => ({ ...prev, flashDealEndDate: e.target.value }))} className="w-full rounded-lg bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200" />
                                    </div>
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
