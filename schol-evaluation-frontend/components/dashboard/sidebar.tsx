"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiMinetest } from "react-icons/si";
import {
  Home,
  School,
  ListChecks,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SiVitest } from "react-icons/si";
import { useState } from "react";
import LogoutIcon from "@/public/icons/Logout";
import { LogoutDialog } from "../dialogs/Logout";
import { getNavItems } from "@/features/common/Siderbar-slice";
import { getUserRole } from "@/features/common/authUtil";

export function Sidebar() {
  const pathname = usePathname();
  const role = getUserRole();
  const navItems = getNavItems(role);

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Handle logout confirmation
  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };
  const handleLogoutCancel = () => {
    setIsLogoutDialogOpen(false);
  };
  const handleLogoutConfirm = () => {
    handleLogout();
  };
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside
      className="flex h-screen w-full flex-col bg-blue-50 border-r overflow-hidden md:sticky top-0 left-0"
      aria-label="Sidebar navigation"
    >
      <div className="flex h-1/13 items-center border-b px-4 sm:px-6">
        <h1 className="text-base sm:text-lg font-semibold truncate">
          School Evaluation
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-2 sm:p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              tabIndex={0}
            >
              <Icon size={18} className="sm:size-[20px]" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2 sm:p-4">
        <button
          onClick={handleLogoutClick}
          className={cn(
            "flex items-center rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300 ease-in-out gap-2 p-2"
          )}
          title={"Logout"}
        >
          <LogoutIcon
            width={20}
            height={20}
            className="flex-shrink-0 transition-all duration-300 ease-in-out"
          />
          Logout
          <LogoutDialog
            isOpen={isLogoutDialogOpen}
            onClose={handleLogoutCancel}
            onConfirm={handleLogoutConfirm}
          />{" "}
        </button>
      </div>
    </aside>
  );
}
