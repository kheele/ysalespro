
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export function CookieNotice() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Check if running on the client side
    if (typeof window !== 'undefined') {
        const consent = localStorage.getItem('cookie_consent');
        if (consent !== 'true') {
            setShowNotice(true);
        }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('cookie_consent', 'true');
    }
    setShowNotice(false);
  };

  if (!showNotice) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-screen-lg mx-auto shadow-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1 md:mt-0" />
                <CardDescription className="text-sm">
                    We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. For more details, please read our {' '}
                    <Link href="/privacy-policy" className="underline hover:text-primary">
                    Privacy Policy
                    </Link>.
                </CardDescription>
            </div>
          <Button onClick={handleAccept} className="w-full md:w-auto flex-shrink-0">
            Accept All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
