import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "./globals.css";
import { siteSettings } from "@/data/portfolio";

export const metadata: Metadata = {
  title: siteSettings.title,
  description: siteSettings.description,
  applicationName: "Alvin Portfolio",
  keywords: ["portfolio", "graphic designer", "digital creator", "Alvin", "Indonesia"],
  openGraph: {
    title: siteSettings.title,
    description: siteSettings.description,
    locale: "id_ID",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
