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
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldAlert, KeyRound } from "lucide-react";

const formSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || searchParams.get("code");
  const { toast } = useToast();
  const { confirmPasswordResetWithCode, verifyResetCode } = useAuth();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(!!oobCode);
  const [accountEmail, setAccountEmail] = React.useState("");
  const [invalidCode, setInvalidCode] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    async function checkCode() {
      if (!oobCode) {
        setInvalidCode(true);
        setIsVerifying(false);
        return;
      }
      setIsVerifying(true);
      try {
        const email = await verifyResetCode(oobCode);
        setAccountEmail(email);
        setInvalidCode(false);
      } catch (error) {
        console.error("Invalid reset code:", error);
        setInvalidCode(true);
      } finally {
        setIsVerifying(false);
      }
    }
    checkCode();
  }, [oobCode, verifyResetCode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!oobCode) return;
    setIsLoading(true);
    try {
      await confirmPasswordResetWithCode(oobCode, values.password);
      setIsSuccess(true);
      toast({ title: "Password Reset Complete", description: "You can now log in with your new password." });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset password. The link may have expired.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifying) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl p-8 rounded-2xl text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Verifying password reset security link...</p>
      </Card>
    );
  }

  if (invalidCode && !isSuccess) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Invalid or Expired Link</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            This password reset link is invalid or has already expired for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/forgot-password" passHref className="block w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-10 font-semibold gap-1.5">
              Request a New Reset Link <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/login" passHref className="block w-full">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Password Reset Successfully</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Your account credentials have been updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" passHref className="block w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-10 font-semibold gap-1.5">
              Sign In to Your Account <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {accountEmail ? `Resetting password for ${accountEmail}` : "Enter your new password below."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pl-9 pr-9 bg-background/50 border-border/60 text-xs h-9"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold">Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pl-9 pr-9 bg-background/50 border-border/60 text-xs h-9"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Updating Password...
                </>
              ) : (
                <>
                  Reset Password <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}
