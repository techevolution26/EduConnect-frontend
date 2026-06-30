"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export const authMeQueryKey = ["auth", "me"] as const;

export function useAuthSession() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const token = mounted ? getAccessToken() : null;

  const query = useQuery<User | null>({
    queryKey: authMeQueryKey,
    queryFn: async () => {
      const user = await api.me();
      return user ?? null;
    },
    enabled: mounted && Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!mounted) return;

    if (!token) {
      queryClient.setQueryData(authMeQueryKey, null);
      return;
    }

    if (query.isError) {
      clearAuthSession();
      queryClient.setQueryData(authMeQueryKey, null);
    }
  }, [mounted, query.isError, queryClient, token]);

  const logout = useCallback(() => {
    clearAuthSession();
    queryClient.setQueryData(authMeQueryKey, null);
  }, [queryClient]);

  return {
    user: query.data ?? null,
    isAuthenticated: mounted && Boolean(token) && Boolean(query.data) && !query.isError,
    isReady: mounted,
    isLoading: mounted && Boolean(token) && query.isPending,
    logout,
  };
}
