import { Geist, Geist_Mono } from "next/font/google";
import AppLayout from "@/components/common/AppLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "ERP System",
    template: "%s | ERP System",
  },
  description: "Modern ERP Management System built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        className={`${geistSans.variable} bg-gray-100 text-gray-900 min-h-screen antialiased`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}