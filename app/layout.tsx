import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import PersistentScene from "@/components/layout/PersistentScene";

const pragmatica = localFont({
  src: [
    { path: "../public/fonts/pragmatica/Pragmatica_Book.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/pragmatica/Pragmatica_Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/pragmatica/Pragmatica_Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/pragmatica/Pragmatica_Black.otf", weight: "900", style: "normal" },
    { path: "../public/fonts/pragmatica/Pragmatica_Book_Obl.otf", weight: "400", style: "italic" },
    { path: "../public/fonts/pragmatica/Pragmatica_Bold_Obl.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-pragmatica",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});



export const metadata: Metadata = {
  title: "Ming Jyun Hung | Creative Technologist",
  description: "Creative Technologist | Technical Artist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className={`${pragmatica.variable} antialiased`}>
        {/* Persistent background scene - runs across all routes */}
        <PersistentScene />

        {/* Nav Bar */}
        <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold">Ming Jyun Hung</Link>
          <nav className="flex gap-6">
            <Link href="/projects" className="hover:underline">Projects</Link>
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </nav>
        </header>

        {/* Main content area - pointer-events-none allows scene interaction on empty pages */}
        <main className="relative z-10 min-h-screen px-6 pointer-events-none">{children}</main>

        {/* <footer className="relative z-20 border-t px-6 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Ming Jyun Hung. All rights reserved.
        </footer> */}
      </body>
    </html>
  );
}
