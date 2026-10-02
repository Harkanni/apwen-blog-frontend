'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/client-api';
import type { Settings, User } from '@/lib/types';
import { Mark } from '@/components/site/Logo';

type Ctx = {
  user: User;
  settings: Settings | null;
  refreshSettings: () => Promise<void>;
  setUser: (u: User) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function useStudio() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useStudio must be used inside <AuthGate>');
  return ctx;
}

/** Loads the signed-in editor; sends anyone else to the sign-in page. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const refreshSettings = useCallback(async () => {
    const s = await api<{ settings: Settings }>('/api/settings', { cache: 'no-store' });
    setSettings(s.settings);
  }, []);

  useEffect(() => {
    let alive = true;
    api<{ user: User }>('/api/auth/me')
      .then((r) => {
        if (!alive) return;
        setUser(r.user);
        refreshSettings().catch(() => {});
      })
      .catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`));
    return () => {
      alive = false;
    };
  }, [router, pathname, refreshSettings]);

  const signOut = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/admin/login');
  }, [router]);

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading the studio">
        <Mark className="size-12 animate-pulse" />
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, settings, refreshSettings, setUser, signOut }}>{children}</AuthContext.Provider>;
}
