import type { Metadata } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import { siteConfig } from '@/content/site';
import GoogleTag from '@/components/GoogleTag';
import { GOOGLE_ADS_CALL_LABEL, GOOGLE_ADS_CONVERSION_LABEL, GOOGLE_ADS_ID } from '@/lib/googleAds';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <GoogleTag
          adsId={GOOGLE_ADS_ID}
          callLabel={GOOGLE_ADS_CALL_LABEL}
          conversionLabel={GOOGLE_ADS_CONVERSION_LABEL}
          phoneNumber={siteConfig.phoneDisplay}
        />
      </body>
    </html>
  );
}
