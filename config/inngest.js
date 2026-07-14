import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Banner from "@/models/Banner";
import Product from "@/models/Product";
import { generateSellerInvoicesForPeriod } from "@/lib/sellerInvoiceGeneration";
import { computeBannerLifecycleStatus } from "@/lib/bannerStatus";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "kawilmart-next" });

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
  },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data 
    const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: first_name + ' ' + last_name,
        imageUrl:image_url
    }
    await connectDB()
    await User.create(userData)
  }
);


//inngest function to update user data in database
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    { event: 'clerk/user.updated' },
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data 
    const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: first_name + ' ' + last_name,
        imageUrl:image_url
    } 
    await connectDB()
    await User.findByIdAndUpdate(id, userData)
    }

)

//inngest Function to delete User from the database
export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk'
    },
    { event: 'clerk/user.deleted' },
    async ({event}) => {
        const {id} = event.data

        await connectDB()
        await User.findByIdAndDelete(id)
    }
)

//Inngest function to create user's order in Database
export const createUserOrder = inngest.createFunction(
    {
        id:'create-user-order',
        batchEvents: {
            maxSize: 5,
            timeout: '5s'
        }
    },
    {event: 'order/created'},
    async ({events}) => {
        await connectDB()
        return {
            success: true,
            processed: events.length,
            orderIds: events.map((event) => event.data.orderId),
        };

    }
)

export const createMonthlySellerInvoices = inngest.createFunction(
    {
        id: "create-monthly-seller-invoices",
    },
    { cron: "0 3 1 * *" },
    async () => {
        const generation = await generateSellerInvoicesForPeriod({
            generatedBy: "system",
            sendNotifications: true,
            now: new Date(),
        });

        return {
            success: true,
            periodKey: generation.periodKey,
            createdCount: generation.createdCount,
            updatedCount: generation.updatedCount,
            skippedCount: generation.skippedCount,
        };
    }
);

// Keeps the stored `status` field on Banner documents in sync with their
// computed lifecycle (scheduled/active/expired) so the admin list reflects
// reality without recomputation. Not load-bearing for correctness — public
// reads always recompute status at request time — this just keeps the
// admin UI's stored badge fresh between edits.
export const syncBannerStatuses = inngest.createFunction(
    {
        id: "sync-banner-statuses",
    },
    { cron: "*/15 * * * *" },
    async () => {
        await connectDB();

        const banners = await Banner.find({ status: { $ne: "draft" } });
        const now = new Date();
        let updatedCount = 0;

        for (const banner of banners) {
            const nextStatus = computeBannerLifecycleStatus(banner, now);
            if (nextStatus !== banner.status && nextStatus !== "draft") {
                banner.status = nextStatus;
                await banner.save();
                updatedCount += 1;
            }
        }

        return { success: true, checked: banners.length, updatedCount };
    }
);

// Flips isFlashDeal/promotionType back off on Product documents whose flash
// deal has passed its end date. The client already computes flash-deal
// activity live from the dates (lib/liveCommerce.js getFlashDealSnapshot),
// so shoppers never see an expired deal — this cron just makes the stored
// record match reality for anything reading the raw field directly (admin
// list, other future consumers) and keeps expired flags from lingering
// forever.
export const expireFlashDeals = inngest.createFunction(
    {
        id: "expire-flash-deals",
    },
    { cron: "*/5 * * * *" },
    async () => {
        await connectDB();

        const result = await Product.updateMany(
            { isFlashDeal: true, flashDealEndDate: { $lte: new Date() } },
            { $set: { isFlashDeal: false, promotionType: "none" } }
        );

        return { success: true, expiredCount: result.modifiedCount || 0 };
    }
);
