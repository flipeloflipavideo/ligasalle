"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAdmin } from "@/components/auth/admin-provider";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();

  return (
    <div className="flex h-screen">
      {isAdmin && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${!isAdmin ? 'flex items-center justify-center' : ''}`}>
        {children}
      </main>
    </div>
  );
}