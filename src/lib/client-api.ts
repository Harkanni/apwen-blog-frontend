'use client';

/** Browser-side API client for the studio. Requests go to /api on the same
 *  origin (rewritten to the backend), so the httpOnly session cookie applies. */
export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...rest,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, 'You appear to be offline. Your work is kept on this device until the connection returns.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth/login')) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/admin/login?next=${next}`;
    }
    throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`, data);
  }
  return data as T;
}

/** Upload one image with progress. Sends raw bytes; the API sniffs the type. */
export function uploadImage(file: File, onProgress?: (pct: number) => void) {
  return new Promise<import('./types').Media>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.media);
      else reject(new ApiError(xhr.status, data.error || 'Upload failed.'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed. Check your connection and try again.'));
    xhr.send(file);
  });
}

/** Ask the Next.js server to refresh cached public pages after a change. */
export function revalidate(slug?: string) {
  return fetch('/revalidate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  }).catch(() => {});
}
