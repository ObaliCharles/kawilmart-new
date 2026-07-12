# 🏪 KawilMart — Complete Codebase Guide

## 📋 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Project Structure](#2-project-structure)
3. [App Pages (Frontend Routes)](#3-app-pages-frontend-routes)
4. [Components](#4-components)
5. [Backend / API Routes](#5-backend--api-routes)
6. [Models (Database Schemas)](#6-models-database-schemas)
7. [Utility Libraries](#7-utility-libraries)
8. [Configuration Files](#8-configuration-files)
9. [Assets & Media](#9-assets--media)
10. [Styling Guide](#10-styling-guide)
11. [How to Control Everything](#11-how-to-control-everything)

---

## 1. Overview & Architecture

**Framework:** Next.js 15 (App Router) with React 19
**Styling:** Tailwind CSS 3
**Auth:** Clerk (@clerk/nextjs)
**Database:** MongoDB via Mongoose
**State Management:** React Context (AppContext)
**Background Jobs:** Inngest
**UI Notifications:** react-hot-toast
**SMS:** Africa's Talking (africastalking)
**Image Hosting:** Cloudinary
**Email:** Nodemailer / SMTP

### Data Flow
```
Browser → Clerk Auth → Next.js App Router → API Routes (app/api/) → Mongoose → MongoDB
                                                      ↕
                                            Inngest (background jobs)
```

---

## 2. Project Structure

```
KawilMart-main/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.js           # Root layout (Clerk, AppContext, Toaster)
│   ├── page.jsx            # Home page
│   ├── globals.css         # Global styles & Tailwind
│   ├── loading.js          # Loading state
│   ├── about/              # About Us page
│   ├── add-address/        # Add delivery address page
│   ├── admin/              # Admin dashboard (protected)
│   ├── all-products/       # All products + filtering/search
│   ├── api/                # Backend API routes
│   ├── cart/               # Shopping cart page
│   ├── categories/         # Category browsing page
│   ├── dashboard/          # User dashboard
│   ├── inbox/              # Messages/inbox
│   ├── legal/              # Legal pages (privacy, terms)
│   ├── my-orders/          # User's orders
│   ├── notifications/      # Notifications page
│   ├── order-placed/       # Order success page
│   ├── product/            # Single product detail pages
│   ├── seller/             # Seller dashboard (protected)
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   └── store/              # Store front
├── components/             # Reusable React components
│   ├── admin/              # Admin-specific components
│   ├── dashboard/          # Dashboard components
│   ├── legal/              # Legal page components
│   ├── seller/             # Seller-specific components
│   ├── Banner.jsx          # Homepage banner/slider
│   ├── Footer.jsx          # Site footer
│   ├── MegaStoreHome.jsx   # Main homepage content
│   ├── Navbar.jsx          # Top navigation bar
│   ├── ProductCard.jsx     # Product card component
│   └── ...
├── lib/                    # Utility/backend library code
├── models/                 # Mongoose database models
├── config/                 # Database & app config
├── context/                # React Context providers
│   └── AppContext.jsx      # GLOBAL STATE - THE HEART
├── assets/                 # Images, SVGs, static data
├── middleware.ts           # Clerk auth middleware + role protection
├── tailwind.config.mjs     # Tailwind configuration
├── next.config.mjs         # Next.js configuration
└── package.json            # Dependencies & scripts
```

---

## 3. App Pages (Frontend Routes)

### 📍 `/` — Home Page
**File: `app/page.jsx`**
- Server component
- Fetches `siteContent` (from MongoDB SiteContent) and `initialProducts` (from API)
- Renders: `Navbar` → `MegaStoreHome` → `Footer`
- Control styling in `components/MegaStoreHome.jsx`

### 📍 `/all-products` — All Products / Search / Filter
**File: `app/all-products/page.jsx`** (1663 lines)
- **CLIENT COMPONENT** (has `'use client'`)
- **Full filtering system**: Category, Price Range, Brand, Condition, Rating, Search
- **Sort options**: Best Match, Price (asc/desc), Newest, Discount, Rating, Popular
- **Pagination**: 24 products per page
- **Mobile-first UI** with dedicated mobile cards
- **Supermarket mode** when category is "Home & Living"
- URL query params supported: `?category=`, `?search=`, `?seller=`, `?brand=`, `?filter=`, `?sort=`

### 📍 `/cart` — Shopping Cart
**File: `app/cart/page.jsx`**
- Displays cart items
- Manages quantities, totals

### 📍 `/product/[id]` — Product Details
**File: `app/product/`**
- Dynamic route for individual products
- Shows full product details, images, pricing

### 📍 `/categories` — Category Browser
**File: `app/categories/`**
- Browse products by category

### 📍 `/sign-in`, `/sign-up` — Auth Pages
- Clerk-hosted authentication pages

### 📍 `/dashboard` — User Dashboard
- User profile, settings, account management

### 📍 `/my-orders` — Order History
- View past orders, order status

### 📍 `/admin` — Admin Dashboard
**Protected** — requires `admin` role
- Manage products, users, orders, promotions, analytics, billing

### 📍 `/seller` — Seller Dashboard
**Protected** — requires `seller` role
- Manage seller products, inventory, orders

### 📍 `/add-address` — Add Delivery Address
- Address form for user's shipping address

### 📍 `/notifications` — Notification Center
- View all notifications

### 📍 `/inbox` — Messages / Support
- Customer support chat/messages

### 📍 `/order-placed` — Order Success
- Shown after successfully placing an order

### 📍 `/about` — About Us
- Company info page

### 📍 `/legal` — Legal Pages
- Privacy Policy, Terms of Service, etc.

### 📍 `/store` — Store Front
- Vendor/store-specific page

---

## 4. Components

### 🧩 `components/Navbar.jsx`
- **Top navigation bar** — visible on most pages
- Contains: logo, search bar, categories dropdown, cart icon, user menu
- **Styling**: Tailwind classes inside this file
- To change: edit the JSX in this file

### 🧩 `components/MegaStoreHome.jsx`
- **Main homepage content** — the large component rendered on `/`
- Contains featured products, banners, flash deals, category sections
- **This is where you change homepage layout/design**

### 🧩 `components/Footer.jsx`
- **Site footer** — links, social media, newsletter signup

### 🧩 `components/ProductCard.jsx`
- **Reusable product card** used across the site
- Shows: image, name, price (original + offer), rating, discount badge, "Add to Cart" button

### 🧩 `components/Banner.jsx`
- **Homepage hero banner / slider**
- Controls the big promotional banner images

### 🧩 `components/RouteShell.jsx`
- **Page wrapper** — wraps all page content
- Provides layout structure, page transitions

### 🧩 `components/RouteLoader.jsx`
- **Loading bar** shown during page transitions

### 🧩 `components/PageSkeletons.jsx`
- **Skeleton/shimmer loading states** for pages
- Shows loading placeholders while data loads

### 🧩 `components/FlashDeals.jsx`
- **Flash deal countdown timer** section

### 🧩 `components/FeaturedProduct.jsx`
- Featured product display component

### 🧩 `components/HomeProducts.jsx`
- Homepage product listing section

### 🧩 `components/HomeOfferCollections.jsx`
- Special offer/collection displays on homepage

### 🧩 `components/MarketplacePulse.jsx`
- Marketplace activity stats section

### 🧩 `components/CategoryBrowserPage.jsx`
- Category browsing UI

### 🧩 `components/HeaderSlider.jsx`
- Header image slider/carousel

### 🧩 `components/NewsLetter.jsx`
- Newsletter subscription form

### 🧩 `components/OrderSummary.jsx`
- Order summary display (used in checkout)

### 🧩 `components/Loading.jsx`
- Generic loading spinner

### 🧩 Admin Components (`components/admin/`)
- Admin-specific UI components

### 🧩 Seller Components (`components/seller/`)
- Seller-specific UI components

### 🧩 Dashboard Components (`components/dashboard/`)
- User dashboard UI components

---

## 5. Backend / API Routes

All API routes live in **`app/api/`** and follow Next.js App Router convention.

| Route | Method | Purpose |
|-------|--------|---------|
| `api/product/list` | GET | List all products |
| `api/product/add` | POST | Add new product |
| `api/product/update` | PUT | Update product |
| `api/product/delete` | DELETE | Delete product |
| `api/product/toggle-like` | POST | Like/unlike a product |
| `api/product/seller-list` | GET | List seller's products |
| `api/product/seller-item` | GET | Get seller's specific product |
| `api/cart/update` | POST | Update cart items |
| `api/user/data` | GET | Get user profile data |
| `api/user/notifications` | GET/POST | Get/mark notifications |
| `api/auth/access` | GET | Check user access/role |
| `api/order/...` | Various | Order management |
| `api/admin/...` | Various | Admin operations |
| `api/rider/...` | Various | Rider operations |

---

## 6. Models (Database Schemas)

### 📦 `models/Product.js`
- `name`, `description`, `category`, `price`, `offerPrice`
- `image` (array of URLs), `stock`
- `userId` (seller reference), `sellerProfile`, `sellerLocation`
- `rating`, `ratingSummary`, `reviews`
- `date`, `likesCount`, `features`

### 👤 `models/User.js`
- `clerkId`, `email`, `name`, `image`
- `role` (user/seller/admin/rider)
- `cartItems`, `addresses`
- `wishlist`

### 📋 `models/Order.js`
- `userId`, `items`, `address`, `totalAmount`
- `status` (pending/confirmed/shipped/delivered/cancelled)
- `paymentMethod`, `paymentStatus`
- `tracking`, `riderId`

### 📄 `models/SiteContent.js`
- Homepage content sections, banners, featured products
- Site-wide settings

### 💰 `models/BillingInvoice.js`
- Invoice records for seller/admin billing

### 📧 `models/NewsletterSubscriber.js`
- Email newsletter subscribers

### 📝 `models/VendorApplication.js`
- Seller/vendor application forms

### 🏠 `models/Address.js`
- User delivery addresses

---

## 7. Utility Libraries (`lib/`)

| File | Purpose |
|------|---------|
| `lib/cart.js` | Cart item normalization, counting, filtering |
| `lib/marketplaceCategories.js` | Category matching, metadata |
| `lib/categoryExperiences.js` | Category experience/tile system |
| `lib/liveCommerce.js` | Product activity snapshots (new, sale, flash) |
| `lib/productStock.js` | Stock management |
| `lib/productRating.js` | Rating calculations |
| `lib/orderLifecycle.js` | Order state machine |
| `lib/orderWorkflow.js` | Order processing workflow |
| `lib/orderTracking.js` | Order tracking updates |
| `lib/orderRisk.js` | Order risk/fraud assessment |
| `lib/orderSerialization.js` | Order data serialization |
| `lib/orderUi.js` | Order UI helpers |
| `lib/authAdmin.js` | Admin auth verification |
| `lib/authSeller.js` | Seller auth verification |
| `lib/authRider.js` | Rider auth verification |
| `lib/userRoleCache.js` | User role caching |
| `lib/clerkUserSync.js` | Sync Clerk users to MongoDB |
| `lib/requestAuth.js` | Auth helper for API routes |
| `lib/apiErrors.js` | Standardized API error handling |
| `lib/email.js` | Email sending (Nodemailer) |
| `lib/sms.js` | SMS sending (Africa's Talking) |
| `lib/notifyUsers.js` | User notification system |
| `lib/accountNotifications.js` | Account-related notifications |
| `lib/supportChat.js` | Support chat system |
| `lib/getSiteContent.js` | Fetch site content from DB |
| `lib/getStorefrontProducts.js` | Fetch products for storefront |
| `lib/defaultSiteContent.js` | Default site content fallback |
| `lib/sellerBilling.js` | Seller billing logic |
| `lib/sellerInvoiceGeneration.js` | Invoice generation |
| `lib/sellerReviews.js` | Seller review management |
| `lib/adminBilling.js` | Admin billing logic |
| `lib/billingInvoices.js` | Invoice management |
| `lib/billingDocuments.js` | Billing document handling |
| `lib/clientDownloads.js` | Client file downloads |
| `lib/serverCart.js` | Server-side cart operations |
| `lib/ugandaLocations.js` | Uganda location data |

---

## 8. Configuration Files

### ⚙️ `next.config.mjs`
- Image domains: Cloudinary, GitHub, Clerk
- Security headers (CSP, XSS protection)
- ESLint rules (ignores during builds)

### ⚙️ `tailwind.config.mjs`
- Custom grid: `grid-cols-auto`
- Custom animations: `page-enter`, `fade-in`, `scale-in`
- Custom easing: `snappy`, `smooth`

### ⚙️ `postcss.config.mjs`
- Tailwind + autoprefixer

### ⚙️ `middleware.ts`
- **Clerk authentication middleware**
- Route protection for: `/admin/*`, `/seller/*`, `/dashboard/rider/*`
- API route protection for admin/seller/rider endpoints
- Role-based access control

### ⚙️ `package.json`
- **Scripts:**
  - `npm run dev` — Start dev server
  - `npm run dev:turbo` — Start with Turbopack
  - `npm run build` — Production build
  - `npm start` — Start production server
  - `npm run lint` — Run ESLint

### ⚙️ `config/db.js`
- **MongoDB connection** via Mongoose

### ⚙️ `config/inngest.js`
- **Inngest client** for background jobs

### ⚙️ `config/toastConfig.js`
- Toast notification configuration

---

## 9. Assets & Media (`assets/`)

### 🖼️ Images (PNG)
- Product images: `apple_earphone_image.png`, `asus_laptop_image.png`, `bose_headphone_image.png`, etc.
- Hero images: `header_headphone_image.png`, `header_macbook_image.png`, `header_playstation_image.png`
- People images: `boy_with_laptop_image.png`, `girl_with_earphone_image.png`
- Category images: `playstation_image.png`, `macbook_image.png`, `projector_image.png`, etc.

### 🎨 SVGs & Icons
- Navigation: `menu_icon.svg`, `search_icon.svg`, `cart_icon.svg`, `heart_icon.svg`
- Social: `facebook_icon.svg`, `instagram_icon.svg`, `twitter_icon.svg`
- UI: `star_icon.svg`, `star_dull_icon.svg`, `arrow_icon.svg`, `checkmark.png`
- Admin: `order_icon.svg`, `box_icon.svg`, `redirect_icon.svg`, `user_icon.svg`, `product_list_icon.svg`

### 📦 Data
- **`assets/productData.js`** — Static product data (may be fallback)
- **`assets/assets.js`** — Asset index/export file

---

## 10. Styling Guide

### Where to Change Styling

| What to Change | Where |
|----------------|-------|
| **Global styles** (body, scrollbars, animations) | `app/globals.css` |
| **Tailwind theme** (colors, animations, grids) | `tailwind.config.mjs` |
| **Navbar appearance** | `components/Navbar.jsx` |
| **Footer appearance** | `components/Footer.jsx` |
| **Product card look** | `components/ProductCard.jsx` |
| **Homepage layout** | `components/MegaStoreHome.jsx` |
| **All Products page** | `app/all-products/page.jsx` |
| **Cart page** | `app/cart/page.jsx` |
| **Admin panel** | `app/admin/` pages |
| **Banner/slider** | `components/Banner.jsx` |
| **Button interactions** | `app/globals.css` (base layer + utilities) |
| **Loading skeletons** | `components/PageSkeletons.jsx` |
| **Page transitions** | `components/RouteShell.jsx`, `globals.css` |
| **Category pages** | `components/CategoryBrowserPage.jsx` |

### Tailwind Color Palette Used
- **Primary/Accent:** Orange (`orange-50` to `orange-600`)
- **Text:** Gray (`gray-50` to `gray-950`)
- **Backgrounds:** White, `#f8fafc` (body)
- **Success:** Green (`#10b981`)
- **Error:** Red (`#ef4444`)
- **Info:** Blue (`#3b82f6`)

### Key CSS Classes Used
- `page-enter` — Page entrance animation
- `interactive-lift` — Hover lift effect on cards
- `skeleton-shimmer` — Loading shimmer effect
- `pattern-category-sketch` — Decorative category background
- `animate-fade-in`, `animate-slide-up` — Entrance animations
- `filter-scroll` — Custom scrollbar for filter panels

---

## 11. How to Control Everything

### 🎯 Frontend Control

#### Change Homepage Content
Edit `components/MegaStoreHome.jsx` — this is the main landing page. You can:
- Reorder sections
- Change banners, featured products
- Add/remove sections

#### Change All Products Page
Edit `app/all-products/page.jsx` — controls:
- Filter options (categories, price ranges, brands)
- Sort options
- Search behavior
- Grid layout (desktop: 4 columns, mobile: 2 columns)
- Mobile-specific product cards

#### Change Product Cards
Edit `components/ProductCard.jsx`:
- Image size, text styles, button placement
- Discount badge appearance
- Rating star display

#### Change Any Page
Each page in `app/` folder corresponds to its route:
- Edit the `.jsx` file directly
- Add/remove sections
- Change layout, colors, spacing using Tailwind classes

### 🎯 Styling Control

#### Quick Color Changes
1. **Global**: Edit `app/globals.css` body tag (line 124-128)
2. **Tailwind config**: Edit `tailwind.config.mjs` `colors` section (line 10-13)
3. **Per component**: Find the Tailwind classes in each `.jsx` file

#### Change Animations
- **Page enter**: `globals.css` `@keyframes page-enter` (line 22-31)
- **Loading shimmer**: `globals.css` `@keyframes skeleton-shimmer` (line 13-20)
- **Tailwind animations**: `tailwind.config.mjs` `animation` section (line 33-36)

### 🎯 Backend Control

#### Change Database Connection
Edit `config/db.js` — MongoDB connection string

#### Add New API Endpoint
Create a new folder in `app/api/` with a `route.js` file:
```
app/api/your-endpoint/route.js
```

#### Change Database Models
Edit files in `models/` — each file is a Mongoose schema

### 🎯 Auth Control

#### Change Protected Routes
Edit `middleware.ts` — add/remove route patterns from matchers

#### Change User Roles
Edit `middleware.ts` lines 28-36 — role checking logic

### 🎯 Running the Project

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

### 🎯 Environment Variables (`.env.example`)
```
MONGODB_URI=           # MongoDB connection
CLERK_SECRET_KEY=      # Clerk backend key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk frontend key
CLOUDINARY_CLOUD_NAME= # Cloudinary
CLOUDINARY_API_KEY=    # Cloudinary
CLOUDINARY_API_SECRET= # Cloudinary
INNGEST_EVENT_KEY=     # Inngest
AFRICASTALKING_API_KEY= # Africa's Talking SMS
SMTP_*                 # Email config
```

---

## Quick Reference: Where to Find Things

| I want to change... | Look in... |
|---------------------|------------|
| The main layout | `app/layout.js` |
| Homepage content | `components/MegaStoreHome.jsx` |
| Navigation bar | `components/Navbar.jsx` |
| Footer | `components/Footer.jsx` |
| Product listing | `app/all-products/page.jsx` |
| Product card design | `components/ProductCard.jsx` |
| Cart functionality | `app/cart/page.jsx` + `context/AppContext.jsx` |
| Product details page | `app/product/[id]/page.jsx` |
| Admin panel | `app/admin/` |
| User dashboard | `app/dashboard/` |
| Seller panel | `app/seller/` |
| Global state | `context/AppContext.jsx` |
| Database models | `models/` |
| API endpoints | `app/api/` |
| Utility functions | `lib/` |
| Assets/images | `assets/` |
| Global CSS | `app/globals.css` |
| Tailwind config | `tailwind.config.mjs` |
| Next.js config | `next.config.mjs` |
| Auth & middleware | `middleware.ts` |
| Database connection | `config/db.js` |