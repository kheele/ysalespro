"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Building2,
  Users,
  Target,
  Send,
  Megaphone,
  BarChart3,
  Settings,
  Plus,
  Flame,
  LayoutDashboard,
  Factory,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <Command className="w-full font-sans">
          <div className="flex items-center border-b border-border/40 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Type a command or search companies, decision makers, leads..."
              className="flex h-12 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[340px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
              No matching commands or entities found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                <span>Go to Executive Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/companies"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Search & Filter Organizations</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/industries"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <Factory className="h-4 w-4 text-indigo-400" />
                <span>Browse Industries & Classification Codes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/people"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <Users className="h-4 w-4 text-indigo-400" />
                <span>View Decision Makers Directory</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/leads"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <Target className="h-4 w-4 text-indigo-400" />
                <span>Open Lead Pipeline (Cold/Warm/Hot)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/outreach"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 font-medium"
              >
                <Send className="h-4 w-4 text-indigo-400" />
                <span>Email & Phone Outreach Manager</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Actions" className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/companies?action=new"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 font-medium"
              >
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>Add New Organization</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/campaigns?action=new"))}
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-purple-500/10 hover:text-purple-400 font-medium"
              >
                <Megaphone className="h-4 w-4 text-purple-400" />
                <span>Launch New Automated Sales Campaign</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
