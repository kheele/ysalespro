"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieNotice() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const accepted = localStorage.getItem("cookies-accepted");
        if (!accepted) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookies-accepted", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">We use cookies</h4>
                    <p className="text-xs text-muted-foreground">
                        We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setIsVisible(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={handleAccept} className="w-full md:w-auto">
                    Accept
                </Button>
            </div>
        </div>
    );
}
