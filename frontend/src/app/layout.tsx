import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-nasa-dark text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
