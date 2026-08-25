"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [30, 50, 100],
  className = "",
  itemLabel = "results",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground ${className}`}
    >
      {/* Left: Summary & Page Size Selection */}
      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <div>
          Showing{" "}
          <span className="font-semibold font-mono text-foreground">{startItem}</span> to{" "}
          <span className="font-semibold font-mono text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold font-mono text-foreground">{total.toLocaleString()}</span>{" "}
          {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-xs outline-none text-foreground font-mono focus:ring-1 focus:ring-indigo-500 cursor-pointer h-7"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 border-border/50 bg-muted/20 hover:bg-muted/60 disabled:opacity-30"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 border-border/50 bg-muted/20 hover:bg-muted/60 disabled:opacity-30"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            typeof p === "number" ? (
              <Button
                key={idx}
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] px-2 text-xs font-mono transition-all ${p === currentPage
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white font-bold border-indigo-600 shadow-sm shadow-indigo-500/20"
                    : "border-border/50 bg-muted/20 hover:bg-muted/60 text-foreground"
                  }`}
              >
                {p}
              </Button>
            ) : (
              <span key={idx} className="px-1 text-muted-foreground font-mono select-none">
                {p}
              </span>
            )
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 border-border/50 bg-muted/20 hover:bg-muted/60 disabled:opacity-30"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 border-border/50 bg-muted/20 hover:bg-muted/60 disabled:opacity-30"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
