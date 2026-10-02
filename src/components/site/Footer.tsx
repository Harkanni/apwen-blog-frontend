import Link from 'next/link';
import { Logo } from './Logo';
import { InstagramIcon, FacebookIcon } from './SocialIcons';
import { categoryHref } from '@/lib/format';
import type { Settings } from '@/lib/types';

export function FollowBand({ settings }: { settings: Settings }) {
  if (!settings.instagram && !settings.facebook) return null;
  return (
    <section className="wrap my-16 md:my-24" aria-labelledby="follow-heading">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-iris px-6 py-10 text-white md:px-14 md:py-16">
        <svg className="pointer-events-none absolute -right-10 -top-6 h-[130%] opacity-[0.14]" viewBox="0 0 400 300" aria-hidden>
          <path d="M20 280 200 20l180 260" fill="none" stroke="#fff" strokeWidth="14" strokeLinejoin="round" />
          <path d="M95 175h210M120 150l80 25 80-25M60 230h280M80 205l120 25 120-25" fill="none" stroke="#fff" strokeWidth="8" strokeLinejoin="round" />
        </svg>
        <div className="relative max-w-xl">
          <h2 id="follow-heading" className="text-[2rem] leading-[1.05] font-[680] tracking-[-0.035em] text-balance md:text-[2.75rem]">
            Follow the work as it happens
          </h2>
          <p className="mt-3 max-w-md text-[1.02rem] leading-relaxed text-white/80">
            Event photos, member spotlights and outreach updates, every week.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="btn bg-white text-iris-deep hover:bg-mist">
                <InstagramIcon className="size-5" /> Instagram
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="btn bg-white/12 text-white hover:bg-white/20">
                <FacebookIcon className="size-5" /> Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-mist pb-[calc(env(safe-area-inset-bottom)+28px)] pt-12">
      <div className="wrap grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{settings.tagline}</p>
          <div className="mt-5 flex gap-1.5">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="APWEN on Instagram" className="btn btn-icon bg-white text-iris hover:text-iris-deep">
                <InstagramIcon className="size-5" />
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="APWEN on Facebook" className="btn btn-icon bg-white text-iris hover:text-iris-deep">
                <FacebookIcon className="size-5" />
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Topics">
          <h2 className="mb-3 text-sm font-semibold text-ink">Topics</h2>
          <ul className="space-y-2">
            {settings.categories.slice(0, 6).map((c) => (
              <li key={c}>
                <Link href={categoryHref(c)} className="text-[0.95rem] text-ink-soft hover:text-iris">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Association">
          <h2 className="mb-3 text-sm font-semibold text-ink">Association</h2>
          <ul className="space-y-2 text-[0.95rem] text-ink-soft">
            <li>
              <Link href="/about" className="hover:text-iris">
                About APWEN
              </Link>
            </li>
            {settings.website && (
              <li>
                <a href={settings.website} target="_blank" rel="noopener noreferrer" className="hover:text-iris">
                  Official website
                </a>
              </li>
            )}
            {settings.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-iris">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            <li>
              <a href="/rss.xml" className="hover:text-iris">
                RSS feed
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="wrap mt-12 flex flex-col gap-2 text-[0.82rem] text-ink-faint md:flex-row md:justify-between">
        <p>© {year} Association of Professional Women Engineers of Nigeria</p>
        <Link href="/admin" className="hover:text-iris">
          Editor sign in
        </Link>
      </div>
    </footer>
  );
}
