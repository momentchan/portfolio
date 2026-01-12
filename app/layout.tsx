import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PersistentScene from "@site/_shared/PersistentScene";
import Navigation from "@site/_shared/ui/navigation/Navigation";
import PathTrackerProvider from "@site/_shared/providers/PathTrackerProvider";
import MainContent from "@/app/(site)/_shared/layout/MainContent";
import ViewportHeightProvider from "@site/_shared/providers/ViewportHeightProvider";
import MobileDetectorProvider from "@site/_shared/providers/MobileDetectorProvider";
import ErudaConsole from "@site/_shared/ui/ErudaConsole";

const inter = localFont({
  src: [
    { path: "../public/fonts/Inter/static/Inter_18pt-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Inter/static/Inter_18pt-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter/static/Inter_18pt-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Inter/static/Inter_18pt-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../public/fonts/Inter/static/Inter_18pt-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/Inter/static/Inter_18pt-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});



export const metadata: Metadata = {
  title: "Ming Jyun Hung | Creative Technologist",
  description:
    "Portfolio of Ming Jyun Hung — Creative Technologist and Technical Artist specializing in real-time graphics, interactive installations, and Web-based experiences.",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  metadataBase: new URL("https://mingjyunhung.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
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

          {/* Eruda mobile console - loads on mobile devices or with ?dev=true */}
          <ErudaConsole />

        </ViewportHeightProvider>
      </body>
    </html>
  );
}
