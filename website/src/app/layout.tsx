import type { Metadata } from "next";
import { Syne, Poppins } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://size-passport.vercel.app'),
  title: "Size Passport - AI-Powered Size Recommendation",
  description: "Reduce apparel returns and boost shopper confidence with our intelligent Smart Fit Profiler and AI Size Engine.",
  keywords: ["Shopify", "Shopify App", "Size Recommendation", "AI Fitting", "Reduce Returns", "Apparel Sizing", "E-commerce Optimization", "Fit Profiler"],
  authors: [{ name: "Size Passport" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Size Passport - AI-Powered Size Recommendation",
    description: "Reduce apparel returns and boost shopper confidence with our intelligent Smart Fit Profiler and AI Size Engine.",
    siteName: "Size Passport",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Size Passport Dashboard and AI Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Size Passport - AI-Powered Size Recommendation",
    description: "Reduce apparel returns and boost shopper confidence with our intelligent Smart Fit Profiler and AI Size Engine.",
    images: ["/logo.jpg"],
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${poppins.variable} font-poppins antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
