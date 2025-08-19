import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { PropertyProvider } from "@/lib/context/property-context";
import { SidebarProvider } from "@/lib/context/sidebar-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "InnSync - Property Management System",
  description: "Modern property management system for Indonesian hotels and vacation rentals",
  keywords: ["hotel", "property management", "indonesia", "PMS", "booking"],
  authors: [{ name: "InnSync Team" }],
  openGraph: {
    title: "InnSync - Property Management System",
    description: "Modern property management system for Indonesian hotels",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <PropertyProvider>
              <SidebarProvider>
                {children}
                <Toaster richColors position="top-right" />
              </SidebarProvider>
            </PropertyProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
