import Link from "next/link";
import { BarChart3, Users } from "lucide-react";

export default function DashboardSidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard">
          <span className="flex items-center space-x-2 p-2 rounded hover:bg-blue-50 cursor-pointer">
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </span>
        </Link>
        <Link href="/dashboard/evaluate">
          <span className="flex items-center space-x-2 p-2 rounded hover:bg-blue-50 cursor-pointer">
            <Users className="w-5 h-5" />
            <span>Start Evaluation</span>
          </span>
        </Link>
      </nav>
    </aside>
  );
}
