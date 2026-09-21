import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
