import { NextResponse } from 'next/server';
import { analyze, imageMediaTypeForExtension } from 'datapitfalls';
import type { AuditReport } from 'datapitfalls';

// The engine and the Anthropic SDK need the Node runtime, not the edge runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing ANTHROPIC_API_KEY — set it to run audits.' },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected a multipart form upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No chart image was uploaded.' }, { status: 400 });
  }

  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  const mediaType = imageMediaTypeForExtension(ext);
  if (!mediaType) {
    return NextResponse.json(
      { error: `Unsupported image type "${ext || file.name}". Use PNG, JPEG, GIF, or WebP.` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 });
  }
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is too large (max 8 MB).' }, { status: 413 });
  }

  try {
    const report: AuditReport = await analyze({
      kind: 'image',
      content: Buffer.from(bytes).toString('base64'),
      mediaType,
      filename: file.name,
    });
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The audit failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
