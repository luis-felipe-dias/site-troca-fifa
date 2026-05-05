"use client";

import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl glass shadow-glass p-4 pb-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-yup-primary/20" />
        {children}
      </div>
    </div>
  );
}

