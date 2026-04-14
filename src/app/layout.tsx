import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { MobileNav } from "@/components/dashboard-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import config from "@rally";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
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
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
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
        className={`${fraunces.variable} ${dmSans.variable} antialiased`}
        style={{ backgroundColor: "#FDFBF4" }}
        suppressHydrationWarning
      >
        <TooltipProvider>
          {children}
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
