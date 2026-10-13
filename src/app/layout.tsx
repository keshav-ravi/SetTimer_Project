import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rep Rest",
  description: "Log your sets. The rest timer starts itself.",
  manifest: "/manifest.webmanifest",
  // iOS ignores most of the manifest; these let it install as a standalone app.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Rep Rest" },
};

// viewportFit "cover" lets the page use the whole screen on iPhone, so the
// pinned Log set bar can sit above the home indicator using safe-area padding.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#14171c",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AnalyticsProvider userId={user?.id ?? null} />
        {children}
      </body>
    </html>
  );
}
