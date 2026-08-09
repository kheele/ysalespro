
"use client";

import { AuthContextProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/layout/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthContextProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </AuthContextProvider>
    )
}
