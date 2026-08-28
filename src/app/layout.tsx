import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bulu Tangkis Pro – Manajemen Turnamen Double Elimination",
  description:
    "Aplikasi manajemen turnamen bulu tangkis lokal dengan sistem Double Elimination Bracket. Input pemain, acak tim, dan catat skor dengan aturan BWF resmi.",
  keywords: ["bulu tangkis", "badminton", "turnamen", "double elimination", "bracket"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
