import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Rechat Lead Capture Demo",
  description:
    "Rechat Lead Capture API integration demo - Test and demonstrate the Rechat Lead Capture API.",
  keywords: "real estate, properties, homes, lead capture, rechat api, property listings",
  authors: [{ name: "Rechat" }],
  openGraph: {
    title: "Rechat Lead Capture Demo",
    description:
      "Rechat Lead Capture API integration demo - Test and demonstrate the Rechat Lead Capture API.",
    type: "website",
    siteName: "Rechat Lead Capture Demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rechat Lead Capture Demo",
    description:
      "Rechat Lead Capture API integration demo - Test and demonstrate the Rechat Lead Capture API.",
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
