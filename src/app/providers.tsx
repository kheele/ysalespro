
"use client";

import { AuthContextProvider } from "@/hooks/use-auth";
import { SettingsProvider } from "@/hooks/use-settings";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthGuard } from "@/components/layout/auth-guard";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthContextProvider>
            <SettingsProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </ThemeProvider>
            </SettingsProvider>
        </AuthContextProvider>
    )
}
