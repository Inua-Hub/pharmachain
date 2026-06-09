"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  Scan, 
  Truck, 
  History,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Bell,
  Shield,
  Wallet
} from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(3);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("pharmaUser");
    if (!storedUser && pathname !== "/") {
      router.push("/");
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("pharmaUser");
    router.push("/");
  };

  // Don't show sidebar on homepage
  if (pathname === "/") {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  // Navigation Items - CLEAN: Admin sees NO medicine pages
  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["manufacturer", "distributor", "pharmacy", "patient", "admin"] },
    { href: "/dashboard/admin", icon: Shield, label: "Admin Panel", roles: ["admin"] },
    { href: "/dashboard/create", icon: Package, label: "Create Medicine", roles: ["manufacturer"] },
    { href: "/dashboard/verify", icon: Scan, label: "Verify Medicine", roles: ["patient"] },
    { href: "/dashboard/medicines", icon: Truck, label: "My Medicines", roles: ["manufacturer", "distributor", "pharmacy", "patient"] },
    { href: "/dashboard/transactions", icon: History, label: "Transactions", roles: ["manufacturer", "distributor", "pharmacy", "patient"] },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: ["manufacturer", "distributor", "pharmacy", "patient", "admin"] },
  ];

  // Filter nav items based on user role
  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ""));

  return (
    <html lang="en">
      <body className="bg-[#f0f2f8]">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-[#0a0e27] to-[#131b3e] transition-all duration-300 z-20 ${sidebarCollapsed ? "w-20" : "w-72"}`}>
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                {!sidebarCollapsed && <span className="text-white font-bold">Pharma<span className="text-cyan-400">Chain</span></span>}
              </Link>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white/50 hover:text-white">
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-white/40 text-xs truncate capitalize">{user?.role}</p>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition">
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-72"} w-full`}>
            {/* Top Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-semibold text-gray-800 capitalize">
                    {pathname === "/dashboard" ? "Overview" : pathname.split("/").pop()}
                  </h1>
                  <p className="text-sm text-gray-500">Blockchain Pharmaceutical Supply System</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-mono text-gray-600">0x742d...b146</span>
                  </div>
                  <button className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Blockchain Connected</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page Content */}
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}