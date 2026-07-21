import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ShoppingHelpPage from "@/components/help/ShoppingHelpPage";

export const metadata = {
  title: "KawilMart | Shopping Help",
  description: "How to search, add to cart, choose delivery, pay, and track your KawilMart order.",
};

const ShoppingHelp = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Shopping Help" showMobilePageSearch={false} />
    <ShoppingHelpPage />
    <Footer />
  </>
);

export default ShoppingHelp;
