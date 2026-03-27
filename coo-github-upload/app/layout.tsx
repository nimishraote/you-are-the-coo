import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "You Are the COO",
  description: "A premium decision-based COO simulation set inside Northstar Cloud.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
