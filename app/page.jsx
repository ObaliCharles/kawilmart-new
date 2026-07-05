import Footer from "@/components/Footer";
import MegaStoreHome from "@/components/MegaStoreHome";
import Navbar from "@/components/Navbar";
import { getResolvedSiteContent } from "@/lib/getSiteContent";
import { getStorefrontProductsSafe } from "@/lib/getStorefrontProducts";

export const dynamic = "force-dynamic";

const Home = async () => {
  const [siteContent, initialProducts] = await Promise.all([
    getResolvedSiteContent(),
    getStorefrontProductsSafe(),
  ]);

  return (
    <>
      <Navbar />
      <MegaStoreHome siteContent={siteContent} initialProducts={initialProducts} />
      <Footer />
    </>
  );
};

export default Home;
