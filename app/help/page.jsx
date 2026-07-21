import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import HelpCenterPage from "@/components/help/HelpCenterPage";

export const metadata = {
  title: "KawilMart | Help Center",
  description:
    "Track orders, manage payments, resolve delivery issues, and reach KawilMart support.",
};

const HelpPage = () => {
  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="Help Center" showMobilePageSearch={false} />
      <HelpCenterPage />
      <Footer />
    </>
  );
};

export default HelpPage;
