import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tatárka Dénes Edzés & Étrend",
  description: "Edzések, kliensek és fejlődés követése egy helyen.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tatárka Dénes Edzés & Étrend",
  },
};

export const viewport = {
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
      className={`${inter.variable} ${montserrat.variable} h-full antialiased dark`}
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
