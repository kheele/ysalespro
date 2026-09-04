"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid work email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";
  const { toast } = useToast();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      toast({ title: "Welcome back!", description: "Successfully logged in to YSalesPro." });
      router.push(redirectTarget);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Welcome back!", description: "Successfully authenticated with Google." });
      router.push(redirectTarget);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Google Authentication Failed",
        description: error.message || "Could not complete Google authentication.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Lock className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Secure SSL
          </span>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Sign In to YSalesPro</CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          Access your B2B sales pipeline, verified decision makers, and outreach campaigns.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold">Work Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="rep@company.com"
                        autoComplete="email"
                        className="pl-9 bg-background/50 border-border/60 text-xs h-9.5 rounded-lg focus-visible:ring-indigo-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold">Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pl-9 pr-9 bg-background/50 border-border/60 text-xs h-9.5 rounded-lg focus-visible:ring-indigo-500"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5 mt-2 transition-all"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-semibold">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-border/60 hover:bg-muted/40 text-xs font-semibold h-10 gap-2 text-foreground"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          <span>Continue with Google Workspace</span>
        </Button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/signup"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
          >
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
