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
  instagramDmUrl: string;
  logoSrc: string;
  heroImageSrc: string;
  googleReview: GoogleReviewConfig;
  beforeAfterPairs: BeforeAfterPair[];
  reels: ReelItem[];
  pricing: PricingItem[];
  pricingImages: {
    addons: string;
    prices: string;
    headlight: string;
    details: string;
  };
}

export const siteConfig: SiteConfig = {
  businessName: 'CAB Premium Detailing',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  // Placeholder until the real Instagram handle is supplied.
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  logoSrc: '/images/logo.jpg',
  heroImageSrc: '/images/hero.jpg',
  googleReview: {
    rating: 4.9,
    reviewCount: 50,
    // Placeholder until the real Google Business Profile URL is supplied.
    profileUrl: null,
  },
  beforeAfterPairs: [
    {
      id: 'driver-door',
      beforeSrc: '/images/driver-door-before.jpg',
      afterSrc: '/images/driver-door-after.jpg',
      beforeAlt: 'Driver door interior before detailing',
      afterAlt: 'Driver door interior after detailing',
      caption: 'Driver Door: Leather & Trim Restoration',
    },
    {
      id: 'passenger',
      beforeSrc: '/images/passenger-before.jpg',
      afterSrc: '/images/passenger-after.jpg',
      beforeAlt: 'Passenger area before detailing',
      afterAlt: 'Passenger area after detailing',
      caption: 'Passenger Area: Full Interior Detail',
    },
    {
      id: 'behind-seats',
      beforeSrc: '/images/behind-seats-before.jpg',
      afterSrc: '/images/behind-seats-after.jpg',
      beforeAlt: 'Behind seats and floor mats before detailing',
      afterAlt: 'Behind seats and floor mats after detailing',
      caption: 'Deep Carpet Extraction & Floor Mat Care',
    },
    {
      id: 'boot-1',
      beforeSrc: '/images/boot-1-before.jpg',
      afterSrc: '/images/boot-1-after.jpg',
      beforeAlt: 'Trunk cargo area before detailing',
      afterAlt: 'Trunk cargo area after detailing',
      caption: 'Full Trunk & Cargo Bay Detail',
    },
    {
      id: 'boot-2',
      beforeSrc: '/images/boot-2-before.jpg',
      afterSrc: '/images/boot-2-after.jpg',
      beforeAlt: 'SUV cargo area before detailing',
      afterAlt: 'SUV cargo area after detailing',
      caption: 'SUV Cargo Bay Detail',
    },
    {
      id: 'car-door',
      beforeSrc: '/images/car-door-before.jpg',
      afterSrc: '/images/car-door-after.jpg',
      beforeAlt: 'Car door panel before detailing',
      afterAlt: 'Car door panel after detailing',
      caption: 'Door Panel Interior Restoration',
    },
  ],
  reels: [
    { id: 'reel-1', caption: 'Aircraft Exterior Ceramic Wash', embedUrl: null },
    { id: 'reel-2', caption: 'Yacht Teak & Hull Polish', embedUrl: null },
    { id: 'reel-3', caption: 'Full Supercar Paint Correction', embedUrl: null },
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
  pricingImages: {
    addons: '/images/addons.jpg',
    prices: '/images/prices.jpg',
    headlight: '/images/headlight-restore.jpg',
    details: '/images/details.jpg',
  },
};
