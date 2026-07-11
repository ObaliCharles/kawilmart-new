import CategoryBrowserPage from "@/components/CategoryBrowserPage";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const initialProducts = await getStorefrontProductsSafe();

  return (
    <>
      <Navbar />
      <CategoryBrowserPage initialProducts={initialProducts} />
      <Footer />
    </>
  );
};

export default CategoriesPage;
