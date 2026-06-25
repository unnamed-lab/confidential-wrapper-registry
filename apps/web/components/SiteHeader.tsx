"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Wallet, Droplet, Activity } from "lucide-react";
import { Logo } from "./Logo";
import { ConnectWallet } from "./ConnectWallet";

const NAV = [
  { href: "/", label: "Explorer", icon: Compass },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/faucet", label: "Faucet", icon: Droplet },
  { href: "/health", label: "Health", icon: Activity },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030408]/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-space font-semibold tracking-tight group">
            <Logo className="w-7 h-7" />
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent group-hover:to-brand transition-all duration-300">
              Wrapper Registry
            </span>
          </Link>
          
          <nav className="hidden gap-2 sm:flex" aria-label="Primary">
            {NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-md px-3 py-1.5 text-sm font-space font-medium transition-all duration-300 ${
                    isActive
                      ? "text-brand cyber-text-glow bg-brand/5 border border-brand/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="ml-auto">
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-white/5 bg-[#030408]/85 backdrop-blur-lg px-4 py-2 flex items-center justify-around shadow-2xl"
        aria-label="Mobile Navigation"
      >
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-space font-semibold uppercase tracking-wider transition-all duration-300 py-1 px-3.5 rounded-lg ${
                isActive
                  ? "text-brand cyber-text-glow bg-brand/5"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
