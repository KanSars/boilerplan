import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/app/StoreProvider";
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
  title: "Планировка котельной v0",
  description: "Инженерное приложение для компоновки котельной на основе доменной модели",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
