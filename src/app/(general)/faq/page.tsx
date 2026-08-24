"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  ArrowLeft,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  CreditCard,
  Target,
  MessageCircle,
} from "lucide-react";
import { useGeneralHero } from "../_context/GeneralHeroContext";
import { useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "AI & Messaging" | "Data & Telemetry" | "Security & Billing";
}

const FAQS: FAQItem[] = [
  {
    category: "General",
    question: "What is YSalesPro and how does it help sales teams?",
    answer:
      "YSalesPro is an enterprise-grade sales intelligence and pipeline acceleration platform. It provides high-accuracy B2B corporate contact data, real-time intent telemetry, and Gemini AI-powered multi-channel sequence generation to turn prospects into closed deals faster.",
  },
  {
    category: "General",
    question: "Can I invite multiple team members to my organization workspace?",
    answer:
      "Yes! Team administrators can invite SDRs, Account Executives, and Sales Leaders from the Settings > Team & Permissions tab. You can set granular role-based permissions (SuperAdmin, Admin, Member) to control access to contacts and campaign data.",
  },
  {
    category: "AI & Messaging",
    question: "How does the AI sales outreach generation work?",
    answer:
      "Our AI messaging engine is powered by Google Gemini and specialized sales intelligence models. It dynamically analyzes the prospect's industry pain points, role responsibilities, company size, and product offerings to craft personalized cold emails, LinkedIn connection requests, and objection-handling battlecards.",
  },
  {
    category: "AI & Messaging",
    question: "Can I customize the tone and voice of generated outreach scripts?",
    answer:
      "Absolutely. In the AI Messaging studio, you can select custom tones (e.g. Executive, Casual, Consultative, Direct), incorporate your own value proposition snippets, and refine scripts before launching campaigns.",
  },
  {
    category: "Data & Telemetry",
    question: "Where does YSalesPro source its company and decision-maker contact data?",
    answer:
      "Our telemetry database aggregates verified public business records, corporate filings, authorized partner directories, and live web signals. Our automated validation engine checks email deliverability and company statuses to ensure minimal bounce rates.",
  },
  {
    category: "Data & Telemetry",
    question: "Can I export lead lists and sync them with our CRM?",
    answer:
      "Yes. You can export filtered lead lists to CSV or connect directly via our GraphQL API and webhook integrations (Salesforce, HubSpot, Slack, Zoom).",
  },
  {
    category: "Security & Billing",
    question: "Is YSalesPro compliant with GDPR, POPIA, and CAN-SPAM regulations?",
    answer:
      "Yes. YSalesPro is fully designed for enterprise compliance. We enforce strict data processing agreements, opt-out mechanisms, TLS 1.3 data encryption in transit, and AES-256 encryption at rest.",
  },
  {
    category: "Security & Billing",
    question: "What payment methods are supported and how does billing work?",
    answer:
      "We support all major credit cards, wire transfers, and PayPal for enterprise invoices. Subscriptions can be billed on a flexible monthly or annual schedule with tiered volume discounts.",
  },
];

export default function FAQPage() {
  const { setHeroSection } = useGeneralHero();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [openIndexes, setOpenIndexes] = React.useState<number[]>([0, 2]);

  useEffect(() => {
    setHeroSection(<>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
        <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        Common questions about YSalesPro
      </h1>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        Everything you need to know about our data telemetry, AI outreach tools, integrations, and enterprise security.
      </p>

      <div className="max-w-xl mx-auto relative pt-2">
        <Search className="absolute left-3.5 top-5.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search frequently asked questions..."
          className="pl-10 h-11 bg-card/90 border-border/60 shadow-lg text-sm rounded-xl"
        />
      </div>
    </>);

    return () => {
      setHeroSection(null);
    };
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const categories = ["All", "General", "AI & Messaging", "Data & Telemetry", "Security & Billing"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Category filter pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQs Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <Card className="p-8 text-center border-border/40 bg-card">
            <p className="text-sm text-muted-foreground">No questions found matching &ldquo;{searchQuery}&rdquo;</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-xs text-indigo-400 mt-2"
            >
              Clear search filters
            </Button>
          </Card>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndexes.includes(idx);
            return (
              <Card
                key={idx}
                className="border-border/50 bg-card hover:border-indigo-500/40 transition-all rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 font-semibold text-sm hover:text-indigo-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/20 pl-9">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Still have questions banner */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-base font-bold text-foreground">Still have questions?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Can&apos;t find the answer you&apos;re looking for? Reach out to our customer success team.</p>
        </div>
        <Link href="/contact">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold gap-1.5 shrink-0">
            <MessageCircle className="h-3.5 w-3.5" /> Contact Our Team
          </Button>
        </Link>
      </Card>
    </>
  );
}
