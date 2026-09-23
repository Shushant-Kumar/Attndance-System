import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScanFace,
  Camera,
  History,
  FileBarChart,
  Settings,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Student Management", icon: Users },
  { to: "/register-face", label: "Register Face", icon: ScanFace },
  { to: "/live-camera", label: "Live Camera", icon: Camera },
  { to: "/attendance-history", label: "Attendance History", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">
          Smart Attendance
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`
            }
          >
            <Icon className="w-4.5 h-4.5" size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800">
        AI Smart Attendance System v0.1
      </div>
    </aside>
  );
}
