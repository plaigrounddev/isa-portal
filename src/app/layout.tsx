import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fontAnton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ISA.TRAVEL — International Sports Alliance Travel Portal",
  description:
    "Book flights, hotels, and ground transportation for athletes and families worldwide. Powered by CTMS Travel with 24/7 agent support.",
  keywords: [
    "ISA",
    "International Sports Alliance",
    "sports travel",
    "athlete travel",
    "CTMS Travel",
    "flight booking",
    "hotel booking",
    "ground transportation",
    "corporate travel",
    "group travel",
  ],
  authors: [{ name: "CTMS Travel" }],
  creator: "CTMS Travel",
  metadataBase: new URL("https://portal.isatravel.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portal.isatravel.com",
    siteName: "ISA.TRAVEL",
    title: "ISA.TRAVEL — Global Sports Travel, Operated at Scale",
    description:
      "International travel coordination, multi-event schedules, and premium logistics support for athletes and families. Powered by CTMS Travel.",
    images: [
      {
        url: "https://cdn.prod.website-files.com/687ea668cab796cde037ec77/687eab9a0da958d1193d0ffc_Logo-p-500.png",
        width: 500,
        height: 500,
        alt: "ISA Travel Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISA.TRAVEL — Global Sports Travel, Operated at Scale",
    description:
      "Book flights, hotels & ground transport for athletes and families. 24/7 CTMS agent support.",
    images: [
      "https://cdn.prod.website-files.com/687ea668cab796cde037ec77/687eab9a0da958d1193d0ffc_Logo-p-500.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
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
        className={`${fontInter.variable} ${fontAnton.variable} antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
