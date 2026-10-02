import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { getCategories, getSettings } from '@/lib/api';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, cats] = await Promise.all([getSettings(), getCategories()]);
  // Show categories that have stories first, then any configured empty ones.
  const names = [...new Set([...cats.map((c) => c.name), ...settings.categories])];
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-iris focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header categories={names} instagram={settings.instagram} facebook={settings.facebook} website={settings.website} />
      <main id="main" className="flex-1 pt-[var(--header-h)]">
        {children}
      </main>
      <Footer settings={{ ...settings, categories: names }} />
    </div>
  );
}
