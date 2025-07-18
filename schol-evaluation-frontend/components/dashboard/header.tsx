"use client";

import { getUser } from "@/features/common/authUtil";
import { GraduationCap } from "lucide-react";

export function Header() {
  const userData = getUser();

  return (
    <header className="flex flex-wrap h-1/13 items-center justify-between border-b bg-white px-2 sm:px-4 md:px-6 shadow-sm gap-y-2 pl-12 sm:pl-2 py-4 z-1000 sticky top-0">
      <div
        className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 flex-1 min-w-0"
        aria-label="App branding"
      >
        <div className="flex items-center xl:gap-4 min-w-0 ml-6 gap-2 sm:ml-0">
          <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="sm:text-2xl text-xl font-bold text-gray-900 truncate">
              School Leadership Evaluation Tool
            </h1>
            {/* <p className="text-xs sm:text-sm text-gray-600">Teacher Perception Assessment System</p> */}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <span
          className="font-medium text-xs sm:text-base truncate"
          aria-label="User name"
        >
          {userData?.name || "User"}
        </span>
      </div>
    </header>
  );
}
