import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import GuidesPage from "@/components/company/GuidesPage";

export const metadata = {
  title: "Wilwa | Shopping Guides",
  description:
    "Practical guides to buying on Wilwa — mobile money payments, delivery and pickup, returns, and shopping safely.",
};

const Guides = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Shopping Guides" showMobilePageSearch={false} />
    <GuidesPage />
    <Footer />
  </>
);

export default Guides;
