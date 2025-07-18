import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/common/authContext";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  const { logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 text-center">
          <CardTitle className="text-2xl font-bold text-red-800 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          <p className="text-gray-600 text-base">
            You do not have permission to access this page. Please log in with an
            authorized account or return to the home page.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Log Out
              </Button>
            ) : (
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Login
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}