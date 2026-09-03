import { NextResponse } from 'next/server';
import { processImage } from '@/lib/processImage';
import { publishFiles, type FileChange } from '@/lib/github';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_SAVE = 30;
const IMAGE_MAX_WIDTH = 2000;

const REQUIRED_CONTENT_KEYS = [
  'seo', 'businessName', 'phoneDisplay', 'phoneHref', 'instagramDmUrl',
  'instagramPendingLabel', 'logoSrc', 'heroImageSrc', 'nav', 'hero',
  'beforeAfter', 'gallery', 'reels', 'googleReview', 'pricing', 'contact', 'footer',
];

interface SaveImage {
  path: string;
  action: 'upsert' | 'delete';
  base64?: string;
}

interface ValidatedBody {
  content: Record<string, unknown>;
  images: SaveImage[];
}

function validateBody(body: unknown): ValidatedBody | null {
  if (typeof body !== 'object' || body === null) return null;
  const { content, images } = body as { content?: unknown; images?: unknown };

  if (typeof content !== 'object' || content === null) return null;
  for (const key of REQUIRED_CONTENT_KEYS) {
    if (!(key in content)) return null;
  }

  if (!Array.isArray(images)) return null;
  if (images.length > MAX_IMAGES_PER_SAVE) return null;

  for (const image of images) {
    if (typeof image?.path !== 'string' || !image.path.startsWith('public/images/')) return null;
    if (image.action !== 'upsert' && image.action !== 'delete') return null;
    if (image.action === 'upsert') {
      if (typeof image.base64 !== 'string') return null;
      const byteLength = Buffer.byteLength(image.base64, 'base64');
      if (byteLength === 0 || byteLength > MAX_IMAGE_BYTES) return null;
    }
  }

  return { content: content as Record<string, unknown>, images: images as SaveImage[] };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const validated = validateBody(rawBody);
  if (!validated) {
    return NextResponse.json({ ok: false, error: 'Invalid request payload.' }, { status: 400 });
  }

  const changes: FileChange[] = [];

  for (const image of validated.images) {
    if (image.action === 'delete') {
      changes.push({ path: image.path, action: 'delete' });
      continue;
    }
    const compressed = await processImage(image.base64 as string, IMAGE_MAX_WIDTH);
    changes.push({ path: image.path, action: 'upsert', content: compressed });
  }

  const contentJson = JSON.stringify(validated.content, null, 2);
  changes.push({
    path: 'content/site.json',
    action: 'upsert',
    content: Buffer.from(contentJson, 'utf-8').toString('base64'),
  });

  try {
    const { commitSha } = await publishFiles(changes, 'chore: publish content update from admin CMS');
    return NextResponse.json({ ok: true, commitSha });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
