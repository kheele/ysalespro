
"use client";

import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { type BillingPlan } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createPayPalSubscriptionActionByToken, handlePayPalSubscriptionSuccessActionByToken } from "@/services/private/billingService";

interface PayPalCheckoutProps {
  plan: BillingPlan;
  onSuccess?: () => void;
}

export function PayPalCheckout({ plan, onSuccess }: PayPalCheckoutProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    console.error("PayPal Client ID is not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your .env file.");
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
        PayPal is not configured correctly. Please contact support.
      </div>
    );
  }

  const initialOptions = {
    clientId: paypalClientId,
    currency: plan.currency || "USD",
    intent: "subscription",
    vault: true,
  };

  const createSubscription = async (data: any, actions: any) => {
    console.log("Creating PayPal subscription for plan:", plan.name);

    try {
      const token = await user?.getIdToken(true);
      if (!token) throw new Error('Not authenticated');

      const subscription = await createPayPalSubscriptionActionByToken(token, String(plan.id));
      return subscription.subscriptionID;
    } catch (err: any) {
      console.error("PayPal Create Subscription Error:", err);
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: err.message || 'Could not initiate PayPal checkout. Please try again.'
      });
      throw err;
    }
  };

  const onApprove = async (data: any, actions: any) => {
    console.log("PayPal subscription approved:", data);

    try {
      const token = await user?.getIdToken(true);
      if (!token) throw new Error('Not authenticated');

      await handlePayPalSubscriptionSuccessActionByToken(token, data.subscriptionId || data.subscriptionID || "", String(plan.id));

      toast({
        title: "Subscription Successful!",
        description: `You have successfully subscribed to the ${plan.name} plan.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("PayPal Success Handler Error:", err);
      toast({
        variant: "destructive",
        title: "Database Sync Error",
        description: "Your payment was successful, but we had trouble updating your account. Please contact support."
      });
    }
  };

  const onError = (err: any) => {
    console.error("PayPal Checkout Error:", err);
    toast({
      variant: "destructive",
      title: "PayPal Error",
      description: "An error occurred during the PayPal transaction. Please try again or contact support."
    });
  }


  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="relative min-h-[150px]">
        <PayPalButtons
          style={{ layout: "vertical", label: "subscribe" }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onError}
        />
      </div>
    </PayPalScriptProvider>
  );
}
