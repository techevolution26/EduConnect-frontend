"use client";

import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialQuery = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(initialQuery);

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    retry: false,
  });

  function logout() {
    clearAuthSession();
    queryClient.clear();
    router.push("/login");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const q = searchValue.trim();

    if (!q) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const isSearchPage = pathname.startsWith("/search");

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#09090b]/85 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <form
          onSubmit={handleSearch}
          className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:flex"
        >
          <Search className="h-4 w-4 shrink-0 text-white/40" />

          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={
              isSearchPage
                ? "Search again..."
                : "Search stories, lessons, faith, writers, hubs..."
            }
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Search
          </button>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/search"
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link
            href="/notifications"
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <Link
            href="/profile"
            className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 sm:flex"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
              {user?.full_name?.charAt(0).toUpperCase() ?? <UserCircle className="h-4 w-4" />}
            </div>

            <div className="text-right">
              <p className="max-w-40 truncate text-sm font-medium text-white">
                {user?.full_name ?? "Loading..."}
              </p>
              <p className="text-xs text-white/45">{user?.role ?? "..."}</p>
            </div>
          </Link>

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

      <form onSubmit={handleSearch} className="mt-3 flex gap-2 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <Search className="h-4 w-4 shrink-0 text-white/40" />

          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Go
        </button>
      </form>
    </header>
  );
}