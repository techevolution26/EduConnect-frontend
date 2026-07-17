import { ReactNode, Suspense } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SIDEBAR_PADDING_CLASS } from "@/components/layout/layoutConstants";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={`min-h-screen bg-ink text-fg ${SIDEBAR_PADDING_CLASS}`}>
      <Sidebar />

      <div className="min-h-screen bg-ink">
        <Suspense fallback={null}>
          <Topbar />
        </Suspense>

        <main className="min-w-0 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
