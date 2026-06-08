type AuthMessageProps = {
  children: string;
  tone?: "info" | "error" | "success";
};

const toneClassNames = {
  info: "border-border bg-muted text-muted-foreground",
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function AuthMessage({ children, tone = "info" }: AuthMessageProps) {
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${toneClassNames[tone]}`}>
      {children}
    </p>
  );
}
