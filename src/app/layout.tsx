import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
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
  title: "ISA Travel Portal - Global Sports Travel",
  description: "Book flights, hotels, and ground transportation with the International Sports Alliance. CTMS 24/7 service.",
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
        {children}
      </body>
    </html>
  );
}
