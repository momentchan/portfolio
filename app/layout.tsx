import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PersistentScene from "@site/_shared/PersistentScene";
import Navigation from "@site/_shared/ui/navigation/Navigation";
import PathTrackerProvider from "@site/_shared/providers/PathTrackerProvider";
import MainContent from "@/app/(site)/_shared/layout/MainContent";
import ViewportHeightProvider from "@site/_shared/providers/ViewportHeightProvider";
import MobileDetectorProvider from "@site/_shared/providers/MobileDetectorProvider";

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
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pragmatica.variable} antialiased`}>
        <ViewportHeightProvider>
          {/* Initialize mobile detection */}
          <MobileDetectorProvider />

          {/* Track current and previous paths */}
          <PathTrackerProvider />

          {/* Persistent background scene - pauses on other pages */}
          <PersistentScene />

          {/* Nav Bar - preserves query parameters like ?dev=true */}
          <Navigation />

          {/* Main content area - pointer-events-none on homepage allows scene interaction */}
          <MainContent>{children}</MainContent>

        </ViewportHeightProvider>
      </body>
    </html>
  );
}
