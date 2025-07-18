"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, useAuth } from "@/features/common/authContext";

export default function HomePage() {
  const {isAuthenticated} = useAuth()
  const router = useRouter();
  const role = getUserRole()

  useEffect(() => {
    if (isAuthenticated || role) {
      setTimeout(() => {
        if (role?.toLowerCase() === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/teacher/evaluate");
        }
      }, 1000); // 1 second delay for debugging
    } else {
    
      setTimeout(() => {
        router.push("/login");
      }, 1000); // 1 second delay for debugging
    }
  }, [ role]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">School Evaluation System</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
