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
  title: "Ming Jyun Hung",
  description: "Creative Technologist | Technical Artist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Nav Bar */}
        <header className="w-full border-b px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-lg font-bold">Ming Jyun Hung</a>
          <nav className="flex gap-6">
            <a href="/projects" className="hover:underline">Projects</a>
            <a href="/about" className="hover:underline">About</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </header>

        <main className="min-h-screen px-6">{children}</main>

        <footer className="border-t px-6 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Ming Jyun Hung. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
