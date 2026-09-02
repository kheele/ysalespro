"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Zap, Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4 text-foreground">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse">
        <Zap className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        <span>Loading YSalesPro...</span>
      </div>
    </div>
  );
}
