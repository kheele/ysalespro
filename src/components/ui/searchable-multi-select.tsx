"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, ChevronRight, Loader2, X } from "lucide-react";

export interface SearchableMultiSelectProps {
  label: string;
  placeholder?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  emptyText?: string;
  allowAll?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  hint?: string;
}

export function SearchableMultiSelect({
  label,
  placeholder = "Search and select...",
  options,
  selected,
  onChange,
  searchable = true,
  emptyText = "No matching options found.",
  allowAll = false,
  loading = false,
  icon,
  hint,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allOption = "All";
  const displayOptions = React.useMemo(() => {
    if (!allowAll) return options;
    const listWithoutAll = options.filter(o => o.toLowerCase() !== "all");
    return [allOption, ...listWithoutAll];
  }, [options, allowAll]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return displayOptions;
    const query = search.toLowerCase();
    return displayOptions.filter(o => o.toLowerCase().includes(query));
  }, [displayOptions, search]);

  const isAllSelected = allowAll && (selected.length === 0 || selected.includes("All"));

  const toggleOption = (option: string) => {
    if (allowAll && option === "All") {
      onChange(["All"]);
    } else {
      let next: string[];
      if (selected.includes(option)) {
        next = selected.filter(s => s !== option && s !== "All");
      } else {
        next = [...selected.filter(s => s !== "All"), option];
      }
      onChange(next);
    }
  };

  const removeOption = (option: string) => {
    if (allowAll && option === "All") return;
    const next = selected.filter(s => s !== option);
    onChange(next);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
          {icon}
          {label}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-indigo-400 ml-1" />}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
      </div>

      <div
        onClick={() => setOpen(!open)}
        className="min-h-[38px] p-1.5 bg-muted/30 border border-border/50 rounded-xl cursor-pointer flex flex-wrap items-center gap-1.5 hover:border-indigo-500/50 transition-colors"
      >
        {isAllSelected ? (
          <Badge className="bg-indigo-600 text-white font-medium text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All
          </Badge>
        ) : selected.length > 0 ? (
          selected.map(item => (
            <Badge
              key={item}
              className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
            >
              <span className="truncate max-w-[220px]">{item}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(item);
                }}
                className="hover:text-red-200 transition-colors ml-0.5 font-bold"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground/60 px-2 py-1 select-none">
            {loading ? "Loading available options..." : placeholder}
          </span>
        )}

        <div className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1 px-1 shrink-0">
          {selected.length > 0 && !isAllSelected && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] text-muted-foreground/70 hover:text-red-400 mr-1 underline"
            >
              Clear
            </button>
          )}
          <span className="text-[10px] font-mono">
            {isAllSelected ? "All" : `${selected.length} / ${options.length}`}
          </span>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-2xl p-2 space-y-2 max-h-64 overflow-hidden flex flex-col backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
          {searchable && (
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border/40 rounded-lg text-xs outline-none text-foreground placeholder:text-muted-foreground/60"
                autoFocus
              />
            </div>
          )}

          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1 font-medium max-h-48">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Loading dynamic options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center p-3">
                <p className="text-[11px] text-muted-foreground">{emptyText}</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleOption(search.trim());
                      setSearch("");
                    }}
                    className="mt-2 text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    + Add &quot;{search.trim()}&quot; as custom
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map(option => {
                const active = allowAll && option === "All" ? isAllSelected : selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                      active
                        ? "bg-indigo-600/20 text-indigo-300 font-bold"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span className="truncate pr-2">{option}</span>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
