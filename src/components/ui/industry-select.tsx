"use client";

import * as React from "react";
import { Check, ChevronDown, Filter, Loader2, Search } from "lucide-react";
import * as industryServices from "@/services/public/industryServices";
import type { Industry } from "@/lib/types";

export interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allLabel?: string;
  industries?: Industry[];
  disabled?: boolean;
}

export function IndustrySelect({
  value,
  onChange,
  placeholder = "Select Industry...",
  className = "",
  allLabel = "All Industries",
  industries: initialIndustries,
  disabled = false,
}: IndustrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [industries, setIndustries] = React.useState<Industry[]>(initialIndustries || []);
  const [loading, setLoading] = React.useState(!initialIndustries || initialIndustries.length === 0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialIndustries && initialIndustries.length > 0) {
      setIndustries(initialIndustries);
      setLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await industryServices.getIndustries({ limit: 0 });
        if (isMounted && res?.industries) {
          setIndustries(res.industries);
        }
      } catch (err) {
        console.error("Failed to load industries in IndustrySelect:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialIndustries]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearch("");
    }
  }, [open]);

  const filteredIndustries = React.useMemo(() => {
    if (!search.trim()) return industries;
    const q = search.toLowerCase();
    return industries.filter((ind) => ind.name?.toLowerCase().includes(q));
  }, [industries, search]);

  const isAll = !value || value === "all";
  const selectedIndustry = industries.find((i) => i.name?.toLowerCase() === value?.toLowerCase());
  const displayLabel = isAll ? allLabel : (selectedIndustry ? selectedIndustry.name : value);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="h-9 px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border/40 hover:border-border/80 text-foreground flex items-center justify-between gap-2 min-w-[160px] max-w-[240px] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
          ) : (
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[220px] max-w-[300px] bg-card border border-border/60 rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
          <div className="relative p-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search industries..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-muted/40 border border-border/40 rounded-lg text-xs outline-none text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500/50"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                isAll ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "hover:bg-muted/50 text-foreground"
              }`}
            >
              <span>{allLabel}</span>
              {isAll && <Check className="h-3.5 w-3.5 text-indigo-400" />}
            </button>

            {filteredIndustries.map((ind) => {
              const isSelected = !isAll && (value === ind.name || value === String(ind.id));
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => {
                    onChange(ind.name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <span className="truncate pr-2">{ind.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}

            {filteredIndustries.length === 0 && !loading && (
              <div className="p-2.5 text-center text-muted-foreground text-[11px]">
                No industries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
