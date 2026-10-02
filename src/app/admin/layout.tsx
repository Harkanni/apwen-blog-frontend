import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Studio', template: '%s · APWEN Studio' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white">{children}</div>;
}
