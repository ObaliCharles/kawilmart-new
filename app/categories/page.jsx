import CategoryLandingPage from "@/components/CategoryLandingPage";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const initialProducts = await getStorefrontProductsSafe();

  return (
    <>
      <Navbar />
      <CategoryLandingPage initialProducts={initialProducts} />
      <Footer />
    </>
  );
};

export default CategoriesPage;
