import { Logo } from "@/components/icons/logo";
import { CookieNotice } from "@/components/cookie-notice";
import { CheckCircle2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/60" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Logo className="w-10 h-10 text-primary-foreground" />
            <span className="text-2xl font-bold tracking-tight">SafetyFilePro</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Manage your safety files with confidence and ease.
            </h1>
            <p className="text-lg text-zinc-300">
              The most comprehensive solution for safety compliance, document management, and real-time collaboration.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Secure Document Storage</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Real-time Collaboration</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Automated Compliance Checks</span>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-400">
          © {new Date().getFullYear()} SafetyFilePro. All Rights Reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">SafetyFilePro</span>
            </div>
          </div>

          {children}
        </div>
      </div>

      <CookieNotice />
    </div>
  );
}
