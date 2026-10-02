const LOCALE = 'en-NG';

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(LOCALE, { timeZone: 'Africa/Lagos', ...opts }).format(new Date(iso));
}

export function formatShortDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return formatDate(iso, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const future = diff < 0;
  const s = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, sec] of units) {
    if (s >= sec) return rtf.format(Math.round((future ? 1 : -1) * (s / sec)), unit);
  }
  return future ? 'in a moment' : 'just now';
}

export const categoryHref = (name: string) => `/category/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`;
export const categoryFromParam = (param: string) => decodeURIComponent(param).replace(/-/g, ' ');

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
