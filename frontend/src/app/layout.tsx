import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobPulse AI — Real-Time Job Market Intelligence",
  description:
    "Live job market signals: trending skills, salary heatmaps, and demand shifts across India's top tech cities. Powered by Adzuna + AI normalization.",
  keywords: [
    "job market",
    "skills trends",
    "salary heatmap",
    "India tech jobs",
    "Adzuna",
    "JobPulse",
  ],
  authors: [{ name: "JobPulse AI" }],
  openGraph: {
    title: "JobPulse AI — Real-Time Job Market Intelligence",
    description:
      "Live job market signals: trending skills, salary heatmaps, and demand shifts across India's top tech cities.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobPulse AI",
    description: "Real-time job market intelligence for India's tech cities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plexMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
