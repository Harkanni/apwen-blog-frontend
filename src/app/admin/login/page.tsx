'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client-api';
import { Logo } from '@/components/site/Logo';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/login', { method: 'POST', json: { email, password } });
      const next = params.get('next');
      router.replace(next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t sign in. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-iris p-12 text-white md:flex md:flex-col md:justify-between">
        <svg className="pointer-events-none absolute -bottom-24 -right-24 w-[130%] opacity-[0.13]" viewBox="0 0 400 300" aria-hidden>
          <path d="M20 280 200 20l180 260" fill="none" stroke="#fff" strokeWidth="10" strokeLinejoin="round" />
          <path d="M95 175h210M120 150l80 25 80-25M60 230h280M80 205l120 25 120-25" fill="none" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
        </svg>
        <p className="relative text-lg font-[650]">APWEN Studio</p>
        <div className="relative max-w-md">
          <h1 className="text-[3rem] leading-[1.02] font-[700] tracking-[-0.045em]">Every story starts with a blank page.</h1>
          <p className="mt-4 text-white/75">Write, add photos, preview on any screen and publish when you’re ready.</p>
        </div>
      </aside>

      <main className="flex flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[max(24px,env(safe-area-inset-top))] md:px-16">
        <Logo label="Studio" href="/" />
        <motion.form
          onSubmit={submit}
          className="my-auto w-full max-w-[400px] py-12 md:mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-[2rem] font-[700] tracking-[-0.04em]">Welcome back</h2>
          <p className="mt-1.5 text-ink-soft">Sign in to write and manage stories.</p>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="you@apwen.org.ng"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-white hover:text-ink"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <motion.p
              role="alert"
              className="mt-4 rounded-[var(--radius-sm)] bg-danger-soft px-4 py-3 text-[0.92rem] text-danger"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button className="btn btn-primary mt-6 h-12 w-full text-base" disabled={busy}>
            {busy && <Loader2 className="size-5 animate-spin" />} {busy ? 'Signing in' : 'Sign in'}
          </button>
          <p className="mt-6 text-center text-[0.85rem] text-ink-faint">Forgot your password? Ask your site admin to reset it.</p>
        </motion.form>
      </main>
    </div>
  );
}
