import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Bakery SAAS",
  description: "Modern Bakery Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.className} antialiased min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
