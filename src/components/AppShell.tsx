"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  badge?: ReactNode;
}

export function AppShell({ children, title, badge }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0d0d1a]">
      <Sidebar />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header com título e ThemeToggle */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div>
              {title && (
                <h1 className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-white">
                  {title}
                </h1>
              )}
              {badge && <div className="mt-0.5">{badge}</div>}
            </div>
            <ThemeToggle />
          </div>
        </header>
        
        {/* Conteúdo principal */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

// Também exporta como default para compatibilidade com importações existentes
export default AppShell;