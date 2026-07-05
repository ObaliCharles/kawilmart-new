import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LegalCenterPage from "@/components/legal/LegalCenterPage";

export const metadata = {
  title: "KawilMart | Legal Center",
  description:
    "Explore KawilMart's privacy policy, terms of service, marketplace role rules, and frequently asked questions.",
};

const LegalPage = () => {
  return (
    <>
      <Navbar />
      <LegalCenterPage />
      <Footer />
    </>
  );
};

export default LegalPage;
