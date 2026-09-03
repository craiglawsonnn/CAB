import { basePath } from '@/lib/basePath';
import raw from './site.json';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavConfig {
  links: NavLink[];
  callButtonLabel: string;
  instagramButtonLabel: string;
}

export interface HeroConfig {
  badge: string;
  headline: string;
  subtitle: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export interface BeforeAfterPair {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
}

export interface BeforeAfterConfig {
  heading: string;
  subtitle: string;
  viewMoreTemplate: string;
  showFewerLabel: string;
  beforeTagLabel: string;
  afterTagLabel: string;
  ariaLabelPrefix: string;
  pairs: BeforeAfterPair[];
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export interface GalleryConfig {
  heading: string;
  subtitle: string;
  images: GalleryImage[];
}

export interface ReelItem {
  id: string;
  caption: string;
  embedUrl: string | null;
}

export interface ReelsConfig {
  heading: string;
  subtitle: string;
  comingSoonLabel: string;
  items: ReelItem[];
}

export interface GoogleReviewConfig {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
  heading: string;
  countTemplate: string;
  viewButtonLabel: string;
  pendingLabel: string;
}

export interface ServiceChecklist {
  heading: string;
  note?: string;
  items: string[];
}

export interface PricingPackage {
  id: string;
  name: string;
  tagline?: string;
  price: string;
  savingsNote: string;
  description: string;
  checklists: ServiceChecklist[];
  pricingCaveat: string;
  ctaLabel: string;
  highlight?: boolean;
}

export interface StandaloneOption {
  id: string;
  name: string;
  price: string;
  groupLabel?: string;
}

export interface QuoteService {
  id: string;
  name: string;
  tagline?: string;
  startingPrice: string;
  description: string;
  factors: string[];
  note: string;
  ctaLabel: string;
}

export interface PricingItem {
  id: string;
  name: string;
  detail?: string;
  price: string;
}

export interface PricingConfig {
  heading: string;
  subtitle: string;
  packages: PricingPackage[];
  standaloneHeading: string;
  standaloneSubtitle: string;
  standaloneOptions: StandaloneOption[];
  standaloneCaveat: string;
  quoteHeading: string;
  quoteSubtitle: string;
  quoteFactorsLabel: string;
  quoteServices: QuoteService[];
  addonsHeading: string;
  addonsSubtitle: string;
  addons: PricingItem[];
}

export interface ContactConfig {
  heading: string;
  body: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export interface FooterConfig {
  copyrightSuffix: string;
  instagramLabel: string;
  googleLabel: string;
}

export interface SeoConfig {
  title: string;
  description: string;
}

export interface SiteConfig {
  seo: SeoConfig;
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  logoSrc: string;
  heroImageSrc: string;
  nav: NavConfig;
  hero: HeroConfig;
  beforeAfter: BeforeAfterConfig;
  gallery: GalleryConfig;
  reels: ReelsConfig;
  googleReview: GoogleReviewConfig;
  pricing: PricingConfig;
  contact: ContactConfig;
  footer: FooterConfig;
}

function withBasePath(src: string): string {
  return `${basePath}${src}`;
}

export const siteConfig: SiteConfig = {
  ...raw,
  logoSrc: withBasePath(raw.logoSrc),
  heroImageSrc: withBasePath(raw.heroImageSrc),
  beforeAfter: {
    ...raw.beforeAfter,
    pairs: raw.beforeAfter.pairs.map((pair) => ({
      ...pair,
      beforeSrc: withBasePath(pair.beforeSrc),
      afterSrc: withBasePath(pair.afterSrc),
    })),
  },
  gallery: {
    ...raw.gallery,
    images: raw.gallery.images.map((image) => ({ ...image, src: withBasePath(image.src) })),
  },
};
