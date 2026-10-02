'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, revalidate } from '@/lib/client-api';
import type { Settings, User } from '@/lib/types';
import { useStudio } from '@/components/admin/AuthGate';
import { InstagramIcon, FacebookIcon } from '@/components/site/SocialIcons';
import { Confirm, Sheet } from '@/components/ui/Sheet';

export default function SettingsPage() {
  const { settings, refreshSettings, user } = useStudio();
  const [form, setForm] = useState<Settings | null>(settings);
  const [newCat, setNewCat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  if (!form) return <div className="mx-auto max-w-[760px] px-5 pt-10"><div className="skeleton h-64" /></div>;

  const set = (patch: Partial<Settings>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function save() {
    setSaving(true);
    try {
      await api('/api/admin/settings', { method: 'PATCH', json: form });
      await refreshSettings();
      revalidate();
      toast('Settings saved');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-[max(20px,env(safe-area-inset-top))] md:px-10 md:pt-10">
      <h1 className="text-[2.1rem] font-[720] tracking-[-0.04em] md:text-[2.6rem]">Settings</h1>

      <Section title="Social media" body="Shown in the blog’s menu, footer and the follow banner.">
        <Field label="Instagram" icon={<InstagramIcon className="size-5 text-iris" />}>
          <input className="field" value={form.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://www.instagram.com/…" inputMode="url" autoCapitalize="none" />
        </Field>
        <Field label="Facebook" icon={<FacebookIcon className="size-5 text-iris" />}>
          <input className="field" value={form.facebook} onChange={(e) => set({ facebook: e.target.value })} placeholder="https://www.facebook.com/…" inputMode="url" autoCapitalize="none" />
        </Field>
        <Field label="Official website">
          <input className="field" value={form.website} onChange={(e) => set({ website: e.target.value })} inputMode="url" autoCapitalize="none" />
        </Field>
        <Field label="Contact email">
          <input className="field" type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} inputMode="email" autoCapitalize="none" />
        </Field>
      </Section>

      <Section title="Topics" body="Writers pick one topic per story. Readers can browse by topic.">
        <div className="flex flex-wrap gap-2">
          {form.categories.map((c) => (
            <span key={c} className="inline-flex h-10 items-center gap-1 rounded-full bg-mist pl-4 pr-1.5 text-[0.92rem] font-[580]">
              {c}
              <button aria-label={`Remove ${c}`} className="grid size-7 place-items-center rounded-full hover:bg-white" onClick={() => set({ categories: form.categories.filter((x) => x !== c) })}>
                <X className="size-4" />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = newCat.trim();
            if (v && !form.categories.some((c) => c.toLowerCase() === v.toLowerCase())) set({ categories: [...form.categories, v] });
            setNewCat('');
          }}
        >
          <input className="field" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New topic" maxLength={40} />
          <button className="btn btn-soft h-12 shrink-0" disabled={!newCat.trim()}>
            <Plus className="size-[18px]" /> Add
          </button>
        </form>
      </Section>

      <Section title="About the blog" body="Used on the About page, in the footer and in search results.">
        <Field label="Tagline">
          <input className="field" value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={200} />
        </Field>
        <Field label="About APWEN">
          <textarea className="field resize-y leading-relaxed" rows={5} value={form.about} onChange={(e) => set({ about: e.target.value })} maxLength={1000} />
        </Field>
      </Section>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+80px)] mt-8 flex justify-end md:bottom-6">
        <button className="btn btn-primary h-12 px-6 shadow-[var(--shadow-float)]" onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save settings
        </button>
      </div>

      <Account />
      {user.role === 'admin' && <Team />}
    </div>
  );
}

function Section({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[1.25rem] font-[680] tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-[0.92rem] text-ink-soft">{body}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="label flex items-center gap-2">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function Account() {
  const { user, setUser, signOut } = useStudio();
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (next) Object.assign(body, { current_password: current, new_password: next });
      if (!Object.keys(body).length) return;
      const r = await api<{ user: User }>('/api/auth/me', { method: 'PATCH', json: body });
      setUser(r.user);
      setCurrent('');
      setNext('');
      toast(next ? 'Password changed' : 'Account updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-[1.25rem] font-[680] tracking-[-0.02em]">Your account</h2>
      <p className="mt-1 text-[0.92rem] text-ink-soft">Signed in as {user.email}</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Your name">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current password">
            <input className="field" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="New password">
            <input className="field" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" />
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-between">
          <button type="button" className="btn btn-ghost md:hidden" onClick={signOut}>
            Sign out
          </button>
          <button className="btn btn-soft" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Update account
          </button>
        </div>
      </form>
    </section>
  );
}

function Team() {
  const { user } = useStudio();
  const [users, setUsers] = useState<(User & { created_at: string })[]>([]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' });

  const load = () => api<{ users: (User & { created_at: string })[] }>('/api/admin/users').then((r) => setUsers(r.users));
  useEffect(() => {
    load();
  }, []);

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.25rem] font-[680] tracking-[-0.02em]">Team</h2>
          <p className="mt-1 text-[0.92rem] text-ink-soft">People who can write and publish stories.</p>
        </div>
        <button className="btn btn-soft btn-sm shrink-0" onClick={() => setAdding(true)}>
          <UserPlus className="size-4" /> Add person
        </button>
      </div>
      <ul className="mt-5 space-y-1">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-mist">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-iris text-[0.95rem] font-[650] text-white">{u.name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[600]">
                {u.name} {u.id === user.id && <span className="font-normal text-ink-faint">(you)</span>}
              </p>
              <p className="truncate text-[0.85rem] text-ink-faint">
                {u.email}, {u.role === 'admin' ? 'admin' : 'editor'}
              </p>
            </div>
            {u.id !== user.id && (
              <button className="btn btn-ghost btn-icon btn-sm text-danger hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${u.name}`} onClick={() => setRemoving(u)}>
                <Trash2 className="size-[18px]" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title="Add a person"
        description="Share the email and password with them privately. They can change the password after signing in."
        footer={
          <button
            className="btn btn-primary w-full md:w-auto"
            onClick={async () => {
              try {
                await api('/api/admin/users', { method: 'POST', json: form });
                toast(`${form.name} can now sign in`);
                setAdding(false);
                setForm({ name: '', email: '', password: '', role: 'editor' });
                load();
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            Add person
          </button>
        }
      >
        <div className="space-y-4 pt-1">
          <Field label="Name">
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoCapitalize="none" />
          </Field>
          <Field label="Temporary password">
            <input className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </Field>
          <Field label="Role">
            <div className="grid grid-cols-2 gap-2">
              {(['editor', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={form.role === r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={form.role === r ? 'btn bg-iris text-white' : 'btn btn-soft'}
                >
                  {r === 'editor' ? 'Editor' : 'Admin'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[0.8rem] text-ink-faint">Admins can also manage the team.</p>
          </Field>
        </div>
      </Sheet>

      <Confirm
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        danger
        title={`Remove ${removing?.name}?`}
        body="They won’t be able to sign in any more. Their stories stay on the blog."
        confirmLabel="Remove"
        onConfirm={async () => {
          await api(`/api/admin/users/${removing!.id}`, { method: 'DELETE' });
          load();
        }}
      />
    </section>
  );
}
