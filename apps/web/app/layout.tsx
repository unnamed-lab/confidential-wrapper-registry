import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description:
    "Surface, wrap, unwrap and decrypt every Zama ERC-20 ↔ ERC-7984 confidential wrapper pair on Sepolia and mainnet.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
