import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coo.nimishraote.com";
const description = "You Are the COO by Nimish Raote is an interactive executive decision simulation where you run Northstar Cloud through high-pressure choices across clients, budgets, people, product launches, and risk.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "You Are the COO by Nimish Raote | Executive Decision Simulation",
  description,
  authors: [{ name: "Nimish Raote", url: "https://nimishraote.com/" }],
  creator: "Nimish Raote",
  publisher: "Nimish Raote",
  keywords: ["You Are the COO", "Nimish Raote", "COO simulation", "executive decision simulation", "leadership simulation", "business strategy game"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: siteUrl, siteName: "You Are the COO", title: "You Are the COO by Nimish Raote", description },
  twitter: { card: "summary", title: "You Are the COO by Nimish Raote", description },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://nimishraote.com/#nimish-raote",
    name: "Nimish Raote",
    url: "https://nimishraote.com/",
    sameAs: ["https://www.linkedin.com/in/nimish-raote-1342697/"],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#you-are-the-coo`,
    name: "You Are the COO",
    alternateName: "You Are the COO by Nimish Raote",
    url: siteUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description,
    creator: { "@id": "https://nimishraote.com/#nimish-raote" },
    author: { "@id": "https://nimishraote.com/#nimish-raote" },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
