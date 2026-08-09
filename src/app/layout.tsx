
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Providers } from './providers';
import { CookieNotice } from '@/components/layout/cookie-notice';
import Script from 'next/script';
import { DeviceRegistration } from '@/components/layout/device-registration';


const ONLYOFFICE_API_URL = "https://docs-online.cloud.sheqintel.com/web-apps/apps/api/documents/api.js";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <Providers>
          {children}
          <DeviceRegistration />
        </Providers>
        <Toaster />
        <CookieNotice />
        <Script 
          id="onlyoffice-script"
          src={ONLYOFFICE_API_URL} 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
