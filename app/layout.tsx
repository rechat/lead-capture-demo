import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Premier Properties - Real Estate Demo",
  description:
    "Rechat Lead Capture API integration demo - Find your dream home with our premium property listings and contact our expert agents.",
  keywords: "real estate, properties, homes, lead capture, rechat api, property listings",
  authors: [{ name: "Premier Properties" }],
  openGraph: {
    title: "Premier Properties - Real Estate Demo",
    description:
      "Rechat Lead Capture API integration demo - Find your dream home with our premium property listings and contact our expert agents.",
    type: "website",
    siteName: "Premier Properties",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premier Properties - Real Estate Demo",
    description:
      "Rechat Lead Capture API integration demo - Find your dream home with our premium property listings and contact our expert agents.",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
