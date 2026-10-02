import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { SITE_URL } from '@/lib/format';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'APWEN Blog', template: '%s · APWEN Blog' },
  description: 'Stories, ideas and milestones from the Association of Professional Women Engineers of Nigeria.',
  applicationName: 'APWEN Blog',
  icons: { icon: '/icon.svg' },
  openGraph: { type: 'website', siteName: 'APWEN Blog', locale: 'en_NG' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#6b2fa3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          offset={20}
          mobileOffset={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
          toastOptions={{
            style: {
              borderRadius: 16,
              border: 'none',
              background: '#1e0f2e',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 12px 32px -8px rgb(30 15 46 / 0.45)',
            },
          }}
        />
      </body>
    </html>
  );
}
