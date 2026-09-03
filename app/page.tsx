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
        instagramPendingLabel={siteConfig.instagramPendingLabel}
        logoSrc={siteConfig.logoSrc}
        businessName={siteConfig.businessName}
        links={siteConfig.nav.links}
        callButtonLabel={siteConfig.nav.callButtonLabel}
        instagramButtonLabel={siteConfig.nav.instagramButtonLabel}
      />
      <main>
        <Hero
          heroImageSrc={siteConfig.heroImageSrc}
          phoneDisplay={siteConfig.phoneDisplay}
          phoneHref={siteConfig.phoneHref}
          instagramDmUrl={siteConfig.instagramDmUrl}
          instagramPendingLabel={siteConfig.instagramPendingLabel}
          badge={siteConfig.hero.badge}
          headline={siteConfig.hero.headline}
          subtitle={siteConfig.hero.subtitle}
          instagramButtonLabel={siteConfig.hero.instagramButtonLabel}
          callButtonPrefix={siteConfig.hero.callButtonPrefix}
        />
        <BeforeAfterSection
          pairs={siteConfig.beforeAfter.pairs}
          heading={siteConfig.beforeAfter.heading}
          subtitle={siteConfig.beforeAfter.subtitle}
          viewMoreTemplate={siteConfig.beforeAfter.viewMoreTemplate}
          showFewerLabel={siteConfig.beforeAfter.showFewerLabel}
        />
        <GallerySection images={siteConfig.gallery.images} />
        <ReelsSection reels={siteConfig.reels.items} />
        <ReviewsCard
          rating={siteConfig.googleReview.rating}
          reviewCount={siteConfig.googleReview.reviewCount}
          profileUrl={siteConfig.googleReview.profileUrl}
        />
        <PricingSection
          packages={siteConfig.pricing.packages}
          standaloneOptions={siteConfig.pricing.standaloneOptions}
          quoteServices={siteConfig.pricing.quoteServices}
          items={siteConfig.pricing.addons}
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
