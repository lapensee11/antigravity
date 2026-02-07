import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BAKO - Bakery Management",
  description: "Système de gestion intégré pour boulangerie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        <div className="animate-in fade-in duration-500">
          <QueryProvider>
            {children}
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
