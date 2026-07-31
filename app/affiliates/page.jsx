import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AffiliatesPage from "@/components/company/AffiliatesPage";

export const metadata = {
  title: "Wilwa | Partners & Affiliates",
  description:
    "Work with Wilwa as a creator, referrer or business partner. See how partnerships are agreed, run and paid.",
};

const Affiliates = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Partners" showMobilePageSearch={false} />
    <AffiliatesPage />
    <Footer />
  </>
);

export default Affiliates;
