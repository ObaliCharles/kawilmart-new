import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Suspense } from 'react';
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import RouteLoader from "@/components/RouteLoader";
import RouteShell from "@/components/RouteShell";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://wilwa.ug";
const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${normalizedSiteUrl}/#organization`,
      name: "Wilwa",
      url: normalizedSiteUrl,
      logo: `${normalizedSiteUrl}/wilwa-email-logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${normalizedSiteUrl}/#website`,
      url: normalizedSiteUrl,
      name: "Wilwa",
      publisher: { "@id": `${normalizedSiteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${normalizedSiteUrl}/all-products?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Wilwa | Northern Uganda's Trusted Online Store",
  description: "Shop fashion, beauty, electronics, home essentials, and more from trusted local sellers on Wilwa, Uganda's online marketplace.",
  applicationName: "Wilwa",
  keywords: ["online shopping Uganda", "Northern Uganda marketplace", "buy online Uganda", "Wilwa", "Uganda ecommerce"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: "/",
    siteName: "Wilwa",
    title: "Wilwa | Northern Uganda's Trusted Online Store",
    description: "Shop fashion, beauty, electronics, home essentials, and more from trusted local sellers on Wilwa.",
  },
  twitter: {
    card: "summary",
    title: "Wilwa | Northern Uganda's Trusted Online Store",
    description: "Shop trusted local sellers on Wilwa, Uganda's online marketplace.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

// Without this, Android browsers lay the page out at a 980px virtual viewport
// and scale it down, which reads as "content sticks out to the right" on
// 360px devices no matter how the CSS is written. Next.js only emits the
// viewport tag when this export exists.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c") }}
        />
      </head>
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
              duration: 2800,
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
              <RouteShell>
                {children}
              </RouteShell>
            </AppContextProvider>
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
