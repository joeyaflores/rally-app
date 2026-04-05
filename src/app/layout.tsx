import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Bebas_Neue } from "next/font/google";
import { MobileNav } from "@/components/dashboard-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import config from "@rally";
import "./globals.css";

const madeMirage = localFont({
  src: "../fonts/made-mirage-bold.otf",
  variable: "--font-display",
  display: "swap",
});

const coolvetica = localFont({
  src: "../fonts/coolvetica.otf",
  variable: "--font-body",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-stat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const desc = `Operational dashboard for ${config.fullName} — ${config.location}`;

export const metadata: Metadata = {
  title: {
    default: `${config.fullName} — Dashboard`,
    template: `%s | ${config.fullName}`,
  },
  description: desc,
  metadataBase: new URL(config.url),
  openGraph: {
    title: `${config.fullName} — Dashboard`,
    description: desc,
    siteName: config.fullName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.fullName} — Dashboard`,
    description: desc,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon",
  },
  other: {
    "theme-color": config.theme.primary,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${madeMirage.variable} ${coolvetica.variable} ${bebasNeue.variable} antialiased`}
        style={{ backgroundColor: "#F8F5F0" }}
        suppressHydrationWarning
      >
        <TooltipProvider>
          {children}
          <Suspense>
            <MobileNav />
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
