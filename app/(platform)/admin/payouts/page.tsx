"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();

  const payoutsQuery = useQuery({
    queryKey: ["admin", "payouts", "pending"],
    queryFn: () => api.adminPendingPayouts({ limit: 100 }),
    retry: false,
  });

  const markPaidMutation = useMutation({
    mutationFn: (earningId: string) => api.adminMarkPayoutPaid(earningId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts", "pending"] });
    },
  });

  const payouts = payoutsQuery.data?.items ?? [];
  const totalPending = payouts.reduce((sum, p) => sum + p.commission_amount_kes, 0);

  const mutationError =
    markPaidMutation.error instanceof ApiError ? markPaidMutation.error.detail : null;

  return (
    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent-text" />
            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
              Monetization
            </p>
          </div>
          <h1 className="font-display mt-3 text-2xl font-semibold text-fg sm:text-3xl">
            Referral payouts
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-dim">
            Creators earn a 10% commission when someone they refer buys a
            partnership. Mark a payout as paid once you&apos;ve sent the funds
            off-platform.
          </p>

          {payouts.length > 0 ? (
            <div className="mt-5 inline-flex rounded-2xl border border-border bg-surface-2 px-4 py-3">
              <div>
                <p className="text-xs text-fg-dim">Total pending</p>
                <p className="mt-1 text-xl font-semibold text-fg">
                  KES {totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {mutationError ? (
          <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {mutationError}
          </p>
        ) : null}

        {payoutsQuery.isError ? (
          <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {payoutsQuery.error instanceof ApiError
              ? payoutsQuery.error.detail
              : "You don't have permission to view payouts. Ask a super admin to grant you the payouts.manage permission."}
          </p>
        ) : null}

        {payoutsQuery.isLoading ? <LoadingState label="Loading payouts..." /> : null}

        {!payoutsQuery.isLoading && !payoutsQuery.isError && payouts.length === 0 ? (
          <EmptyState
            title="No pending payouts"
            description="Referral commissions will appear here once a referred user's partnership payment succeeds."
          />
        ) : null}

        {payouts.length > 0 ? (
          <section className="overflow-hidden rounded-[2rem] border border-border">
            <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-border bg-surface px-4 py-3 text-xs uppercase tracking-[0.18em] text-fg-dim md:grid">
              <span>Source amount</span>
              <span>Commission rate</span>
              <span>Commission owed</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-border">
              {payouts.map((earning) => (
                <div
                  key={earning.id}
                  className="grid gap-3 bg-surface px-4 py-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"
                >
                  <span className="text-sm text-fg">
                    KES {earning.source_amount_kes.toLocaleString()}
                  </span>
                  <span className="text-sm text-fg-dim">
                    {(earning.commission_rate_bps / 100).toFixed(1)}%
                  </span>
                  <span className="text-sm font-semibold text-fg">
                    KES {earning.commission_amount_kes.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => markPaidMutation.mutate(earning.id)}
                    disabled={markPaidMutation.isPending}
                    className="w-fit rounded-2xl border border-success/30 bg-success-soft px-4 py-2 text-xs font-semibold text-success disabled:opacity-60"
                  >
                    Mark paid
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </RoleGuard>
  );
}
