import { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#27272a,transparent_30%),#09090b] text-white">
      <Sidebar />

      <div className="min-h-screen md:pl-64 xl:pl-72">
        <Topbar />

        <main className="min-w-0 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}