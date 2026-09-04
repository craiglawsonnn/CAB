// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockProcessImage, mockPublishFiles } = vi.hoisted(() => ({
  mockProcessImage: vi.fn(),
  mockPublishFiles: vi.fn(),
}));

vi.mock('@/lib/processImage', () => ({ processImage: mockProcessImage }));
vi.mock('@/lib/github', () => ({ publishFiles: mockPublishFiles }));

import { POST } from './route';

const VALID_CONTENT = {
  seo: {}, businessName: 'x', phoneDisplay: 'x', phoneHref: 'x', instagramDmUrl: null,
  instagramPendingLabel: 'x', logoSrc: 'x', heroImageSrc: 'x', nav: {}, hero: {},
  beforeAfter: {}, gallery: {}, reels: {}, googleReview: {}, pricing: {}, contact: {}, footer: {},
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessImage.mockResolvedValue('compressed-base64');
    mockPublishFiles.mockResolvedValue({ commitSha: 'abc123' });
  });

  it('rejects a payload missing required content keys without calling GitHub', async () => {
    const response = await POST(makeRequest({ content: { businessName: 'x' }, images: [] }));
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects an image path outside public/images/', async () => {
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [{ path: 'lib/evil.ts', action: 'upsert', base64: 'ZGF0YQ==' }],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects an oversized image', async () => {
    const oversized = Buffer.alloc(9 * 1024 * 1024).toString('base64');
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [{ path: 'public/images/big.jpg', action: 'upsert', base64: oversized }],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects images that are individually within the per-image limit but exceed the cumulative total', async () => {
    // Each image is ~2MB decoded (under the 3MB per-image cap), but two of them
    // together exceed the 3MB cumulative cap.
    const twoMb = Buffer.alloc(2 * 1024 * 1024).toString('base64');
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [
          { path: 'public/images/one.jpg', action: 'upsert', base64: twoMb },
          { path: 'public/images/two.jpg', action: 'upsert', base64: twoMb },
        ],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects an image path containing path traversal segments', async () => {
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [
          { path: 'public/images/../../../next.config.js', action: 'upsert', base64: 'ZGF0YQ==' },
        ],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('compresses upsert images and publishes content + images in one call', async () => {
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [
          { path: 'public/images/new.jpg', action: 'upsert', base64: 'ZGF0YQ==' },
          { path: 'public/images/old.jpg', action: 'delete' },
        ],
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, commitSha: 'abc123' });

    expect(mockProcessImage).toHaveBeenCalledWith('ZGF0YQ==', 2000);
    expect(mockPublishFiles).toHaveBeenCalledTimes(1);
    const [changes] = mockPublishFiles.mock.calls[0];
    expect(changes).toEqual(
      expect.arrayContaining([
        { path: 'public/images/new.jpg', action: 'upsert', content: 'compressed-base64' },
        { path: 'public/images/old.jpg', action: 'delete' },
        expect.objectContaining({ path: 'content/site.json', action: 'upsert' }),
      ])
    );
  });

  it('returns a clean 400 (not an unhandled 500) when an image cannot be processed', async () => {
    mockProcessImage.mockRejectedValue(new Error('Unsupported image format: svg'));
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [{ path: 'public/images/bad.svg', action: 'upsert', base64: 'ZGF0YQ==' }],
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('returns 502 when publishing fails', async () => {
    mockPublishFiles.mockRejectedValue(new Error('GitHub API error'));
    const response = await POST(makeRequest({ content: VALID_CONTENT, images: [] }));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('GitHub API error');
  });
});
