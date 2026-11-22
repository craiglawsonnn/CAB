import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildGtagInitScript, getConversionKind, trackConversionClick } from '@/lib/googleAds';

function link(href: string, text = 'link') {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  const span = document.createElement('span');
  span.textContent = text;
  a.appendChild(span);
  document.body.appendChild(a);
  return { a, span };
}

describe('getConversionKind', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects phone links, including clicks on a child element', () => {
    expect(getConversionKind(link('tel:+14066095321').span)).toBe('phone');
    expect(getConversionKind(link('sms:+14066095321').a)).toBe('phone');
  });

  it('detects the Instagram DM link', () => {
    expect(getConversionKind(link('https://ig.me/m/cab.premiumdetailing').a)).toBe('instagram');
  });

  it('ignores other links (including Instagram reel embeds) and non-elements', () => {
    expect(getConversionKind(link('#contact').a)).toBeNull();
    expect(getConversionKind(link('https://www.instagram.com/reel/abc/').a)).toBeNull();
    expect(getConversionKind(null)).toBeNull();
  });
});

describe('trackConversionClick', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('sends a conversion event to the configured ID/label for booking links', () => {
    const gtag = vi.fn();
    const sent = trackConversionClick(link('tel:+14066095321').a, gtag, 'AW-123', 'abcLabel');
    expect(sent).toBe(true);
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-123/abcLabel',
      event_category: 'contact',
      event_label: 'phone',
    });
  });

  it('does nothing for non-booking links', () => {
    const gtag = vi.fn();
    expect(trackConversionClick(link('#services').a, gtag, 'AW-123', 'abcLabel')).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it('does nothing when the tag is not configured or not loaded', () => {
    const gtag = vi.fn();
    const { a } = link('tel:+14066095321');
    expect(trackConversionClick(a, gtag, null, 'abcLabel')).toBe(false);
    expect(trackConversionClick(a, gtag, 'AW-123', null)).toBe(false);
    expect(trackConversionClick(a, undefined, 'AW-123', 'abcLabel')).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe('buildGtagInitScript', () => {
  it('configures the tag without call tracking when there is no call label', () => {
    const script = buildGtagInitScript('AW-18404887060', null, '(406) 609-5321');
    expect(script).toContain(`gtag('config', "AW-18404887060");`);
    expect(script).not.toContain('phone_conversion_number');
  });

  it('adds website call tracking with the displayed phone number when a call label is set', () => {
    const script = buildGtagInitScript('AW-18404887060', 'callLbl', '(406) 609-5321');
    expect(script).toContain(
      `gtag('config', "AW-18404887060/callLbl", {"phone_conversion_number":"(406) 609-5321"});`
    );
  });
});
