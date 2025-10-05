import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
     <body className={`${pragmatica.variable} antialiased`}>
        {/* Nav Bar */}
        <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-lg font-bold">Ming Jyun Hung</a>
          <nav className="flex gap-6">
            <a href="/projects" className="hover:underline">Projects</a>
            <a href="/about" className="hover:underline">About</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </header>

        <main className="relative z-10 min-h-screen px-6">{children}</main>

        {/* <footer className="relative z-20 border-t px-6 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Ming Jyun Hung. All rights reserved.
        </footer> */}
      </body>
    </html>
  );
}
