import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "You Are the COO",
  description: "Run Northstar Cloud through pressure, trade-offs, and growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}