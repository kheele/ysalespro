"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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
import { MaterialInput } from "@/components/ui/material-input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateContractorInviteAction } from "@/services/contractorService";


const formSchema = z.object({
  fname: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lname: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  phone: z.string().optional(),
  organization: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  invitation_token: z.string().optional(),
});

function SignupContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = React.useState(!!token);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: "",
      lname: "",
      phone: "",
      organization: "",
      email: "",
      password: "",
      invitation_token: token || undefined,
    },
  });

  React.useEffect(() => {
    async function fetchInvitationDetails() {
      if (!token) return;
      setIsFetchingDetails(true);
      try {
        const data = await validateContractorInviteAction(token);
        form.setValue('organization', data.companyName);
        form.setValue('invitation_token', token);
      } catch (error) {
        console.error("Error fetching invitation details:", error);
        toast({ variant: "destructive", title: "Invitation Error", description: "This invitation link is invalid or has expired." });
      } finally {
        setIsFetchingDetails(false);
      }
    }

    fetchInvitationDetails();
  }, [token, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signUpWithEmail({
        ...values,
        organization: values.organization || form.getValues('organization')
      });
      toast({ title: "Account Created", description: "You have been successfully signed up." });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Success", description: "Logged in successfully." });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Card className="p-4 border-none shadow-none">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Enter your details below to get started.
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
                    <FormControl>
                      <MaterialInput 
                        label="First Name" 
                        placeholder="John" 
                        {...field} 
                      />
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
                    <FormControl>
                      <MaterialInput 
                        label="Last Name" 
                        placeholder="Doe" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MaterialInput label="Phone (Optional)" placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organization"
              disabled={!!token || isFetchingDetails}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MaterialInput 
                        label="Company" 
                        placeholder="Acme Inc." 
                        {...field} 
                        className={cn(field.disabled && "bg-slate-100 cursor-not-allowed opacity-80")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                    <FormControl>
                      <MaterialInput 
                        label="Email" 
                        type="email" 
                        placeholder="name@example.com" 
                        {...field} 
                      />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MaterialInput label="Password" type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background p-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
          <Image src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google icon" width={20} height={20} className="mr-2" />
          Google
        </Button>
        <div className="mt-6 text-center text-md">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignupContent />
    </React.Suspense>
  );
}

