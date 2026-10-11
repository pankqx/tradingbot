"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Wordmark } from "./ui";
import { EXTRA_PAGES, NAV } from "./nav";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[60px] shrink-0 flex-col border-r border-line bg-surface md:flex lg:w-[220px]">
      <Link href="/" className="flex h-14 items-center gap-2.5 border-b border-line px-[18px] text-ink" aria-label="tradingb0t home">
        <Logo />
        <span className="hidden lg:block"><Wordmark /></span>
      </Link>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV.map(({ label, href, icon: Icon, soon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-9 items-center gap-3 rounded-md px-[10px] text-[13.5px] transition-colors ${active ? "bg-accent-soft font-medium text-accent" : soon ? "text-ink-3 hover:bg-line/60 hover:text-ink" : "text-ink-2 hover:bg-line/60 hover:text-ink"}`}
            >
              {active && <span className="absolute -left-2 top-2 h-5 w-[3px] rounded-r bg-accent" />}
              <Icon className="size-[17px] shrink-0" strokeWidth={1.7} />
              <span className="hidden flex-1 lg:block">{label}</span>
              {soon && <span className="hidden rounded-full border border-line-strong px-1.5 text-[10.5px] leading-4 text-ink-3 lg:block">Soon</span>}
            </Link>
          );
        })}
        <div className="mt-auto border-t border-line pt-2">
          {EXTRA_PAGES.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} title={label} aria-current={isActive(path, href) ? "page" : undefined}
              className={`flex h-9 items-center gap-3 rounded-md px-[10px] text-[13.5px] transition-colors hover:bg-line/60 ${isActive(path, href) ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink"}`}>
              <Icon className="size-[17px] shrink-0" strokeWidth={1.7} />
              <span className="hidden lg:block">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items = NAV.filter((n) => n.mobile);
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {[...items, EXTRA_PAGES[0]].map(({ label, href, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11.5px] ${active ? "text-accent" : "text-ink-3"}`}>
            <Icon className="size-[19px]" strokeWidth={1.7} />
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
