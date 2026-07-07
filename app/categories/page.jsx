import CategoryLandingPage from "@/components/CategoryLandingPage";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getResolvedSiteContent } from "@/lib/getSiteContent";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const [initialProducts, initialSiteContent] = await Promise.all([
    getStorefrontProductsSafe(),
    getResolvedSiteContent(),
  ]);

  return (
    <>
      <Navbar />
      <CategoryLandingPage initialProducts={initialProducts} initialSiteContent={initialSiteContent} />
      <Footer />
    </>
  );
};

export default CategoriesPage;
