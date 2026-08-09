
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import type { User } from "@/lib/types";
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
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { validateContractorInviteAction } from "@/services/contractorService";
import { completionAccountByToken } from "@/services/userService";

const formSchema = z.object({
  fname: z.string().min(1, { message: "First name is required." }),
  lname: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().min(2, { message: "Company name must be at least 2 characters." }),
});

export default function AccountCompletionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const { user, loading, dbUser, setDbUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [invitationData, setInvitationData] = React.useState<{ companyName: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      phone: "",
      organization: "",
    },
  });

  React.useEffect(() => {
    async function fetchInvitation() {
      if (!token) return;
      try {
        const data = await validateContractorInviteAction(token);
        setInvitationData(data);
        form.setValue('organization', data.companyName);
      } catch (e) {
        console.error('Error fetching invitation for pre-fill:', e);
      }
    }
    fetchInvitation();
  }, [token, form]);

  React.useEffect(() => {
    if (user) {
      const [fname, ...lnameParts] = user.displayName?.split(' ') || ['', ''];
      form.reset({
        fname: fname || dbUser?.fname || '',
        lname: lnameParts.join(' ') || dbUser?.lname || '',
        email: user.email || dbUser?.email || '',
        phone: dbUser?.phone || '',
        organization: dbUser?.organization?.name || '',
      });
    }
  }, [user, dbUser, form]);

  React.useEffect(() => {
    if (!loading && dbUser?.organization?.name) {
      router.push('/');
    }
  }, [loading, dbUser, router]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
      return;
    }
    setIsSubmitting(true);
    const updates = {
      ...values,
      organization: { name: values.organization },
    }
    try {
      const idToken = await user.getIdToken(true);
      const updatedUser = await completionAccountByToken(idToken, {
        ...values,
        organization: { name: values.organization } as any,
        invitation_token: token || undefined,
      });

      // Immediately update the user state in the auth context
      setDbUser((prevDbUser) => {
        if (!prevDbUser) return null;
        return {
          ...prevDbUser,
          ...updates,
          id: updatedUser.userId || prevDbUser.id,
          organization: { ...prevDbUser.organization, name: values.organization } as any,
        } as User;
      });

      toast({ title: "Account Updated", description: "Your profile has been successfully updated." });
      // The useEffect will now trigger the redirect to "/" because dbUser.organization.name is set
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-2xl font-semibold">SafetyFilePro</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Account</CardTitle>
            <CardDescription>
              Please provide your company name to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@example.com" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          {...field}
                          disabled={!!invitationData}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save and Continue
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
