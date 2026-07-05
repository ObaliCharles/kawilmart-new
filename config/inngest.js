import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import { generateSellerInvoicesForPeriod } from "@/lib/sellerInvoiceGeneration";

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
