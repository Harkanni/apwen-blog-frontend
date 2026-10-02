'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Search, X, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { InstagramIcon, FacebookIcon } from './SocialIcons';
import { categoryHref, cn } from '@/lib/format';

type Props = { categories: string[]; instagram?: string; facebook?: string; website?: string };

export function Header({ categories, instagram, facebook, website }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);

  // Tuck the header away while reading downwards; bring it back on any upward scroll.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > lastY.current && y > 160);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 h-[var(--header-h)] transition-[transform,background-color,box-shadow] duration-300 ease-out',
          hidden && !menuOpen && !searchOpen ? '-translate-y-full' : 'translate-y-0',
          scrolled || menuOpen ? 'bg-white/85 shadow-[0_1px_0_rgb(30_15_46/0.06)] backdrop-blur-xl backdrop-saturate-150' : 'bg-white/0',
        )}
      >
        <div className="wrap flex h-full items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink href="/" active={pathname === '/'}>
              Stories
            </NavLink>
            {categories.slice(0, 3).map((c) => (
              <NavLink key={c} href={categoryHref(c)} active={pathname === categoryHref(c)}>
                {c}
              </NavLink>
            ))}
            <NavLink href="/about" active={pathname === '/about'}>
              About
            </NavLink>
          </nav>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-icon" aria-label="Search stories" onClick={() => setSearchOpen(true)}>
              <Search className="size-[21px]" strokeWidth={2} />
            </button>
            <button
              className="btn btn-ghost btn-icon md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? 'x' : 'm'}
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                >
                  {menuOpen ? <X className="size-[22px]" /> : <Menu className="size-[22px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-y-auto bg-white md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="wrap flex min-h-full flex-col pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4" aria-label="Mobile">
              <ul className="flex flex-col">
                {[{ name: 'All stories', href: '/' }, ...categories.map((c) => ({ name: c, href: categoryHref(c) })), { name: 'About APWEN', href: '/about' }].map(
                  (item, i) => (
                    <motion.li key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i, duration: 0.25 }}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center justify-between py-3.5 text-[1.6rem] font-[620] tracking-[-0.03em] active:text-iris',
                          pathname === item.href ? 'text-iris' : 'text-ink',
                        )}
                      >
                        {item.name}
                      </Link>
                    </motion.li>
                  ),
                )}
              </ul>
              <div className="mt-auto pt-10">
                <p className="mb-3 text-sm text-ink-faint">Follow APWEN</p>
                <div className="flex flex-wrap gap-2">
                  {instagram && (
                    <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
                      <InstagramIcon className="size-5" /> Instagram
                    </a>
                  )}
                  {facebook && (
                    <a href={facebook} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
                      <FacebookIcon className="size-5" /> Facebook
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                      apwen.org.ng <ArrowUpRight className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative rounded-full px-3.5 py-2 text-[0.94rem] font-[550] transition-colors',
        active ? 'text-iris' : 'text-ink-soft hover:bg-mist hover:text-ink',
      )}
    >
      {children}
      {active && <motion.span layoutId="nav-dot" className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold" />}
    </Link>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 60);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm md:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            role="search"
            className="w-full max-w-xl rounded-[var(--radius-lg)] bg-white p-2 shadow-[var(--shadow-float)]"
            initial={{ y: -16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              onClose();
            }}
          >
            <div className="flex items-center gap-2">
              <Search className="ml-3 size-5 shrink-0 text-iris" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stories"
                className="h-12 min-w-0 flex-1 bg-transparent text-[1.05rem] outline-none placeholder:text-ink-faint"
                enterKeyHint="search"
                aria-label="Search stories"
              />
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
