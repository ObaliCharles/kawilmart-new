import CategoryBrowserPage from "@/components/CategoryBrowserPage";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const initialProducts = await getStorefrontProductsSafe();

  return (
    <>
      <Navbar hideMobileHeader />
      <CategoryBrowserPage initialProducts={initialProducts} />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </>
  );
};

export default CategoriesPage;
