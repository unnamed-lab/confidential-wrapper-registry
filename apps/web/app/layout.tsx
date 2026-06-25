import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description:
    "Surface, wrap, unwrap and decrypt every Zama ERC-20 ↔ ERC-7984 confidential wrapper pair on Sepolia and mainnet.",
  openGraph: {
    title: "Confidential Wrapper Registry",
    description:
      "Surface, wrap, unwrap and decrypt every Zama ERC-20 ↔ ERC-7984 confidential wrapper pair on Sepolia and mainnet.",
    images: [
      {
        url: "https://og-image.vercel.app/Confidential%20Wrapper%20Registry.png?theme=dark&md=1&fontSize=125px",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Confidential Wrapper Registry",
    description:
      "Surface, wrap, unwrap and decrypt every Zama ERC-20 ↔ ERC-7984 confidential wrapper pair on Sepolia and mainnet.",
    images: ["https://og-image.vercel.app/Confidential%20Wrapper%20Registry.png?theme=dark&md=1&fontSize=125px"],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${outfit.variable} antialiased font-outfit`}>
        <div className="cyber-bg-overlay">
          <div className="cyber-grid" />
          <div className="cyber-glow-top" />
          <div className="cyber-glow-right" />
          <div className="cyber-glow-left" />
        </div>
        <Providers>
          <SiteHeader />
          <main className="relative mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:pb-8 z-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
