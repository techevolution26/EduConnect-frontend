import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

import Providers from "@/app/providers";

export const metadata: Metadata = {
  title: {
    default: "EduConnect Ecosystem",
    template: "%s | EduConnect Ecosystem",
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}