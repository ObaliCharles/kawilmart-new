import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Suspense } from 'react';
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import RouteLoader from "@/components/RouteLoader";

export const metadata = {
  title: "KawilMart | Northern Uganda's Trusted Online Store",
  description: "Shop fashion, beauty, electronics, home essentials, and more with KawilMart",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-700" >
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/"
        >
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#3b82f6',
                },
              },
            }}
          />
          <Suspense fallback={null}>
            <AppContextProvider>
              <RouteLoader />
              {children}
            </AppContextProvider>
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
