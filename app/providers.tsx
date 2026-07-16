"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { createQueryClient } from "@/lib/queryClient";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}