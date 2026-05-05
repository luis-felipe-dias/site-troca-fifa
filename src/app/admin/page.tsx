import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-request";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  try {
    await requireAdmin();
    return <AdminClient />;
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "FORBIDDEN") redirect("/dashboard");
    redirect("/login?redirect=/admin");
  }
}

