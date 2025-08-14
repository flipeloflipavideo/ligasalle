import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AdminProvider } from "@/components/auth/admin-provider";
import { AdminButton } from "@/components/auth/admin-button";
import { ClientLayout } from "@/app/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Ligas Deportivas",
  description: "Sistema completo para la gestión de ligas deportivas escolares, desarrollado con Next.js 15, TypeScript y Prisma ORM.",
  keywords: ["ligas deportivas", "fútbol", "baloncesto", "gestión deportiva", "Next.js", "TypeScript", "Prisma"],
  authors: [{ name: "Sistema de Ligas Deportivas" }],
  openGraph: {
    title: "Sistema de Gestión de Ligas Deportivas",
    description: "Gestión completa de ligas deportivas escolares",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Gestión de Ligas Deportivas",
    description: "Gestión completa de ligas deportivas escolares",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AdminProvider>
          <ClientLayout>{children}</ClientLayout>
          <AdminButton />
          <Toaster />
        </AdminProvider>
      </body>
    </html>
  );
}
