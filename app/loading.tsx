import { SkeletonCard } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-3xl bg-dark/10 animate-pulse" />
      <div className="flex flex-wrap gap-3">
        <div className="h-20 flex-1 min-w-[8.5rem] rounded-2xl bg-dark/10 animate-pulse" />
        <div className="h-20 flex-1 min-w-[8.5rem] rounded-2xl bg-dark/10 animate-pulse" />
        <div className="h-20 flex-1 min-w-[8.5rem] rounded-2xl bg-dark/10 animate-pulse" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
