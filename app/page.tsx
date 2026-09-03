import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import GallerySection from '@/components/GallerySection';
import ReelsSection from '@/components/ReelsSection';
import ReviewsCard from '@/components/ReviewsCard';
import PricingSection from '@/components/PricingSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import { siteConfig } from '@/content/site';

export default function Home() {
  return (
    <>
      <Nav
        phoneDisplay={siteConfig.phoneDisplay}
        phoneHref={siteConfig.phoneHref}
        instagramDmUrl={siteConfig.instagramDmUrl}
        logoSrc={siteConfig.logoSrc}
        businessName={siteConfig.businessName}
      />
      <main>
        <Hero
          heroImageSrc={siteConfig.heroImageSrc}
          phoneDisplay={siteConfig.phoneDisplay}
          phoneHref={siteConfig.phoneHref}
          instagramDmUrl={siteConfig.instagramDmUrl}
        />
        <BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />
        <GallerySection images={siteConfig.gallery} />
        <ReelsSection reels={siteConfig.reels} />
        <ReviewsCard
          rating={siteConfig.googleReview.rating}
          reviewCount={siteConfig.googleReview.reviewCount}
          profileUrl={siteConfig.googleReview.profileUrl}
        />
        <PricingSection
          packages={siteConfig.packages}
          standaloneOptions={siteConfig.standaloneOptions}
          quoteServices={siteConfig.quoteServices}
          items={siteConfig.pricing}
        />
        <ContactSection
          instagramDmUrl={siteConfig.instagramDmUrl}
          phoneDisplay={siteConfig.phoneDisplay}
          phoneHref={siteConfig.phoneHref}
        />
      </main>
      <Footer
        logoSrc={siteConfig.logoSrc}
        businessName={siteConfig.businessName}
        instagramDmUrl={siteConfig.instagramDmUrl}
        googleProfileUrl={siteConfig.googleReview.profileUrl}
      />
    </>
  );
}
