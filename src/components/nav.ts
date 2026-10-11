import { BarChart3, BookOpen, FlaskConical, LayoutGrid, LineChart, NotebookPen, Radar, Search, Settings, Star, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Not built yet: links to an honest roadmap page instead of a fake screen. */
  soon?: boolean;
  mobile?: boolean;
}

export const NAV: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutGrid, mobile: true },
  { label: "Discover stocks", href: "/discover", icon: Search, mobile: true },
  { label: "Signals", href: "/signals", icon: Radar, mobile: true },
  { label: "Charts", href: "/roadmap/charts", icon: LineChart, soon: true },
  { label: "Watchlists", href: "/roadmap/watchlists", icon: Star, soon: true },
  { label: "Paper trading", href: "/roadmap/paper-trading", icon: Wallet, soon: true },
  { label: "Backtesting", href: "/roadmap/backtesting", icon: FlaskConical, soon: true },
  { label: "Learn", href: "/roadmap/learn", icon: BookOpen, soon: true },
  { label: "Journal", href: "/roadmap/journal", icon: NotebookPen, soon: true },
  { label: "Settings", href: "/roadmap/settings", icon: Settings, soon: true },
];

export const EXTRA_PAGES = [{ label: "Methodology", href: "/methodology", icon: BarChart3 }];
