import type { Metadata } from 'next';
import { getSettings } from '@/lib/api';
import { InstagramIcon, FacebookIcon } from '@/components/site/SocialIcons';

export const metadata: Metadata = { title: 'About' };
export const revalidate = 300;

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="wrap max-w-[760px] pt-10 pb-6 md:pt-20">
      <h1 className="text-[2.4rem] leading-[1.02] font-[720] tracking-[-0.045em] text-balance md:text-[4rem]">
        Women engineering Nigeria’s future
      </h1>
      <p className="mt-6 font-serif text-[1.2rem] leading-[1.75] text-ink-soft md:text-[1.3rem]">{s.about}</p>
      <div className="dimension my-10">this blog</div>
      <p className="font-serif text-[1.1rem] leading-[1.75]">
        Here we publish news from the association, stories from members across the country, and practical insight from women working in every
        field of engineering. Have a story to share? Write to us{s.contactEmail ? ' at ' : '.'}
        {s.contactEmail && (
          <a className="text-iris underline underline-offset-4" href={`mailto:${s.contactEmail}`}>
            {s.contactEmail}
          </a>
        )}
        {s.contactEmail && '.'}
      </p>
      <div className="mt-10 flex flex-wrap gap-2.5">
        {s.instagram && (
          <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <InstagramIcon className="size-5" /> Instagram
          </a>
        )}
        {s.facebook && (
          <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
            <FacebookIcon className="size-5" /> Facebook
          </a>
        )}
        {s.website && (
          <a href={s.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Official website
          </a>
        )}
      </div>
    </div>
  );
}
