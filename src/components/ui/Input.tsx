import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-yup-primary/90">{label}</div> : null}
      <input
        {...props}
        className={[
          "w-full rounded-xl border border-yup-primary/10 bg-white/70 px-3 py-2 text-sm text-yup-primary placeholder:text-yup-primary/40",
          "outline-none focus:ring-4 focus:ring-yup-pinkSoft/40 focus:border-yup-primary/20",
          "glass shadow-soft",
          className
        ].join(" ")}
      />
      {hint ? <div className="mt-1 text-xs text-yup-primary/60">{hint}</div> : null}
    </label>
  );
}

