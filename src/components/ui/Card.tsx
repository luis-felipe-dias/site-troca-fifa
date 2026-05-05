import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["glass rounded-2xl shadow-glass", className].join(" ")} />;
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["p-5 pb-3", className].join(" ")} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["text-lg font-semibold tracking-tight", className].join(" ")} />;
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["p-5 pt-0", className].join(" ")} />;
}

