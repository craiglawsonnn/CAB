'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { buildGtagInitScript, trackConversionClick, type Gtag } from '@/lib/googleAds';

export interface GoogleTagProps {
  adsId: string | null;
  callLabel: string | null;
  conversionLabel: string | null;
  /** Number exactly as displayed on the page, so Google can swap it for a forwarding number. */
  phoneNumber: string;
}

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/** Loads the Google tag (gtag.js) site-wide, enables website call tracking, and reports booking-link clicks. */
export default function GoogleTag({ adsId, callLabel, conversionLabel, phoneNumber }: GoogleTagProps) {
  useEffect(() => {
    if (!adsId || !conversionLabel) return;
    const onClick = (event: MouseEvent) => {
      trackConversionClick(event.target, window.gtag, adsId, conversionLabel);
    };
    // Capture phase so the event is sent before the browser hands off to the
    // phone dialer / Instagram app.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [adsId, conversionLabel]);

  if (!adsId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {buildGtagInitScript(adsId, callLabel, phoneNumber)}
      </Script>
    </>
  );
}
