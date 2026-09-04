"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Loader2, Mail, KeyRound, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid work email." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const { sendPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordReset(values.email);
      setSubmittedEmail(values.email);
      setIsSent(true);
      toast({ title: "Email Dispatched", description: "Password reset instructions sent to your email." });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Reset Request Failed",
        description: error.message || "Failed to send password reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSent) {
    return (
      <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Check Your Inbox</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            We sent a secure password reset link to{" "}
            <strong className="text-foreground font-semibold">{submittedEmail}</strong>.
            Click the link in the message to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" passHref className="block w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5">
              Back to Sign In <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSent(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Didn&apos;t receive the email? Try another address
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <KeyRound className="h-4 w-4" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Reset Your Password</CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          Enter the work email associated with your YSalesPro account to receive password recovery instructions.
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
                  <FormLabel className="text-xs font-semibold">Registered Work Email</FormLabel>
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
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5 mt-2 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending Link...
                </>
              ) : (
                <>
                  Send Recovery Link <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
