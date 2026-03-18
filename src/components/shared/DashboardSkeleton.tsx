import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-1 h-3 w-32" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-14" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
    </tr>
  );
}

export function WalletSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <div className="col-span-2 lg:col-span-1"><StatCardSkeleton /></div>
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecentOrdersSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-card divide-y">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
