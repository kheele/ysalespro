"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Zap, Loader2 } from "lucide-react";

// List of public routes that unauthenticated users can access
const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/account-completion",
  "/help",
  "/faq",
  "/about",
  "/contact",
  "/licenses",
  "/terms",
  "/privacy",
  "/acceptable-use",
  "/cookie-policy",
  "/api",
];

// List of auth-only routes (if already logged in, redirect to dashboard)
const AUTH_ONLY_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = React.useMemo(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }, [pathname]);

  const isAuthOnlyRoute = React.useMemo(() => {
    if (!pathname) return false;
    return AUTH_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  }, [pathname]);

  React.useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      const redirectUrl = pathname && pathname !== "/"
        ? `/login?redirect=${encodeURIComponent(pathname)}`
        : "/login";
      router.replace(redirectUrl);
    } else if (user && isAuthOnlyRoute) {
      router.replace("/dashboard");
    }
  }, [user, loading, isPublicRoute, isAuthOnlyRoute, pathname, router]);

  // While checking auth status on a protected route, show a sleek branded loading screen
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4 text-foreground">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and on a protected route, prevent flash of protected content before redirect
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
