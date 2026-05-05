"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: 16,
          background: "rgba(255,255,255,0.85)",
          color: "#272D4F",
          border: "1px solid rgba(39,45,79,0.10)",
          boxShadow: "0 10px 25px rgba(39,45,79,0.10)",
          backdropFilter: "blur(10px)"
        }
      }}
    />
  );
}

