import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  href,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  trend?: { label: string; positive?: boolean };
}) {
  const content = (
    <Card className="h-full transition hover:shadow-md">
      <CardContent className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <div className="flex items-center justify-between gap-2 text-xs">
          {trend ? (
            <span className={cn(trend.positive ? "text-emerald-700" : "text-red-700")}>{trend.label}</span>
          ) : (
            <span />
          )}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block focus-visible:outline-none">
      {content}
    </Link>
  );
}
