import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { API_BASE } from '@/lib/api';

/** Called by the studio after publishing, editing or deleting a story so the
 *  public pages refresh immediately instead of waiting for the cache to expire.
 *  Only signed-in editors can trigger it: we check their session with the API. */
export async function POST(req: NextRequest) {
  const me = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { cookie: req.headers.get('cookie') || '' },
    cache: 'no-store',
  });
  if (!me.ok) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });

  const { slug } = await req.json().catch(() => ({ slug: undefined }));
  revalidateTag('content');
  revalidatePath('/', 'layout');
  if (typeof slug === 'string' && slug) revalidatePath(`/stories/${slug}`);
  return NextResponse.json({ revalidated: true });
}
