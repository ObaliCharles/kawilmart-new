import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CareersPage from "@/components/company/CareersPage";

export const metadata = {
  title: "Wilwa | Careers",
  description:
    "Help build Uganda's marketplace for everyday essentials. See how to join the Wilwa team.",
};

const Careers = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Careers" showMobilePageSearch={false} />
    <CareersPage />
    <Footer />
  </>
);

export default Careers;
