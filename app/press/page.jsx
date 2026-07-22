import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PressPage from "@/components/company/PressPage";

export const metadata = {
  title: "KawilMart | Press & Media",
  description:
    "Media enquiries, brand assets and fast facts about KawilMart, Uganda's marketplace for everyday essentials.",
};

const Press = () => (
  <>
    <Navbar hideMobileHeader mobilePageTitle="Press & Media" showMobilePageSearch={false} />
    <PressPage />
    <Footer />
  </>
);

export default Press;
