import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";
import Providers from "@/app/providers";
import ThemeInitScript from "@/components/theme/ThemeInitScript";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-worksans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gateways Ecosystem",
    template: "%s | Gateways Ecosystem",
  },
  description:
    "A publishing, education, and community ecosystem for writers, readers, teachers, students, and families.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-ink text-fg antialiased">
        <ThemeInitScript />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}