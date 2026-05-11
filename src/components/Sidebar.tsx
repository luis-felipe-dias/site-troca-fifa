"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  House, 
  Book, 
  Heart, 
  MagnifyingGlass, 
  SignOut,
  Shield,
  List,
  X
} from "@phosphor-icons/react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Auth data Sidebar:", data);
        const userRole = data.user?.role || data.role;
        setIsAdmin(userRole === "admin");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar auth:", err);
        setLoading(false);
        setIsAdmin(false);
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: House },
    { name: "Álbum", href: "/album", icon: Book },
    { name: "Matches", href: "/matches", icon: Heart },
    { name: "Em Breve", href: "/busca", icon: MagnifyingGlass },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: Shield }] : []),
  ];

  if (loading) {
    return (
      <aside className="hidden lg:flex flex-col h-screen sticky top-0 w-20 bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-brincadeira-viva border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-gray-800 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo e botão recolher */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 border-b border-gray-200 dark:border-gray-800`}>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-brincadeira-viva">Yup</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Trocas</p>
            </div>
          )}
          {isCollapsed && (
            <span className="text-2xl font-bold text-brincadeira-viva">Y</span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            <List size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-brincadeira-viva text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Botão Sair */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <SignOut size={22} />
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Botão flutuante mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brincadeira-viva text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <List size={24} weight="bold" />
      </button>

      {/* Drawer mobile */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#1a1a2e] z-50 lg:hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h1 className="text-xl font-bold text-brincadeira-viva">Yup</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trocas</p>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-brincadeira-viva text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={22} weight={isActive ? "fill" : "regular"} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <SignOut size={22} />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}