import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitness Coaching Platform",
  description: "Edzések, kliensek és fejlődés követése egy helyen.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fitness Coach",
  },
  themeColor: "#09090b",
};

import { TooltipProvider } from "@/components/ui/tooltip"
import { PwaRegistrar } from "@/components/pwa-registrar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
