import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { await requireAdmin(); return <div className="admin-surface min-h-screen bg-[var(--paper)] text-black lg:grid lg:grid-cols-[240px_1fr]"><AdminNav /><div className="min-w-0">{children}</div></div>; }
