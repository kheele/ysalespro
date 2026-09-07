'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, MailX } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead_id');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center backdrop-blur-xl">
        {/* Icon Header */}
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <MailX className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Unsubscribed Successfully
        </h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Your email preference has been updated. You have been removed from this outreach sequence and will not receive further automated emails.
        </p>

        {/* Feature badge */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 mb-6 flex items-center justify-center gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Opt-out request logged and verified</span>
        </div>

        <p className="text-xs text-slate-500">
          Unsubscribed by mistake? You can safely close this window or reach out to the sender directly.
        </p>
      </div>

      <div className="mt-8 text-xs text-slate-600 flex items-center gap-1.5">
        <span>Powered by</span>
        <span className="font-semibold text-slate-500 tracking-wide">SalesPro Intelligence</span>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Updating your email preferences...
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
