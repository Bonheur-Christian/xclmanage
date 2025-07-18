"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop, Drawer for mobile */}
      <div className="hidden sm:block xl:w-[18.13%]  ">
        <Sidebar />
      </div>
      <div className="block sm:hidden ">
        {/* Mobile menu button */}
        <button
          aria-label="Open sidebar menu"
          className={`absolute top-2 left-2 z-50 p-2 rounded-md bg-white shadow sm:hidden ${sidebarOpen && 'hidden'}`}
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Overlay and drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar overlay"
            />
            <div className="relative w-64 bg-white border-r shadow-lg animate-slide-in-left">
              <Sidebar />
              <button
                aria-label="Close sidebar menu"
                className="absolute top-2 right-2 p-2 rounded-md bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="bg-gray-50 px-2 py-2 sm:px-4 md:px-8 lg:px-12 xl:px-4 2xl:px-12 w-full h-12/12 max-h-screen overflow-y-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
