import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  ClipboardCheck,
  BarChart3,
  ThermometerSun,
  Settings,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/", label: "控制台", icon: LayoutDashboard },
  { path: "/templates", label: "线路模板", icon: MapPin },
  { path: "/audits", label: "布控审核", icon: ClipboardCheck },
  { path: "/reviews", label: "异常复盘", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-cold-900 to-cold-700 overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-ice-500/10 bg-cold-900/50 backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-ice-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ice-500 to-ice-300 flex items-center justify-center">
              <ThermometerSun className="w-6 h-6 text-cold-900" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white">冷链布控</h1>
              <p className="text-xs text-gray-400">Cold Chain Monitor</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-ice-500/15 text-ice-400 border border-ice-500/20 shadow-lg shadow-ice-500/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-ice-400")} />
                {item.label}
                {item.path === "/audits" && (
                  <span className="ml-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                    5
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ice-500/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" />
            系统设置
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-ice-500/10 bg-cold-800/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {menuItems.find((m) => location.pathname === m.path || (m.path !== "/" && location.pathname.startsWith(m.path)))?.label || "控制台"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-ice-500/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ice-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">质控专员</p>
                <p className="text-xs text-gray-400">刘敏</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
