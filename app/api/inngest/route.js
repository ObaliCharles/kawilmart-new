import { serve } from "inngest/next";
import {
  createMonthlySellerInvoices,
  createUserOrder,
  expireFlashDeals,
  inngest,
  syncBannerStatuses,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
} from "@/config/inngest";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    createUserOrder,
    createMonthlySellerInvoices,
    syncBannerStatuses,
    expireFlashDeals,
  ],
});
