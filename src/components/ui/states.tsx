import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section className={cn("surface-card px-5 py-12 text-center sm:px-8", className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6 [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </section>
  );
}

type ErrorStateProps = {
  title: string;
  description?: string;
  details?: React.ReactNode;
  className?: string;
};

export function ErrorState({ title, description, details, className }: ErrorStateProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700",
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-bold">{title}</h2>
          {description ? <p className="mt-1">{description}</p> : null}
          {details ? <div className="mt-2">{details}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={cn("surface-card animate-pulse p-5 sm:p-6", className)}
    >
      <div className="h-4 w-24 rounded-full bg-muted" />
      <div className="mt-4 h-7 w-2/3 rounded-full bg-muted" />
      <div className="mt-4 h-4 w-full rounded-full bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded-full bg-muted" />
    </div>
  );
}
