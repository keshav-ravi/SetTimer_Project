import type { Metadata } from "next";
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
  title: "SetTimer spike",
  description: "Rest-timer feasibility spike",
  manifest: "/manifest.webmanifest",
  // iOS ignores most of the manifest; these let it install as a standalone app.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "SetTimer" },
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
