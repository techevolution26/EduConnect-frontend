"use client";

import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearAuthSession, getStoredUser } from "@/lib/auth";

export default function Topbar() {
  const router = useRouter();
  const user = getStoredUser();

  function logout() {
    clearAuthSession();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#09090b]/85 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:flex">
          <Search className="h-4 w-4 text-white/40" />
          <input
            placeholder="Search stories, lessons, writers..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {user?.full_name ?? "Reader"}
            </p>
            <p className="text-xs text-white/45">{user?.role ?? "GUEST"}</p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
            type="button"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}