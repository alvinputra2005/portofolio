import type { Metadata, Viewport } from "next";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/outfit";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./globals.css";
import "./reference-home.css";
import { siteSettings } from "@/data/portfolio";
import { LanguageProvider } from "@/components/language-provider";

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
  return <html lang="id"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
