import { FileText, Home, School, Settings } from "lucide-react";
import { SiMinetest, SiVitest } from "react-icons/si";


const adminPages = [
  { label: "Overview", icon: Home, href: "/admin/dashboard" },
  { label: "Schools Identified", icon: School, href: "/admin/schools" },
  { label: "Evaluations", icon: SiMinetest, href: "/admin/evaluations" },
  { label: "Evaluate", icon: SiVitest, href: "/admin/evaluate" },
  // { label: "Results", icon: ListChecks, href: "/admin/results" },
  {
    label: "Evaluation Options",
    icon: FileText,
    href: "/admin/evaluation-options",
  },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const teacherPages = [
  { label: "Evaluate", icon: SiVitest, href: "/teacher/evaluate" },
  { label: "Settings", icon: Settings, href: "/teacher/settings" },
];

export const getNavItems = (role: string | null) => {
  if (role == "Admin") return adminPages;
  else return teacherPages;
};
