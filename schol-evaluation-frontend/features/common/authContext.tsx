'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText, Home, School, Settings } from "lucide-react";
import { SiMinetest, SiVitest } from "react-icons/si";

// Define allowed roles
type UserRole = "Admin" | "Teacher" | null;

// Define user type (adjust based on your actual user structure)
interface User {
  id?: string;
  username?: string;
  email?: string;
  // Add other user properties as needed
}

// Define navigation item type
interface NavItem {
  label: string;
  icon: any; // React component for icons
  href: string;
}

// Navigation items from your original code
const adminPages: NavItem[] = [
  { label: "Overview", icon: Home, href: "/dashboard" },
  { label: "Schools Identified", icon: School, href: "/dashboard/schools" },
  { label: "Evaluations", icon: SiMinetest, href: "/dashboard/evaluations" },
  { label: "Evaluate", icon: SiVitest, href: "/dashboard/evaluate" },
  { label: "Evaluation Options", icon: FileText, href: "/dashboard/evaluation-options" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const teacherPages: NavItem[] = [
  { label: "Evaluate", icon: SiVitest, href: "/dashboard/evaluate" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Define allowed routes for each role
const rolePermissions: Record<string, string[]> = {
  Admin: adminPages.map((page) => page.href),
  Teacher: teacherPages.map((page) => page.href),
  null: [], // No access for unauthenticated users
};

// Utility functions for localStorage (from your original code)
export const saveUser = (user: User) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
};

export const saveUserRole = (role: UserRole) => {
  if (typeof window === "undefined") {
    console.warn("Cannot save user role, window is undefined");
    return;
  }
  localStorage.setItem("role", role || "");
};

export const getUserRole = (): UserRole => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role") as UserRole;
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

// Clear user data on logout
export const clearUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};

// Auth context type
interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  setAuth: (user: User | null, role: UserRole) => void;
  logout: () => void;
  getNavItems: () => NavItem[];
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = getUser();
    const storedRole = getUserRole();
    if (storedUser && storedRole && ["Admin", "Teacher"].includes(storedRole)) {
      setUser(storedUser);
      setRole(storedRole as UserRole);
      setIsAuthenticated(true);
    } else {
      console.log("the stored role is :=> ", storedRole, "is authed: => ", isAuthenticated, "stored user: => ", storedUser)
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      clearUser(); // Clear invalid or missing data
    }
  }, []);

  // Set authentication state
  const setAuth = (newUser: User | null, newRole: UserRole) => {
    if (newUser && newRole && ["Admin", "Teacher"].includes(newRole)) {
      saveUser(newUser);
      saveUserRole(newRole);
      setUser(newUser);
      setRole(newRole);
      setIsAuthenticated(true);
    } else {
      clearUser();
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      console.log("routing")
      router.push("/login");
    }
  };

  // Handle logout
  const logout = () => {
    clearUser();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Get navigation items based on role
  const getNavItems = () => {
    if (role === "Admin") return adminPages;
    return teacherPages;
  };

  return (
    <AuthContext.Provider
      value={{ user, role, isAuthenticated, setAuth, logout, getNavItems }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Role-protected route component
export const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) => {
  const { isAuthenticated } = useAuth();
  const role = getUserRole();
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  console.log("the role and the router is :", isAuthenticated, role)
  useEffect(() => {
    if (!isAuthenticated && !role) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, role, allowedRoles]);

  if (!isAuthenticated || !allowedRoles.includes(role)) {
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
};