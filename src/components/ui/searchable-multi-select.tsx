"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, ChevronRight } from "lucide-react";

export interface SearchableMultiSelectProps {
  label: string;
  placeholder?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  emptyText?: string;
}

export function SearchableMultiSelect({
  label,
  placeholder = "Search and select...",
  options,
  selected,
  onChange,
  searchable = true,
  emptyText = "No matching options found.",
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
  const allOptionsWithFirstAll = React.useMemo(() => {
    const listWithoutAll = options.filter(o => o.toLowerCase() !== "all");
    return [allOption, ...listWithoutAll];
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return allOptionsWithFirstAll;
    const query = search.toLowerCase();
    return allOptionsWithFirstAll.filter(o => o.toLowerCase().includes(query));
  }, [allOptionsWithFirstAll, search]);

  const isAllSelected = selected.length === 0 || selected.includes("All");

  const toggleOption = (option: string) => {
    if (option === "All") {
      onChange(["All"]);
    } else {
      let next: string[];
      if (selected.includes(option)) {
        next = selected.filter(s => s !== option && s !== "All");
        if (next.length === 0) next = ["All"];
      } else {
        next = [...selected.filter(s => s !== "All"), option];
      }
      onChange(next);
    }
  };

  const removeOption = (option: string) => {
    if (option === "All") return;
    const next = selected.filter(s => s !== option);
    onChange(next.length === 0 ? ["All"] : next);
  };

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <Label className="text-xs text-muted-foreground font-semibold">{label}</Label>

      <div
        onClick={() => setOpen(!open)}
        className="min-h-[38px] p-1.5 bg-muted/30 border border-border/50 rounded-xl cursor-pointer flex flex-wrap items-center gap-1.5 hover:border-indigo-500/50 transition-colors"
      >
        {isAllSelected ? (
          <Badge className="bg-indigo-600 text-white font-medium text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All
          </Badge>
        ) : (
          selected.map(item => (
            <Badge
              key={item}
              className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
            >
              <span className="truncate max-w-[200px]">{item}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(item);
                }}
                className="hover:text-red-200 transition-colors ml-0.5 font-bold"
              >
                &times;
              </button>
            </Badge>
          ))
        )}

        <div className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1 px-1 shrink-0">
          <span className="text-[10px] font-mono">
            {isAllSelected ? "All Selected" : `${selected.length} Selected`}
          </span>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-xl p-2 space-y-2 max-h-60 overflow-hidden flex flex-col backdrop-blur-xl">
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

          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1 font-medium">
            {filteredOptions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground p-3 text-center">{emptyText}</p>
            ) : (
              filteredOptions.map(option => {
                const active = option === "All" ? isAllSelected : selected.includes(option);
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
                    <span className="truncate">{option}</span>
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
