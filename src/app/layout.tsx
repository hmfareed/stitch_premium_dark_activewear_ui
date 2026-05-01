import type { Metadata } from "next";
import "./globals.css";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "REED STORE | Premium Activewear",
  description: "Premium activewear for elite performance. Shoes, Apparel, Watches & Accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
