'use client';

import React, { useState } from 'react';
import {
  Zap,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Users,
  Target,
  Rocket,
  Globe2,
  Award,
  ArrowRight,
} from "lucide-react";
import { useGeneralHero } from '../_context/GeneralHeroContext';

/* ═══════════════════════════════════════════════════════════════ */

export function GeneralHero() {
  const { heroSection } = useGeneralHero();

  return heroSection && <div className="border-b border-border/40 bg-gradient-to-b from-indigo-950/20 via-background to-background py-16 px-6 text-center">
    <div className="max-w-3xl mx-auto space-y-4">
      {heroSection}
    </div>
  </div>;
}
