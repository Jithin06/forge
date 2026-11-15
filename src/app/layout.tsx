import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import { TestBanner } from "@/components/account/test-banner";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/tab-bar";
import "./globals.css";

// USC names Source Sans 3 as the digital substitute for its sans-serif.
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Forge", template: "%s · Forge" },
  description:
    "Tell Forge what you want to make. It finds where at USC you can make it, what it takes to get in, what it will cost, and what you can get for free.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <TestBanner />
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-[680px] flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[680px] px-4 pb-28 pt-6 text-[15px] text-gray-text md:pb-8">
          Student project. Not an official USC service.
        </footer>
        <TabBar />
      </body>
    </html>
  );
}
