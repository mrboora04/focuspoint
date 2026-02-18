import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // 1. Import the font
import "./globals.css";
import { FocusProvider } from "@/context/FocusContext";
import Navigation from "@/components/Navigation";
import GlobalOverlays from "@/components/GlobalOverlays";

// 2. Configure the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FocusPoint",
  description: "High-performance challenge tracker",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F78320",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class to the body */}
      <body className={`${inter.className} bg-theme-bg text-theme-text antialiased transition-colors duration-300`}>
        <FocusProvider>
          <Navigation />
          <div className="pt-16 min-h-screen">
            {children}
          </div>
          <GlobalOverlays />
        </FocusProvider>
      </body>
    </html>
  );
}
