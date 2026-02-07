import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Import the font
import "./globals.css";

// 2. Configure the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FocusPoint",
  description: "High-performance challenge tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class to the body */}
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
