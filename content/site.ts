import { basePath } from '@/lib/basePath';

export interface BeforeAfterPair {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
}

export interface PricingItem {
  id: string;
  name: string;
  detail?: string;
  price: string;
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

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export interface ReelItem {
  id: string;
  caption: string;
  embedUrl: string | null;
}

export interface GoogleReviewConfig {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
}

export interface SiteConfig {
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  logoSrc: string;
  heroImageSrc: string;
  googleReview: GoogleReviewConfig;
  beforeAfterPairs: BeforeAfterPair[];
  reels: ReelItem[];
  packages: PricingPackage[];
  standaloneOptions: StandaloneOption[];
  standaloneCaveat: string;
  quoteServices: QuoteService[];
  pricing: PricingItem[];
  gallery: GalleryImage[];
}

export const siteConfig: SiteConfig = {
  businessName: 'CAB Premium Detailing',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://ig.me/m/cab.premiumdetailing',
  logoSrc: `${basePath}/images/logo.jpg`,
  heroImageSrc: `${basePath}/images/hero.jpg`,
  googleReview: {
    rating: 4.9,
    reviewCount: 50,
    profileUrl: 'https://maps.app.goo.gl/HFcJiYVWfW2wRLeA9?g_st=ii',
  },
  beforeAfterPairs: [
    {
      id: 'driver-door',
      beforeSrc: `${basePath}/images/driver-door-before.jpg`,
      afterSrc: `${basePath}/images/driver-door-after.jpg`,
      beforeAlt: 'Driver door interior before detailing',
      afterAlt: 'Driver door interior after detailing',
      caption: 'Driver Door: Leather & Trim Restoration',
    },
    {
      id: 'passenger',
      beforeSrc: `${basePath}/images/passenger-before.jpg`,
      afterSrc: `${basePath}/images/passenger-after.jpg`,
      beforeAlt: 'Passenger area before detailing',
      afterAlt: 'Passenger area after detailing',
      caption: 'Passenger Area: Full Interior Detail',
    },
    {
      id: 'behind-seats',
      beforeSrc: `${basePath}/images/behind-seats-before.jpg`,
      afterSrc: `${basePath}/images/behind-seats-after.jpg`,
      beforeAlt: 'Behind seats and floor mats before detailing',
      afterAlt: 'Behind seats and floor mats after detailing',
      caption: 'Deep Carpet Extraction & Floor Mat Care',
    },
    {
      id: 'boot-1',
      beforeSrc: `${basePath}/images/boot-1-before.jpg`,
      afterSrc: `${basePath}/images/boot-1-after.jpg`,
      beforeAlt: 'Trunk cargo area before detailing',
      afterAlt: 'Trunk cargo area after detailing',
      caption: 'Full Trunk & Cargo Bay Detail',
    },
    {
      id: 'boot-2',
      beforeSrc: `${basePath}/images/boot-2-before.jpg`,
      afterSrc: `${basePath}/images/boot-2-after.jpg`,
      beforeAlt: 'SUV cargo area before detailing',
      afterAlt: 'SUV cargo area after detailing',
      caption: 'SUV Cargo Bay Detail',
    },
    {
      id: 'car-door',
      beforeSrc: `${basePath}/images/car-door-before.jpg`,
      afterSrc: `${basePath}/images/car-door-after.jpg`,
      beforeAlt: 'Car door panel before detailing',
      afterAlt: 'Car door panel after detailing',
      caption: 'Door Panel Interior Restoration',
    },
  ],
  reels: [
    {
      id: 'reel-1',
      caption: 'Before & After: See the Transformation',
      embedUrl: 'https://www.instagram.com/reel/DcG2WtAR9fc/',
    },
    {
      id: 'reel-2',
      caption: 'Full Detail Walkthrough',
      embedUrl: 'https://www.instagram.com/reel/DcSK2VWRgKT/',
    },
    {
      id: 'reel-3',
      caption: 'Meet CAB Premium Detailing',
      embedUrl: 'https://www.instagram.com/reel/DcCID9YJ5pC/',
    },
  ],
  packages: [
    {
      id: 'refresh',
      name: 'Refresh Detail',
      price: '$200',
      savingsNote: 'Interior + Exterior — $200 instead of $219.',
      description:
        'A complete interior and exterior refresh to keep your vehicle clean, fresh, and looking its best.',
      checklists: [
        {
          heading: 'EXTERIOR — $79',
          items: [
            'Pre-wash',
            'Hand wash',
            'Door jambs cleaned',
            'Wheels & tires cleaned',
            'Tire dressing',
            'Hand dry',
            'Windows cleaned inside & out',
          ],
        },
        {
          heading: 'INTERIOR — $140',
          items: [
            'Full interior vacuum',
            'Interior air blow-out',
            'Vacuum under floor mats',
            'Floor mats vacuumed',
            'Trunk vacuumed',
            'Wipe-down of all interior surfaces',
            'Cup holders & center console detailed',
            'Dashboard & instrument cluster cleaned',
            'Windows cleaned inside & out',
          ],
        },
      ],
      pricingCaveat: 'Pricing may vary depending on vehicle size and condition.',
      ctaLabel: 'Book Refresh Detail — $200',
    },
    {
      id: 'full',
      name: 'Full Detail',
      tagline: 'Our Most Complete Detail',
      price: '$300',
      savingsNote: 'Interior + Exterior — SAVE $20. Get both services together for $300 instead of $320.',
      description: 'A deep interior and exterior cleaning designed to give your vehicle a full reset.',
      checklists: [
        {
          heading: 'EXTERIOR — $120',
          note: 'Everything included in Exterior Refresh, plus:',
          items: [
            'Deep wheel cleaning',
            'Trim dressing',
            'Fuel door & gas cap area cleaned',
            'Bug & road grime removal',
            'Spray wax finish',
          ],
        },
        {
          heading: 'INTERIOR — $200',
          note: 'Everything included in Interior Refresh, plus:',
          items: [
            'Deep carpet cleaning',
            'Floor mats shampooed',
            'Deep interior cleaning',
            'Stain removal',
            'Full seat cleaning & shampoo',
            'UV protection for interior plastic surfaces',
            'Leather conditioning',
            'Detailed crevice cleaning',
          ],
        },
      ],
      pricingCaveat: 'Pricing may vary depending on vehicle size and condition.',
      ctaLabel: 'Book Full Detail — $300',
      highlight: true,
    },
  ],
  standaloneOptions: [
    { id: 'exterior-refresh', name: 'Exterior Refresh', price: '$79' },
    { id: 'interior-refresh', name: 'Interior Refresh', price: '$140' },
    { id: 'full-exterior', name: 'Full Exterior', price: '$120', groupLabel: 'For a deeper clean:' },
    { id: 'full-interior', name: 'Full Interior', price: '$200' },
  ],
  standaloneCaveat: 'Pricing may vary depending on vehicle size and condition.',
  quoteServices: [
    {
      id: 'polishing',
      name: 'Polishing & Scratch Removal',
      startingPrice: 'Starting at $100',
      description: 'Professional paint polishing and scratch removal tailored to your vehicle.',
      factors: [
        'Vehicle size',
        'Condition of the paint',
        'Type and depth of scratches',
        'Desired results and level of correction',
      ],
      note: 'Every vehicle is different, so we recommend contacting us for a personalized quote.',
      ctaLabel: 'Call or message us to discuss your vehicle and get a quote.',
    },
    {
      id: 'ceramic-coating',
      name: 'Ceramic Coating',
      tagline: '3-Year Ceramic Coating',
      startingPrice: 'Starting at $500',
      description: 'Long-lasting paint protection, enhanced gloss, and easier maintenance.',
      factors: [
        'Vehicle size',
        'Condition of the paint',
        'Whether paint polishing or correction is needed before application',
        'Level of paint correction desired',
        'Overall condition of the vehicle',
      ],
      note: 'Every vehicle is different, so we recommend contacting us for a personalized quote.',
      ctaLabel: 'Call or message us to discuss your vehicle and get a quote.',
    },
  ],
  pricing: [
    { id: 'headlight', name: 'Headlight Restoration', price: '$80–$120' },
    { id: 'pet-hair', name: 'Heavy Pet Hair Removal', price: 'From $40' },
    {
      id: 'ceramic-spray',
      name: 'Ceramic Spray Protection',
      detail: 'Lasts 3–6 months',
      price: '$60–$75',
    },
    { id: 'odor', name: 'Odor Elimination', detail: 'Ozone Treatment', price: '$50' },
  ],
  gallery: [
    {
      id: 'headlight-restore',
      src: `${basePath}/images/headlight-restore.jpg`,
      alt: 'Headlight restoration before and after',
      caption: 'Headlight Restoration',
    },
  ],
};
