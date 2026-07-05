# KawilMart — New Features Setup Guide

## ✅ What Was Added

### 1. Homepage Enhancements
- **ShopByCategory** — 8 category tiles with emoji icons, click-to-filter navigation
- **FlashDeals** — Live countdown timer, discount badges, "% claimed" bars, auto-pulls most-discounted products

### 2. All Products Page (`/all-products`)
- **Category sidebar filter** — All, Earphone, Headphone, Watch, Smartphone, Laptop, Camera, Accessories
- **Price range filter** — 6 tiers in UGX
- **Sort options** — Price low/high, Newest, Best Discount
- **Inline search box**
- **Active filter tags** with × removal
- **Mobile filter drawer**
- Reads URL params `?category=X` and `?filter=flash`

### 3. ProductCard Upgrades
- **Shop location** (📍 Kampala, UG etc.) displayed on every card
- **Discount % badge** on product images
- **"Add to Cart" button fixed** — now actually calls addToCart() properly
- **Strikethrough original price** when on sale

### 4. Navbar Upgrades
- **Inline search bar** on desktop
- **Role-based nav links**: Admin users see 🛡️ Admin button, Riders see 🛵 Deliveries
- ⚡ Deals shortcut link

### 5. Admin Dashboard (`/admin`)
- **Stats Overview**: Revenue, Orders, Products, Users
- **7-Day Revenue Bar Chart**
- **Order Status Breakdown**
- **Category Distribution**
- **Recent Orders table**
- **All Orders** (`/admin/orders`) — Full order table with live status update dropdown
- **Users & Roles** (`/admin/users`) — View all users, change roles (buyer/seller/rider/admin)
- **Products** (`/admin/products`) — Browse all products, filter by category
- **Analytics** (`/admin/analytics`) — KPIs, charts, category breakdown

### 6. Rider Dashboard (`/dashboard/rider`)
- **Active/Completed tabs** with counts
- **Stats**: Active deliveries, delivered count, total assigned, estimated earnings
- **Expandable delivery cards** with:
  - Step-by-step progress tracker (Placed → Processing → Shipped → Out for Delivery → Delivered)
  - Item list with product images
  - Full delivery address + phone
  - Commission estimate (5%)
  - **"Mark Out for Delivery"** and **"Mark Delivered"** action buttons

---

## 🔐 How to Set User Roles

Roles are managed via **Clerk's Public Metadata**.

### Method 1: Clerk Dashboard (Manual)
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **Users** in the left sidebar
3. Find the user you want to promote
4. Click on their name
5. Scroll to **Public Metadata**
6. Click **Edit** and enter:

```json
{ "role": "admin" }
```

Valid roles: `buyer` | `seller` | `rider` | `admin`

### Method 2: Via Admin Panel (Easiest)
Once you have at least one admin set via Method 1:
1. Log in as that admin
2. Go to `/admin/users`
3. Find any user and use the **Change Role** dropdown
4. The change takes effect on their next login

---

## 🛡️ Route Protection

The middleware now automatically protects:
- `/admin/**` — Requires `role: admin`
- `/dashboard/rider/**` — Requires `role: rider` or `admin`
- Non-admins/riders are redirected to `/`

---

## 📁 New Files Added

```
components/
  FlashDeals.jsx          ← Flash deals section with countdown
  ShopByCategory.jsx      ← Category grid for homepage

app/
  admin/
    layout.jsx            ← Admin layout with sidebar
    page.jsx              ← Main dashboard (stats + charts)
    orders/page.jsx       ← All orders + status management
    products/page.jsx     ← All products view
    users/page.jsx        ← User management + role assignment
    analytics/page.jsx    ← Full analytics page
  dashboard/
    rider/page.jsx        ← Rider delivery management

app/api/
  admin/
    stats/route.js        ← GET: platform stats
    users/route.js        ← GET: all users, POST: update role
    orders/route.js       ← GET: all orders, PUT: update status
  rider/
    deliveries/route.js   ← GET: assigned deliveries, PUT: update status

lib/
  authAdmin.js            ← Admin role verification helper
  authRider.js            ← Rider role verification helper
```

## 📝 Modified Files

```
context/AppContext.jsx    ← Added isAdmin, isRider states + role detection
components/Navbar.jsx     ← Added search bar + role-based nav buttons
components/ProductCard.jsx← Added location, discount badge, fixed buttons
components/seller/Sidebar.jsx ← Added Admin Panel link for admins
app/page.jsx              ← Added ShopByCategory + FlashDeals
app/all-products/page.jsx ← Complete rewrite with filters
middleware.ts             ← Added route protection for admin/rider
```

## 📧 Email Notification Setup

The app now supports sending notification emails for:
- Order placed
- Seller order received
- Rider assigned
- Customer delivery status updates
- Admin messages

To enable outgoing emails, add these environment variables:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=KawilMart <notifications@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
APP_BASE_URL=https://yourdomain.com
```

Notes:
- `EMAIL_PROVIDER` currently supports `resend`
- `APP_BASE_URL` is used to generate links inside notification emails
- If the email keys are missing, in-app notifications still work and email delivery is skipped safely

---

## ⚠️ Notes

- **Shop location on ProductCard** is currently deterministic from product ID.  
  To show real seller locations, add a `location` field to the `User` model and the seller's profile page.

- **Flash Deals** auto-detects products where `price > offerPrice`. Make sure sellers set both fields when adding products.

- **Rider commission** is shown as 5% of order amount — adjust in `app/dashboard/rider/page.jsx` line with `* 0.05`.
