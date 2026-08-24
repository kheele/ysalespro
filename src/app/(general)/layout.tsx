
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  ArrowLeft,
} from "lucide-react";
import { GeneralHeroProvider } from './_context/GeneralHeroContext';
import { GeneralHero } from "./_components/GeneralHero";

export default function GeneralLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GeneralHeroProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border/40 bg-card backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg">YSalesPro</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/help">
                <Button variant="ghost" size="sm" className="text-xs h-8">Help Center</Button>
              </Link>
              <Link href="/faq">
                <Button variant="ghost" size="sm" className="text-xs h-8">FAQs</Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="text-xs h-8">Contact Us</Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" size="sm" className="text-xs h-8">About Us</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs h-8">Sign In</Button>
              </Link>
              <Link href="/">
                <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <GeneralHero />

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full space-y-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 py-6 mt-4 bg-card/20 text-xs text-muted-foreground">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/help" className="hover:text-foreground">Help</Link>
              <Link href="/faq" className="hover:text-foreground">FAQs</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/licenses" className="hover:text-foreground">Licenses</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/acceptable-use" className="hover:text-foreground">Acceptable Use</Link>
              <Link href="/cookie-policy" className="hover:underline">Cookies</Link>
            </div>
            <p>© {new Date().getFullYear()} YSalesPro. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </GeneralHeroProvider>
  );
}
