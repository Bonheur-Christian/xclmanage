import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/common/authContext";
import Provider from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School Evaluation System",
  description: "Comprehensive school leader evaluation and insights tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <Providers>
            <AuthProvider>
              <Toaster position="top-right" />
              {children}
            </AuthProvider>
          </Providers>
        </Provider>
      </body>
    </html>
  );
}
