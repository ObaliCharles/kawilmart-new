import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AffiliatesPage from "@/components/company/AffiliatesPage";

export const metadata = {
  title: "KawilMart | Partners & Affiliates",
  description:
    "Work with KawilMart as a creator, referrer or business partner — how partnerships are agreed, run and paid.",
};

const Affiliates = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Partners" showMobilePageSearch={false} />
    <AffiliatesPage />
    <Footer />
  </>
);

export default Affiliates;
