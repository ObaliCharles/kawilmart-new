import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AboutPageContent from "@/components/about/AboutPageContent";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { getResolvedSiteContent } from "@/lib/getSiteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "KawilMart | About Us",
  description:
    "KawilMart is Uganda's marketplace for everyday essentials — connecting trusted local sellers with smart buyers.",
};

// Testimonials come from real product reviews only. If nobody has reviewed
// anything yet the section simply does not render, rather than shipping
// invented quotes from customers who do not exist.
const getRealTestimonials = async () => {
  try {
    await connectDB();

    const products = await Product.find({ "reviews.0": { $exists: true } })
      .select("name reviews")
      .limit(40)
      .lean();

    const testimonials = [];

    for (const product of products) {
      for (const review of product.reviews || []) {
        const comment = String(review.comment || "").trim();
        if (Number(review.rating) >= 4 && comment.length >= 30) {
          testimonials.push({
            name: review.userName || "KawilMart shopper",
            rating: Number(review.rating),
            comment,
            product: product.name,
            verified: Boolean(review.verifiedPurchase),
          });
        }
      }
    }

    return testimonials
      .sort((a, b) => (b.verified === a.verified ? b.rating - a.rating : b.verified ? 1 : -1))
      .slice(0, 6);
  } catch {
    return [];
  }
};

const AboutPage = async () => {
  const [siteContent, testimonials] = await Promise.all([
    getResolvedSiteContent(),
    getRealTestimonials(),
  ]);

  return (
    <>
      <Navbar hideMobileHeader mobilePageTitle="About Us" showMobilePageSearch={false} />
      <AboutPageContent about={siteContent.aboutPage} testimonials={testimonials} />
      <Footer />
    </>
  );
};

export default AboutPage;
