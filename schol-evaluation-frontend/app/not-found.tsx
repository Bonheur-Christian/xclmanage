"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
      // Redirect to home page after a short delay
      const timer = setTimeout(() => {
        router.push('/');
      }, 5000);

      return () => clearTimeout(timer);
    }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Loader2 className="animate-spin h-5 w-5" />
          <span>Redirecting you to the home page...</span>
        </div>
        <div className="py-6">
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg">
            <Link href="/">Go home</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
