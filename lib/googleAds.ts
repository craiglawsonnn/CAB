/**
 * Google Ads tag + conversion tracking.
 *
 * Configured with public env vars (Vercel → Project → Settings → Environment
 * Variables, then redeploy):
 *   NEXT_PUBLIC_GOOGLE_ADS_ID               the Google tag ID, e.g. "AW-18404887060"
 *   NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL       label of the "Calls from website" conversion
 *                                           (Google swaps the phone number on the page for a
 *                                           forwarding number and counts calls ≥ the set length)
 *   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL label of a "Website" click conversion, fired when a
 *                                           visitor clicks a Call/Text or Instagram DM link
 *
 * The ID and call label default to CAB's account (below). Each label only
 * enables its own kind of tracking.
 */

// Defaults are CAB's own Google Ads account (public values — they appear in the
// page source anyway). Env vars override them, e.g. to disable or swap accounts.
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || 'AW-18404887060';
// "Call ((406) 609-5321)" — Calls from website conversion
export const GOOGLE_ADS_CALL_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL?.trim() || 'VuZJCL6iwLEdEJSUkchE';
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim() || null;

const CONVERSION_LINK_SELECTOR = 'a[href^="tel:"], a[href^="sms:"], a[href^="https://ig.me/"]';

export type Gtag = (...args: unknown[]) => void;

export type ConversionKind = 'phone' | 'instagram';

/** Builds the inline gtag bootstrap script. */
export function buildGtagInitScript(
  adsId: string,
  callLabel: string | null,
  phoneNumber: string
): string {
  const lines = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(adsId)});`,
  ];
  if (callLabel) {
    lines.push(
      `gtag('config', ${JSON.stringify(`${adsId}/${callLabel}`)}, ${JSON.stringify({
        phone_conversion_number: phoneNumber,
      })});`
    );
  }
  return lines.join('\n');
}

/** Returns which booking link (if any) a click landed on. */
export function getConversionKind(target: EventTarget | null): ConversionKind | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>(CONVERSION_LINK_SELECTOR);
  if (!link) return null;
  const href = link.getAttribute('href') ?? '';
  return href.startsWith('https://ig.me/') ? 'instagram' : 'phone';
}

/**
 * Fires a Google Ads conversion if the click was on a booking link.
 * Returns true when a conversion event was sent.
 */
export function trackConversionClick(
  target: EventTarget | null,
  gtag: Gtag | undefined,
  adsId: string | null,
  conversionLabel: string | null
): boolean {
  if (!gtag || !adsId || !conversionLabel) return false;
  const kind = getConversionKind(target);
  if (!kind) return false;
  gtag('event', 'conversion', {
    send_to: `${adsId}/${conversionLabel}`,
    event_category: 'contact',
    event_label: kind,
  });
  return true;
}
