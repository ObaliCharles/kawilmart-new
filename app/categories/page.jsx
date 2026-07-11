import CategoryBrowserPage from "@/components/CategoryBrowserPage";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getResolvedSiteContent } from "@/lib/getSiteContent";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const [siteContent, initialProducts] = await Promise.all([
    getResolvedSiteContent(),
    getStorefrontProductsSafe(),
  ]);

  return (
    <>
      <Navbar hideMobileHeader />
      <CategoryBrowserPage siteContent={siteContent} initialProducts={initialProducts} />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </>
  );
};

export default CategoriesPage;
