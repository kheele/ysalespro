"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { User as UserType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Loader2,
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { completionAccountActionByToken } from "@/services/private/userService";

const formSchema = z.object({
  fname: z.string().min(1, { message: "First name is required." }),
  lname: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email(),
  phone: z.string().optional(),
  account_company: z.string().min(2, { message: "Company name must be at least 2 characters." }),
});

function AccountCompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const { user, loading, dbUser, setDbUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      phone: "",
      account_company: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      const [fname, ...lnameParts] = user.displayName?.split(" ") || ["", ""];
      form.reset({
        fname: fname || dbUser?.fname || "",
        lname: lnameParts.join(" ") || dbUser?.lname || "",
        email: user.email || dbUser?.email || "",
        phone: dbUser?.phone || "",
        account_company: dbUser?.account_company?.name || "",
      });
    }
  }, [user, dbUser, form]);

  React.useEffect(() => {
    if (!loading && dbUser?.account_company?.name) {
      router.push("/dashboard");
    }
  }, [loading, dbUser, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
      return;
    }
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken(true);
      const updatedUser = await completionAccountActionByToken(idToken, {
        ...values,
        account_company: { name: values.account_company } as any,
        invitation_token: token || undefined,
      });

      setDbUser((prevDbUser) => {
        if (!prevDbUser) return null;
        return {
          ...prevDbUser,
          ...values,
          id: updatedUser.userId || prevDbUser.id,
          account_company: { name: values.account_company } as any,
        };
      });

      toast({ title: "Account Initialized", description: "Your workspace profile has been successfully saved." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred while saving your profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center gap-2.5 text-center">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              YSalesPro
            </span>
          </Link>
          <p className="text-xs text-muted-foreground font-medium">Enterprise Intelligence Onboarding</p>
        </div>

        <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4 rounded-2xl">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Account Setup
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Complete Your Organization
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Confirm your name and company details to configure your sales workspace and prospect databases.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="fname"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold">First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="John"
                              className="pl-9 bg-background/50 border-border/60 text-xs h-9 rounded-lg focus-visible:ring-indigo-500"
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
                    name="lname"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold">Last Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Doe"
                              className="pl-9 bg-background/50 border-border/60 text-xs h-9 rounded-lg focus-visible:ring-indigo-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold">Account Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            className="pl-9 bg-muted/40 border-border/60 text-xs h-9 rounded-lg cursor-not-allowed text-muted-foreground"
                            {...field}
                            disabled
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_company"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold">Company / Organization Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Acme Revenue Systems"
                            className="pl-9 bg-background/50 border-border/60 text-xs h-9 rounded-lg focus-visible:ring-indigo-500"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold">Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+1 (555) 123-4567"
                            className="pl-9 bg-background/50 border-border/60 text-xs h-9 rounded-lg focus-visible:ring-indigo-500"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5 mt-3 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving Configuration...
                    </>
                  ) : (
                    <>
                      Save and Enter Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AccountCompletionPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <AccountCompletionContent />
    </React.Suspense>
  );
}
