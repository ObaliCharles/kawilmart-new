# KawilMart

KawilMart is a full-stack **Next.js marketplace platform** built for Northern Uganda. It supports buyers, sellers, riders, and admins with product management, order operations, billing workflows, notifications, and support chat.

---

## Features

- Multi-role marketplace flows for buyers, sellers, riders, and admins
- Clerk authentication with role-aware route protection
- MongoDB models and API routes for products, orders, billing, notifications, and support
- Cloudinary uploads, Inngest background jobs, email and SMS notifications
- Cash on Delivery (`COD`) checkout flow

---

## Getting Started

1. Clone the repo

    ```bash
    git clone https://github.com/ObaliCharles/KawilMart.git
    cd KawilMart
    ```

2. Copy the environment template and fill in your real keys

    ```bash
    cp .env.example .env.local
    ```

    You can also use `.env` if that matches your local workflow.

3. Install dependencies

    ```bash
    npm install
    ```

4. Run locally

    ```bash
    npm run dev
    ```

5. Verify local health

    Open `http://localhost:3000/api/health` to confirm the app can reach MongoDB.

---

## Environment Notes

- `MONGODB_URI` is required. If your URI does not include a database name, the app uses `MONGODB_DB_NAME`, which currently defaults to `test` for backward compatibility.
- `EMAIL_ENABLED=false` keeps email notifications safely disabled while preserving in-app notifications.
- The active payment flow is `COD`, so no payment gateway keys are required right now.
- `ENABLE_SELF_ADMIN_BOOTSTRAP` is a dev-only escape hatch and should stay `false` for staging and production.

## Admin Setup

- Seed your first admin in the Clerk dashboard by setting `publicMetadata.role` to `admin`.
- After that, use the in-app admin management tools for ongoing role changes.
- Do not rely on self-promotion routes in production.

## Main Services

- Clerk for authentication and role metadata
- MongoDB with Mongoose for application data
- Cloudinary for uploads
- Inngest for background jobs
- Resend for email notifications
- Africa's Talking for SMS notifications

## Contributing

We welcome improvements across product, operations, and UX. Useful contribution areas include:

- Create new pages
- Harden API routes and validation
- Improve layouts and responsiveness
- Refactor large components
- Add tests and monitoring
- Introduce accessibility improvements
- Improve documentation

---

## License

This project is licensed under the **dancecode License**.

---

## 🌟 Contributors

Thanks to everyone who contributes to **KawilMart**.
