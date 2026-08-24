"use client"

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Heart } from "lucide-react";
import { useGeneralHero } from "../_context/GeneralHeroContext";
import { useEffect } from "react";

const OPEN_SOURCE_PACKAGES = [
  {
    name: "Next.js / React",
    license: "MIT License",
    description: "The React framework for the web and production applications.",
    copyright: "© Vercel, Inc. & Meta Platforms, Inc.",
  },
  {
    name: "Tailwind CSS",
    license: "MIT License",
    description: "A utility-first CSS framework for rapid UI development.",
    copyright: "© Tailwind Labs, Inc.",
  },
  {
    name: "Radix UI Primitives",
    license: "MIT License",
    description: "Unstyled, accessible UI components for building modern design systems.",
    copyright: "© WorkOS",
  },
  {
    name: "Lucide Icons",
    license: "ISC License",
    description: "Beautiful and consistent icon toolkit for modern web apps.",
    copyright: "© Lucide Project Contributors",
  },
  {
    name: "Firebase & Google Cloud SDK",
    license: "Apache License 2.0",
    description: "Authentication, storage, and cloud infrastructure SDKs.",
    copyright: "© Google LLC",
  },
  {
    name: "Recharts",
    license: "MIT License",
    description: "Redefined chart library built with React and D3.",
    copyright: "© Recharts Group",
  },
  {
    name: "Zod & React Hook Form",
    license: "MIT License",
    description: "TypeScript-first schema validation and high-performance form state management.",
    copyright: "© Colin McDonnell & Behdad Yarahmadi",
  },
];

export default function LicensesPage() {
  const { setHeroSection } = useGeneralHero();

  useEffect(() => {
    setHeroSection(<>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
        <Heart className="h-3.5 w-3.5 text-pink-400" /> Powered by Open Source
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        Third-Party Software & Licenses
      </h1>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        YSalesPro is proudly built using incredible open-source software libraries and frameworks. We thank the open-source community for their contributions.
      </p>
    </>);

    return () => {
      setHeroSection(null);
    };
  }, []);

  return (
    <>
      {/* Proprietary Notice */}
      <Card className="border-border/50 bg-card p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          <h2 className="font-bold text-base">Proprietary Software Notice</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The YSalesPro proprietary codebase, telemetry dataset, AI pipeline heuristics, and brand assets are protected by copyright and intellectual property laws. All rights reserved.
        </p>
      </Card>

      {/* Third-Party Open Source Libraries */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Open Source Attributions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">The following third-party libraries and components are utilized in our software:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OPEN_SOURCE_PACKAGES.map((pkg, idx) => (
            <Card key={idx} className="border-border/50 bg-card p-5 rounded-xl space-y-2 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{pkg.name}</span>
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono">
                  {pkg.license}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{pkg.description}</p>
              <div className="text-[11px] text-muted-foreground/80 font-mono pt-1">
                {pkg.copyright}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* MIT License Generic Text */}
      <Card className="border-border/50 bg-muted/20 p-6 rounded-2xl space-y-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
        <h3 className="font-bold text-foreground font-sans text-xs uppercase tracking-wider">Standard MIT License Disclaimer</h3>
        <p>
          Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &ldquo;Software&rdquo;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
        </p>
        <p>
          THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        </p>
      </Card>
    </>
  );
}
