import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bulu Tangkis Pro – Sistem Liga Round-Robin",
  description:
    "Aplikasi manajemen liga bulu tangkis lokal dengan sistem Round-Robin. Buat tim dinamis, jadwal otomatis, papan skor 30 poin, edit nama pemain langsung, dan Hall of Fame Firebase.",
  keywords: ["bulu tangkis", "badminton", "liga", "round-robin", "klasemen", "hall of fame"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
