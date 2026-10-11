import type { Metadata, Viewport } from "next";
import { THEME_SCRIPT } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "tradingb0t", template: "%s · tradingb0t" },
  description: "Explainable stock research and signal generation for Indian markets. Academic prototype running on simulated data.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f0f1ec" }, { media: "(prefers-color-scheme: dark)", color: "#0b100f" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
