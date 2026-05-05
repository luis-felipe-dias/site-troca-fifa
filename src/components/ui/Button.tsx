import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-yup-primary text-white hover:opacity-90",
  secondary: "bg-yup-softBlue text-yup-primary hover:opacity-90",
  ghost: "bg-transparent hover:bg-black/5 text-yup-primary",
  danger: "bg-yup-orange text-white hover:opacity-90"
};

export function Button({ className = "", variant = "primary", ...props }: Props) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
        "shadow-soft",
        variants[variant],
        className
      ].join(" ")}
    />
  );
}

