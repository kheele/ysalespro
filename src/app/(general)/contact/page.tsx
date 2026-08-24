"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Building2,
  Clock,
  CheckCircle2,
  Globe2,
} from "lucide-react";
import { useEffect } from "react";
import { useGeneralHero } from "../_context/GeneralHeroContext";

export default function ContactPage() {
  const { setHeroSection } = useGeneralHero();

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    subject: "Enterprise Sales",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    setHeroSection(<>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
        <MessageSquare className="h-3.5 w-3.5" /> Direct Communication Channels
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        Let&apos;s talk about accelerating your sales pipeline.
      </h1>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        Whether you&apos;re looking to upgrade to an Enterprise Tier, request custom API limits, or need dedicated onboarding assistance, we&apos;re here for you.
      </p>
    </>);

    return () => {
      setHeroSection(null);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <>
      {/* Left Column: Direct Info Cards */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="border-border/50 bg-card p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold">Contact Information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Reach out via email, phone, or visit our regional headquarters.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">Email Inquiries</span>
                <a href="mailto:support@salespro.ai" className="text-muted-foreground hover:text-indigo-400 transition-colors">
                  support@salespro.ai
                </a>
                <span className="text-[11px] text-muted-foreground block">sales@salespro.ai</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">Phone Support</span>
                <span className="text-muted-foreground">+27 (0) 11 450 8900</span>
                <span className="text-[11px] text-muted-foreground block">Mon–Fri, 8:00 AM – 6:00 PM SAST</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">Headquarters</span>
                <span className="text-muted-foreground">Sandton Central, Johannesburg</span>
                <span className="text-[11px] text-muted-foreground block">Gauteng, South Africa</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">Guaranteed SLA</span>
                <span className="text-muted-foreground">Average response: &lt; 2 Hours</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 p-5 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Globe2 className="h-4 w-4 text-indigo-400" /> Global Enterprise Support
          </div>
          <p className="text-muted-foreground leading-relaxed">
            We support enterprise deployments across EMEA, North America, and APAC with multi-region database redundancy and data sovereignty compliance.
          </p>
        </Card>
      </div>

      {/* Right Column: Contact Form */}
      <div className="lg:col-span-7">
        <Card className="border-border/50 bg-card p-6 sm:p-8 rounded-2xl">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Message Received</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Thank you for reaching out, <span className="font-semibold text-foreground">{formData.name}</span>. A sales executive has been assigned to your request and will contact you at <span className="font-semibold text-foreground">{formData.email}</span> shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: "", email: "", company: "", subject: "Enterprise Sales", message: "" });
                }}
                className="text-xs mt-2"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">Send us a message</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fill out the details below and our team will get right back to you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Your Full Name</label>
                  <Input
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background/60 text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Work Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background/60 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Company Name</label>
                  <Input
                    required
                    placeholder="Acme Global Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-background/60 text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Inquiry Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-background/60 border border-border/60 rounded-md px-3 text-xs h-9 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>Enterprise Sales & Demo</option>
                    <option>Technical Support</option>
                    <option>API & Custom Integrations</option>
                    <option>Billing & Invoicing</option>
                    <option>Partnership Inquiries</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your team size, sales goals, or the specific features you'd like to explore..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-background/60 border border-border/60 rounded-md p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 shadow-lg shadow-indigo-500/20 gap-1.5 mt-2"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "Sending message..." : "Send Message to SalesPro"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
