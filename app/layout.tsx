import type { Metadata } from "next";
import "./globals.css";
import{Analytics} from "@vercel/analytics/react";

import Providers from "@/app/providers";

export const metadata: Metadata = {
  title: {
    default: "Story Learning Ecosystem",
    template: "%s | Story Learning Ecosystem",
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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}