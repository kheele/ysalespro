"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Linkedin,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import type { DecisionMaker } from "@/lib/types";
import { ScoreRing } from "./score-ring";

interface DecisionMakerRowProps {
  person: DecisionMaker;
}

export function DecisionMakerRow({ person }: DecisionMakerRowProps) {
  return (
    <tr className="hover:bg-muted/40 transition-colors group">
      {/* Avatar */}
      <td className="p-3.5">
        <img
          src={
            person.avatar_url ||
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
          }
          alt={person.name}
          className="h-8 w-8 rounded-full object-cover border border-indigo-500/30"
        />
      </td>

      {/* Name + Verified */}
      <td className="p-3.5 font-semibold">
        <div className="flex items-center gap-1.5">
          <Link href={`/people/${person.id}`} className="hover:text-indigo-400 font-bold whitespace-nowrap">
            {person.name}
          </Link>
          {person.verified ? (
            <span title="Verified">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            </span>
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      </td>

      {/* Job Title */}
      <td className="p-3.5 text-muted-foreground max-w-[140px]">
        <span className="truncate block">{person.title}</span>
      </td>

      {/* Company */}
      <td className="p-3.5">
        <Link
          href={`/companies/${person.company_id || person.company?.id}`}
          className="text-indigo-400 hover:text-indigo-300 whitespace-nowrap font-medium"
        >
          {person.company_name || person.company?.name || "Company"}
        </Link>
      </td>

      {/* Industry */}
      <td className="p-3.5">
        <Badge
          variant="outline"
          className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-normal text-[10px] whitespace-nowrap"
        >
          {person.industry || "—"}
        </Badge>
      </td>

      {/* Department */}
      <td className="p-3.5 text-muted-foreground max-w-[140px]">
        <span className="truncate block text-[11px]">{person.department || "—"}</span>
      </td>

      {/* Seniority */}
      <td className="p-3.5">
        <Badge
          className={
            person.seniority === "C-Suite"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : person.seniority === "VP"
                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                : person.seniority === "Director"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          }
        >
          {person.seniority || "Manager"}
        </Badge>
      </td>

      {/* Email */}
      <td className="p-3.5 font-mono text-[10px]">
        <a
          href={`mailto:${person.email}`}
          className="text-muted-foreground hover:text-indigo-400 flex items-center gap-1"
        >
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[130px] block">{person.email}</span>
        </a>
      </td>

      {/* Phone */}
      <td className="p-3.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
        {person.phone ? (
          <a href={`tel:${person.phone}`} className="flex items-center gap-1 hover:text-indigo-400">
            <Phone className="h-3 w-3 shrink-0" /> {person.phone}
          </a>
        ) : (
          "—"
        )}
      </td>

      {/* LinkedIn */}
      <td className="p-3.5">
        {person.linkedin_url ? (
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]"
          >
            <Linkedin className="h-3.5 w-3.5" /> View
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Location */}
      <td className="p-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
        {person.location || "—"}
      </td>

      {/* Decision Maker Score */}
      <td className="p-3.5">
        <ScoreRing score={person.score ?? 80} />
      </td>

      {/* Profile Link */}
      <td className="p-3.5">
        <Link
          href={`/people/${person.id}`}
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Profile <ArrowRight className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}
