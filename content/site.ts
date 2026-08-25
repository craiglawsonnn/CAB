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

export interface PricingPackage {
  id: string;
  name: string;
  tagline: string;
  includesNote?: string;
  features: string[];
  duration: string;
  price: string;
  priceNote: string;
  highlight?: boolean;
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
      tagline: 'For regular maintenance & a fresh look',
      features: [
        'Exterior hand wash',
        'Wheels & tires washed',
        'Door jambs cleaned',
        'Windows cleaned, in & out',
        'Full interior vacuum',
        'Floor mats vacuumed',
        'Interior wipe-down',
        'Cup holders & console detail',
        'Spray wax finish',
      ],
      duration: '~2 hrs with 2 techs · ~4 hrs solo',
      price: 'From $200',
      priceNote: 'Final pricing based on vehicle size',
    },
    {
      id: 'full',
      name: 'Full Detail',
      tagline: 'For a deep interior & exterior reset',
      includesNote: 'Everything in Refresh Detail, plus:',
      features: [
        'Tire dressing',
        'Exterior plastic dressing',
        'Compressed air blow-out',
        'Deep carpet cleaning',
        'Floor mats shampooed',
        'Deep interior cleaning',
        'Stain removal — seats & carpet',
        'Full seat cleaning / shampoo',
        'Seat conditioning',
        'Headliner cleaned, if needed',
      ],
      duration: '~3 hrs with 2 techs · ~6 hrs solo',
      price: 'From $300',
      priceNote: 'Final pricing based on vehicle size & condition',
      highlight: true,
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
