'use client'
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from 'react-hot-toast';
import { getApiErrorMessage, sanitizeApiErrorMessage } from "@/lib/apiErrors";
import { areCartItemsEqual, countCartItems, filterCartItemsByProductIds, normalizeCartItems } from "@/lib/cart";

const PRODUCT_CACHE_KEY = 'kawilmart_products_cache_v2';
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;

const noop = () => {}

const defaultAppContextValue = {
    user: null,
    getToken: async () => null,
    authReady: false,
    accessLoaded: false,
    resolvedRole: null,
    refreshAccessState: async () => ({ success: false, message: 'App context is not ready' }),
    currency: 'UGX ',
    router: null,
    navigate: (href) => {
        if (typeof window !== 'undefined' && href) {
            window.location.assign(href)
        }
    },
    prefetchRoute: noop,
    isRouteLoading: false,
    setIsRouteLoading: noop,
    formatCurrency: (amount) => {
        const numericAmount = Number(amount)
        const safeAmount = Number.isFinite(numericAmount) ? Math.round(numericAmount) : 0
        return `UGX ${safeAmount.toLocaleString('en-UG')}`
    },
    formatCompactCurrency: (amount) => {
        const numericAmount = Number(amount)
        const safeAmount = Number.isFinite(numericAmount) ? Math.round(numericAmount) : 0
        return `UGX ${new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(safeAmount)}`
    },
    isSeller: false,
    setIsSeller: noop,
    isAdmin: false,
    setIsAdmin: noop,
    isRider: false,
    setIsRider: noop,
    userData: false,
    fetchUserData: noop,
    products: [],
    fetchProductData: noop,
    toggleProductLike: async () => ({ success: false, message: 'App context is not ready' }),
    cartItems: {},
    resolvedCartItems: {},
    setCartItems: noop,
    addToCart: async () => ({ success: false, message: 'App context is not ready' }),
    updateCartQuantity: noop,
    getCartCount: () => 0,
    getCartAmount: () => 0,
    unreadNotificationsCount: 0,
    recentNotifications: [],
    setUnreadNotificationsCount: noop,
    refreshUnreadNotifications: async () => 0,
    refreshNotifications: async () => [],
    markNotificationAsRead: async () => ({ success: false, message: 'App context is not ready' }),
    markAllNotificationsAsRead: async () => ({ success: false, message: 'App context is not ready' }),
    loadingProducts: true,
    loadingUser: false,
}

export const AppContext = createContext(defaultAppContextValue);

export const useAppContext = () => {
    return useContext(AppContext);
}

const RouteStateSync = ({ onRouteSettled }) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams.toString()

    useEffect(() => {
        onRouteSettled()
    }, [onRouteSettled, pathname, searchParamsKey])

    return null
}

export const AppContextProvider = (props) => {

    const currency = 'UGX '
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const { user, isLoaded: isUserLoaded } = useUser()
    const { getToken, isLoaded: isAuthLoaded } = useAuth()
    const authReady = isUserLoaded && isAuthLoaded

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isRider, setIsRider] = useState(false)
    const [resolvedRole, setResolvedRole] = useState(null)
    const [accessLoaded, setAccessLoaded] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loadingUser, setLoadingUser] = useState(false)
    const [isRouteLoading, setIsRouteLoading] = useState(false)
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
    const [recentNotifications, setRecentNotifications] = useState([])
    const notificationsRefreshInFlight = useRef(false)
    const normalizedCartItems = normalizeCartItems(cartItems)
    const visibleProductIds = useMemo(
        () => products.map((product) => String(product?._id || "")).filter(Boolean),
        [products]
    )
    const resolvedCartItems = loadingProducts && !products.length
        ? normalizedCartItems
        : filterCartItemsByProductIds(normalizedCartItems, visibleProductIds)

    const persistProductsCache = (nextProducts) => {
        if (typeof window === 'undefined') {
            return
        }

        window.sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            products: nextProducts,
        }))
    }

    const applyRoleAccess = (role) => {
        setResolvedRole(role || null)
        setIsSeller(role === 'seller' || role === 'admin')
        setIsAdmin(role === 'admin')
        setIsRider(role === 'rider' || role === 'admin')
    }

    const hydrateCachedProducts = () => {
        if (typeof window === 'undefined') {
            return false
        }

        try {
            const cached = window.sessionStorage.getItem(PRODUCT_CACHE_KEY)
            if (!cached) {
                return false
            }

            const parsed = JSON.parse(cached)
            if (!parsed?.products || !Array.isArray(parsed.products)) {
                return false
            }

            if (Date.now() - parsed.timestamp > PRODUCT_CACHE_TTL_MS) {
                return false
            }

            startTransition(() => {
                setProducts(parsed.products)
            })
            setLoadingProducts(false)
            return true
        } catch {
            return false
        }
    }

    const fetchProductData = async ({ background = false } = {}) => {
        try {
            if (!background) {
                setLoadingProducts(true)
            }

            let headers = {}

            if (authReady) {
                try {
                    const token = await getToken()
                    headers = token ? { Authorization: `Bearer ${token}` } : {}
                } catch {
                    headers = {}
                }
            }

            const startTime = Date.now()
            const { data } = await axios.get('/api/product/list', { headers, timeout: 15000 })
            const endTime = Date.now()
            console.log(`📦 Products fetched in ${endTime - startTime}ms`)
            if (data.success) {
                startTransition(() => {
                    setProducts(data.products)
                })
                persistProductsCache(data.products)
            } else {
                toast.error(sanitizeApiErrorMessage(data.message))
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error))
        } finally {
            setLoadingProducts(false)
        }
    }

    const fetchUserData = async () => {
        try {
            if (!authReady || !user) {
                return
            }

            setLoadingUser(true)
            setAccessLoaded(false)
            const fallbackRole = user.publicMetadata?.role || null
            applyRoleAccess(fallbackRole)

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const [userResponse, accessResponse] = await Promise.all([
                axios.get('/api/user/data', { headers }),
                axios.get('/api/auth/access', { headers }),
            ])

            if (accessResponse.data?.success) {
                const access = accessResponse.data.access
                applyRoleAccess(access?.role || fallbackRole)
            }

            if (userResponse.data.success) {
                setUserData(userResponse.data.user)
                setCartItems(normalizeCartItems(userResponse.data.user.cartItems))
            } else {
                toast.error(sanitizeApiErrorMessage(userResponse.data.message, "Unable to load account profile"))
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Unable to load account profile"))
        } finally {
            setAccessLoaded(true)
            setLoadingUser(false)
        }
    }

    const refreshNotifications = useCallback(async ({ silent = true, full = false } = {}) => {
        if (notificationsRefreshInFlight.current) {
            return []
        }

        notificationsRefreshInFlight.current = true

        try {
            if (!authReady || !user) {
                setUnreadNotificationsCount(0)
                setRecentNotifications([])
                return []
            }

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const { data } = await axios.get('/api/user/notifications', { headers })

            if (data.success) {
                const nextNotifications = data.notifications || []
                const unreadCount = nextNotifications.filter((notification) => !notification.read).length
                setUnreadNotificationsCount(unreadCount)
                setRecentNotifications(full ? nextNotifications : nextNotifications.slice(0, 4))
                return nextNotifications
            }

            if (!silent) {
                toast.error(sanitizeApiErrorMessage(data.message, "Unable to load notifications"))
            }
            return []
        } catch (error) {
            if (!silent) {
                toast.error(getApiErrorMessage(error, "Unable to load notifications"))
            }
            return []
        } finally {
            notificationsRefreshInFlight.current = false
        }
    }, [authReady, getToken, user])

    const refreshUnreadNotifications = useCallback(async ({ silent = true } = {}) => {
        const notifications = await refreshNotifications({ silent })
        return notifications.filter((notification) => !notification.read).length
    }, [refreshNotifications])

    const markNotificationAsRead = useCallback(async (notificationId) => {
        setRecentNotifications((current) =>
            current.map((notification) =>
                notification._id === notificationId ? { ...notification, read: true } : notification
            )
        );
        setUnreadNotificationsCount((current) => Math.max(0, current - 1));

        try {
            if (!authReady || !user) {
                return { success: false, message: 'Not authenticated' }
            }

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const { data } = await axios.post('/api/user/notifications', { notificationId }, { headers })

            if (data.success) {
                if (typeof data.unreadCount === 'number') {
                    setUnreadNotificationsCount(data.unreadCount)
                    setRecentNotifications((current) =>
                        current.map((notification) =>
                            notification._id === notificationId ? { ...notification, read: true } : notification
                        )
                    )
                } else {
                    void refreshNotifications({ silent: true })
                }
            } else {
                void refreshNotifications({ silent: true })
            }

            return data
        } catch (error) {
            void refreshNotifications({ silent: true })
            return {
                success: false,
                message: error.message,
            }
        }
    }, [authReady, getToken, refreshNotifications, user])

    const markAllNotificationsAsRead = useCallback(async () => {
        setRecentNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
        setUnreadNotificationsCount(0);

        try {
            if (!authReady || !user) {
                return { success: false, message: 'Not authenticated' }
            }

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const { data } = await axios.post('/api/user/notifications', { markAllRead: true }, { headers })

            if (data.success) {
                setUnreadNotificationsCount(0)
                setRecentNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
            } else {
                void refreshNotifications({ silent: true })
            }

            return data
        } catch (error) {
            void refreshNotifications({ silent: true })
            return {
                success: false,
                message: error.message,
            }
        }
    }, [authReady, getToken, refreshNotifications, user])

    const refreshAccessState = useCallback(async () => {
        try {
            if (!authReady || !user) {
                return { success: false, message: 'Not authenticated' }
            }

            setLoadingUser(true)
            setAccessLoaded(false)
            const fallbackRole = user.publicMetadata?.role || null

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const [userResponse, accessResponse] = await Promise.all([
                axios.get('/api/user/data', { headers }),
                axios.get('/api/auth/access', { headers }),
            ])

            if (accessResponse.data?.success) {
                const access = accessResponse.data.access
                applyRoleAccess(access?.role || fallbackRole)
            } else {
                applyRoleAccess(fallbackRole)
            }

            if (userResponse.data?.success) {
                setUserData(userResponse.data.user)
                setCartItems(normalizeCartItems(userResponse.data.user.cartItems))
            }

            return {
                success: true,
                message: 'Access refreshed',
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
            }
        } finally {
            setAccessLoaded(true)
            setLoadingUser(false)
        }
    }, [authReady, getToken, user])

    const toggleProductLike = async (productId) => {
        try {
            if (!authReady || !user) {
                toast.error("Please sign in to like products")
                return { success: false, message: "Not authenticated" }
            }

            const token = await getToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const { data } = await axios.post('/api/product/toggle-like', { productId }, { headers })

            if (data.success) {
                startTransition(() => {
                    setProducts((prevProducts) => {
                        const nextProducts = prevProducts.map((product) =>
                            product._id === productId ? { ...product, ...data.product } : product
                        )
                        persistProductsCache(nextProducts)
                        return nextProducts
                    })
                })
            } else {
                toast.error(data.message)
            }

            return data
        } catch (error) {
            toast.error(error.message)
            return {
                success: false,
                message: error.message,
            }
        }
    }

    const persistCartData = useCallback(async (nextCartData) => {
        const normalizedNextCartData = normalizeCartItems(nextCartData)

        if (!user) {
            return {
                success: true,
                cartItems: normalizedNextCartData,
            }
        }

        const token = await getToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const { data } = await axios.post('/api/cart/update', { cartData: normalizedNextCartData }, {
            headers
        })

        return {
            ...data,
            cartItems: normalizeCartItems(data?.cartItems ?? normalizedNextCartData),
        }
    }, [getToken, user])

    const addToCart = async (itemId) => {
        if (!itemId) {
            return {
                success: false,
                message: "Invalid product",
            }
        }

        if (!loadingProducts && !visibleProductIds.includes(String(itemId))) {
            toast.error("This item is no longer available")
            return {
                success: false,
                message: "Item unavailable",
            }
        }

        const previousCartData = normalizeCartItems(cartItems);
        const cartData = normalizeCartItems({
            ...previousCartData,
            [itemId]: (previousCartData[itemId] || 0) + 1,
        });
        setCartItems(cartData);

        if (user) {
            try {
                const data = await persistCartData(cartData)

                if (!data.success) {
                    setCartItems(previousCartData)
                    toast.error(data.message)
                    return {
                        success: false,
                        message: data.message,
                    }
                }

                const persistedCartItems = data.cartItems || cartData
                setCartItems(persistedCartItems)

                if (!areCartItemsEqual(persistedCartItems, cartData)) {
                    toast.error("That item is no longer available and was removed from your cart")
                    return {
                        success: false,
                        message: data.message || "Item unavailable",
                        cartData: persistedCartItems,
                    }
                }

                toast.success("Item added to cart")
                return { success: true, cartData: persistedCartItems }
            } catch (error) {
                setCartItems(previousCartData)
                toast.error(error.message)
                return {
                    success: false,
                    message: error.message,
                }
            }
        }

        toast.success("Item added to cart")
        return { success: true, cartData }
    }

    const updateCartQuantity = async (itemId, quantity) => {
        const previousCartData = normalizeCartItems(cartItems);
        const cartData = normalizeCartItems({
            ...previousCartData,
            [itemId]: quantity,
        });
        setCartItems(cartData)

        if (user) {
            try {
                const data = await persistCartData(cartData)

                if (!data.success) {
                    setCartItems(previousCartData)
                    toast.error(data.message)
                    return
                }

                setCartItems(data.cartItems || cartData)
                toast.success("Cart Updated")
            } catch (error) {
                setCartItems(previousCartData)
                toast.error(error.message)
            }
        }
    }

    const getCartCount = () => {
        return countCartItems(resolvedCartItems);
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in resolvedCartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && resolvedCartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * resolvedCartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount)
        const safeAmount = Number.isFinite(numericAmount) ? Math.round(numericAmount) : 0
        return `${currency}${safeAmount.toLocaleString('en-UG')}`
    }

    const formatCompactCurrency = (amount) => {
        const numericAmount = Number(amount)
        const safeAmount = Number.isFinite(numericAmount) ? Math.round(numericAmount) : 0
        return `${currency}${new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(safeAmount)}`
    }

    const normalizeHref = (href) => {
        if (!href || typeof href !== 'string') {
            return ''
        }

        if (typeof window === 'undefined') {
            return href
        }

        try {
            const url = new URL(href, window.location.origin)
            return `${url.pathname}${url.search}${url.hash}`
        } catch {
            return href
        }
    }

    const navigate = (href, options = {}) => {
        if (!href) {
            return
        }

        const nextHref = normalizeHref(href)
        const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
        const currentHrefWithHash = typeof window !== 'undefined' ? `${currentHref}${window.location.hash || ''}` : currentHref

        if (nextHref === currentHref || nextHref === currentHrefWithHash) {
            setIsRouteLoading(false)
            return
        }

        const { scroll = true } = options
        setIsRouteLoading(true)

        router.push(nextHref, { scroll })
    }

    const prefetchRoute = useCallback((href) => {
        if (!href) {
            return
        }

        try {
            router.prefetch(normalizeHref(href))
        } catch {
            // Prefetch is best-effort.
        }
    }, [router])

    const handleRouteSettled = useCallback(() => {
        setIsRouteLoading(false)
    }, [])

    useEffect(() => {
        const hydrated = hydrateCachedProducts()
        fetchProductData({ background: hydrated })
        // Initial product hydration only runs once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!authReady) {
            return
        }

        fetchProductData({ background: true })
        // Refresh product data when auth identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user?.id])

    useEffect(() => {
        if (!authReady) {
            return
        }

        if (user) {
            fetchUserData();
            refreshUnreadNotifications({ silent: true });
        } else {
            setUserData(false);
            setCartItems({});
            setUnreadNotificationsCount(0);
            applyRoleAccess(null);
            setAccessLoaded(true);
            setLoadingUser(false);
        }
        // User/account hydration is intentionally keyed to auth state changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user])

    useEffect(() => {
        if (!authReady || !user) {
            setUnreadNotificationsCount(0)
            setRecentNotifications([])
            return undefined
        }

        let intervalId
        let focused = true

        const syncNow = () => {
            if (focused) {
                void refreshNotifications({ silent: true })
            }
        }

        syncNow()

        intervalId = window.setInterval(syncNow, 8000)

        const handleVisibilityChange = () => {
            focused = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
            if (focused) {
                syncNow()
            }
        }

        window.addEventListener('focus', syncNow)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId)
            }
            window.removeEventListener('focus', syncNow)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [authReady, refreshNotifications, user])

    useEffect(() => {
        if (loadingProducts) {
            return
        }

        const filteredCartItems = filterCartItemsByProductIds(normalizeCartItems(cartItems), visibleProductIds)

        if (areCartItemsEqual(cartItems, filteredCartItems)) {
            return
        }

        let cancelled = false
        setCartItems(filteredCartItems)

        if (!user) {
            return () => {
                cancelled = true
            }
        }

        void (async () => {
            try {
                const data = await persistCartData(filteredCartItems)
                if (!cancelled && data?.success && !areCartItemsEqual(filteredCartItems, data.cartItems)) {
                    setCartItems(data.cartItems)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to sync cart cleanup:', error)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [cartItems, loadingProducts, persistCartData, user, visibleProductIds])

    const value = {
        user, getToken,
        authReady,
        accessLoaded,
        resolvedRole,
        refreshAccessState,
        currency, router,
        navigate, prefetchRoute,
        isRouteLoading, setIsRouteLoading,
        formatCurrency, formatCompactCurrency,
        isSeller, setIsSeller,
        isAdmin, setIsAdmin,
        isRider, setIsRider,
        userData, fetchUserData,
        products, fetchProductData,
        toggleProductLike,
        cartItems, resolvedCartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount,
        unreadNotificationsCount, recentNotifications, setUnreadNotificationsCount,
        refreshUnreadNotifications, refreshNotifications, markNotificationAsRead, markAllNotificationsAsRead,
        loadingProducts, loadingUser
    }

    return (
        <AppContext.Provider value={value}>
            <Suspense fallback={null}>
                <RouteStateSync onRouteSettled={handleRouteSettled} />
            </Suspense>
            {props.children}
        </AppContext.Provider>
    )
}
