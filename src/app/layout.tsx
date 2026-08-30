import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CloudDataProvider } from "@/components/layout/cloud-data-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_ORIGIN } from "@/lib/site";
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
  metadataBase: new URL(SITE_ORIGIN),
  title: "RoleFit | Resume matching for career switchers",
  description:
    "RoleFit: AI resume workspace for career switchers — JD match diagnosis, quantified follow-ups, outreach, and application tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <CloudDataProvider>
            <div className="flex min-h-full flex-1 flex-col">
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </CloudDataProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
