import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FireChronicle — Harmonization of MODIS and VIIRS Hot Spots",
  description:
    "NASA International Space Apps Challenge 2026. Harmonizing 20+ years of satellite active fire records into an interpretable burning activity calendar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}
    >
      <body className="bg-[#090A0C] text-[#F3F4F6] min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
