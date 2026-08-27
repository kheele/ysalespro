"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getTasksActionByToken,
  updateTaskStatusActionByToken,
  createTaskActionByToken,
  deleteTaskActionByToken,
} from "@/services/private/taskServices";
import {
  generatePreCallBriefAction,
  prioritizeTasksAction,
} from "@/services/private/aiMessageServices";
import type { GeneratePreCallBriefOutput } from "@/ai/schemas/precall-brief";
import type { PrioritizeTasksOutput } from "@/ai/schemas/task-prioritizer";
import type { TaskItem, TaskType, TaskStatus, TaskPriority } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckSquare, Calendar as CalendarIcon, LayoutGrid, List, Plus,
  Phone, Mail, Users, RefreshCw, Search, Clock, AlertTriangle,
  Building2, UserCheck, CheckCircle2, ChevronLeft, ChevronRight,
  MoreVertical, Trash2, Edit3, Filter, ShieldAlert, Check,
  Sparkles, Shield, Lightbulb, Loader2, HelpCircle, Volume2, Target,
} from "lucide-react";

const TYPE_ICON: Record<TaskType, React.ReactNode> = {
  Call: <Phone className="h-3.5 w-3.5 text-purple-400" />,
  Email: <Mail className="h-3.5 w-3.5 text-indigo-400" />,
  Meeting: <Users className="h-3.5 w-3.5 text-emerald-400" />,
  "Follow-up": <Clock className="h-3.5 w-3.5 text-amber-400" />,
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  Urgent: "bg-red-500/10 text-red-400 border-red-500/20 font-bold animate-pulse",
  High: "bg-amber-500/10 text-amber-400 border-amber-500/20 font-semibold",
  Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Low: "bg-muted/40 text-muted-foreground border-border/40",
};

const KANBAN_STAGES: TaskStatus[] = ["To Do", "In Progress", "Completed", "Cancelled"];

export default function TasksPage() {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "kanban" | "calendar">("list");
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  // New Task Modal State
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<TaskType>("Call");
  const [newPriority, setNewPriority] = React.useState<TaskPriority>("Medium");
  const [newDate, setNewDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = React.useState("10:00 AM");
  const [newLead, setNewLead] = React.useState("");
  const [newCompany, setNewCompany] = React.useState("");
  const [newNotes, setNewNotes] = React.useState("");

  // AI Pre-Call Brief State
  const [briefLoading, setBriefLoading] = React.useState(false);
  const [briefModalOpen, setBriefModalOpen] = React.useState(false);
  const [briefData, setBriefData] = React.useState<GeneratePreCallBriefOutput | null>(null);
  const [briefTargetTask, setBriefTargetTask] = React.useState<TaskItem | null>(null);

  // AI Daily Task Prioritizer State
  const [prioritizeLoading, setPrioritizeLoading] = React.useState(false);
  const [planModalOpen, setPlanModalOpen] = React.useState(false);
  const [dailyPlan, setDailyPlan] = React.useState<PrioritizeTasksOutput | null>(null);

  const handleGenerateDailyPlan = async () => {
    if (tasks.length === 0) return;
    setPrioritizeLoading(true);
    setPlanModalOpen(true);
    try {
      const res = await prioritizeTasksAction({
        rep_name: user?.displayName || user?.email?.split("@")[0] || "Sales Rep",
        available_hours: 6,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          priority: t.priority,
          due_date: t.due_date,
          due_time: t.due_time,
          related_lead_name: t.related_lead_name,
          related_company: t.related_company,
          notes: t.notes,
          status: t.status,
        })),
      });
      setDailyPlan(res);
    } catch (err) {
      console.error("Failed to generate daily action plan:", err);
    } finally {
      setPrioritizeLoading(false);
    }
  };

  const handleOpenBrief = async (task: TaskItem) => {
    setBriefTargetTask(task);
    setBriefLoading(true);
    setBriefModalOpen(true);
    try {
      const res = await generatePreCallBriefAction({
        prospect: {
          name: task.related_lead_name || "Decision Maker",
          title: "Executive Leader",
        },
        company: {
          name: task.related_company || "Enterprise Account",
          industry: "Enterprise Technology",
        },
        call_goal: task.title,
      });
      setBriefData(res);
    } catch (err) {
      console.error("Failed to generate pre-call brief:", err);
    } finally {
      setBriefLoading(false);
    }
  };

  const loadTasks = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getTasksActionByToken(token, { type: typeFilter, status: statusFilter, search });
      setTasks(data || []);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  }, [user, typeFilter, statusFilter, search]);

  React.useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleStatusChange = async (id: string | number, newStatus: TaskStatus) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await updateTaskStatusActionByToken(token, id, newStatus);
      loadTasks();
    } catch (e) {
      console.error("Failed to update task status:", e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !user) return;
    try {
      const token = await user.getIdToken(true);
      await createTaskActionByToken(token, {
        title: newTitle,
        type: newType,
        priority: newPriority,
        status: "To Do",
        due_date: newDate,
        due_time: newTime,
        assigned_to: user.displayName || user.email?.split("@")[0] || "",
        related_lead_name: newLead || undefined,
        related_company: newCompany || undefined,
        notes: newNotes || undefined,
      });
      setCreateOpen(false);
      setNewTitle("");
      setNewNotes("");
      loadTasks();
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };

  const handleDeleteTask = async (id: string | number) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await deleteTaskActionByToken(token, id);
      loadTasks();
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Task Management"
          subtitle="Manage sales calls, emails, meetings, and follow-up activities across List, Calendar, and Kanban views"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 w-full mx-auto overflow-y-auto">

          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl backdrop-blur-xl">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
              <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}
                className={`text-xs h-8 gap-1.5 ${viewMode === "list" ? "bg-indigo-600 text-white" : "text-muted-foreground"}`}>
                <List className="h-3.5 w-3.5" /> List View
              </Button>
              <Button size="sm" variant={viewMode === "kanban" ? "default" : "ghost"} onClick={() => setViewMode("kanban")}
                className={`text-xs h-8 gap-1.5 ${viewMode === "kanban" ? "bg-indigo-600 text-white" : "text-muted-foreground"}`}>
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban View
              </Button>
              <Button size="sm" variant={viewMode === "calendar" ? "default" : "ghost"} onClick={() => setViewMode("calendar")}
                className={`text-xs h-8 gap-1.5 ${viewMode === "calendar" ? "bg-indigo-600 text-white" : "text-muted-foreground"}`}>
                <CalendarIcon className="h-3.5 w-3.5" /> Calendar View
              </Button>
            </div>

            {/* Filter & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 bg-muted/30 text-xs h-9" />
              </div>

              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="bg-muted/40 rounded-lg px-3 py-1.5 text-xs outline-none text-foreground h-9">
                <option value="all">All Types</option>
                <option value="Call">Calls</option>
                <option value="Email">Emails</option>
                <option value="Meeting">Meetings</option>
                <option value="Follow-up">Follow-ups</option>
              </select>

              <Button
                variant="outline"
                onClick={handleGenerateDailyPlan}
                disabled={prioritizeLoading || tasks.length === 0}
                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold h-9 px-3 gap-1.5"
              >
                {prioritizeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
                {prioritizeLoading ? "Prioritizing..." : "AI Daily Action Plan"}
              </Button>

              <Button onClick={() => setCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-lg shadow-indigo-500/20">
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </div>
          </div>

          {/* VIEW 1: LIST VIEW */}
          {viewMode === "list" && (
            <Card className="bg-card overflow-hidden">
              <div className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted/20 animate-pulse" />)
                ) : tasks.length > 0 ? (
                  tasks.map(task => (
                    <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Checkbox toggle */}
                        <button onClick={() => handleStatusChange(String(task.id), task.status === "Completed" ? "To Do" : "Completed")}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${task.status === "Completed" ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/80 hover:border-indigo-400"
                            }`}>
                          {task.status === "Completed" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </button>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-xs text-foreground ${task.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-border/50 bg-muted/30">
                              {TYPE_ICON[task.type] || TYPE_ICON['Call']} {task.type || 'Call'}
                            </Badge>
                            <Badge className={`${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE['Medium']} text-[10px]`}>{task.priority || 'Medium'}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            {task.related_company && <span><Building2 className="h-3 w-3 inline mr-1 text-indigo-400" />{task.related_company}</span>}
                            {task.related_lead_name && <span><UserCheck className="h-3 w-3 inline mr-1 text-purple-400" />{task.related_lead_name}</span>}
                            <span><Clock className="h-3 w-3 inline mr-1 text-muted-foreground" />Due: {task.due_date} {task.due_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleOpenBrief(task)}
                          className="h-7 text-[10px] gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20">
                          <Sparkles className="h-3 w-3 text-indigo-400" /> AI Brief
                        </Button>
                        <select value={task.status} onChange={e => handleStatusChange(String(task.id), e.target.value as TaskStatus)}
                          className="bg-muted/40 rounded-md text-[11px] px-2 py-1 outline-none text-foreground">
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteTask(String(task.id))} className="h-7 w-7 text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground text-xs">No tasks match criteria.</div>
                )}
              </div>
            </Card>
          )}

          {/* VIEW 2: KANBAN VIEW */}
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {KANBAN_STAGES.map(stage => {
                const stageTasks = tasks.filter(t => t.status === stage);
                return (
                  <div key={stage} className="bg-card rounded-2xl p-3 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-bold text-xs uppercase text-muted-foreground tracking-wider">{stage}</span>
                      <Badge className="bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">{stageTasks.length}</Badge>
                    </div>

                    <div className="space-y-2">
                      {stageTasks.map(task => (
                        <Card key={task.id} className="border-border/50 bg-card/80 p-3 space-y-2 hover:border-indigo-500/30 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground line-clamp-2">{task.title}</span>
                            <Badge className={`${PRIORITY_BADGE[task.priority]} text-[9px] shrink-0`}>{task.priority}</Badge>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                            <span className="flex items-center gap-1">{TYPE_ICON[task.type]} {task.type}</span>
                            <button onClick={() => handleOpenBrief(task)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                              <Sparkles className="h-2.5 w-2.5" /> AI Brief
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: CALENDAR VIEW */}
          {viewMode === "calendar" && (
            <Card className="bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-400" /> July 2026 Task Schedule
                </h2>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="outline" className="h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              {/* 7-Column Calendar Grid Mock */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="font-semibold text-muted-foreground py-1 bg-muted/20 rounded">{d}</div>
                ))}

                {Array.from({ length: 31 }).map((_, dayIdx) => {
                  const dayNum = dayIdx + 1;
                  const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                  const dayTasks = tasks.filter(t => t.due_date === dateStr);

                  return (
                    <div key={dayIdx} className={`min-h-[80px] p-1.5 rounded-lg border text-left flex flex-col justify-between ${dateStr === "2026-07-23" ? "border-indigo-500/50 bg-indigo-500/5" : "border-border/30 bg-muted/10"
                      }`}>
                      <span className={`text-[10px] font-mono font-bold ${dateStr === "2026-07-23" ? "text-indigo-400" : "text-muted-foreground"}`}>
                        {dayNum} {dateStr === "2026-07-23" && "(Today)"}
                      </span>
                      <div className="space-y-1">
                        {dayTasks.map(t => (
                          <div key={t.id} className="p-1 rounded bg-indigo-600/20 border border-indigo-500/30 text-[9px] text-indigo-300 truncate">
                            {t.due_time || ""} {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </main>
      </div>

      {/* New Task Dialog Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card/98 border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" /> Create Sales Task
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Task Title</label>
              <Input placeholder="e.g. Schedule discovery call with CTO" value={newTitle} onChange={e => setNewTitle(e.target.value)} required className="bg-muted/40 border-border/60 text-xs h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Task Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value as TaskType)} className="w-full bg-muted/40 border border-border/60 rounded-md p-2 text-xs outline-none text-foreground h-9">
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value as TaskPriority)} className="w-full bg-muted/40 border border-border/60 rounded-md p-2 text-xs outline-none text-foreground h-9">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Due Date</label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-muted/40 border-border/60 text-xs h-9" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Due Time</label>
                <Input placeholder="10:00 AM" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-muted/40 border-border/60 text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Related Lead</label>
                <Input placeholder="e.g. Sarah Jenkins" value={newLead} onChange={e => setNewLead(e.target.value)} className="bg-muted/40 border-border/60 text-xs h-9" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">Related Company</label>
                <Input placeholder="e.g. Acme Corp" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="bg-muted/40 border-border/60 text-xs h-9" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-xs h-9">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9">Create Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AI Pre-Call Research Brief Modal ─── */}
      <Dialog open={briefModalOpen} onOpenChange={setBriefModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Pre-Call Intelligence Brief (Vanessa Van Edwards People Skills)
              </span>
              {briefTargetTask && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs">
                  {briefTargetTask.related_company || "Target Account"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {briefLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Synthesizing behavioral intelligence & talking points...</p>
            </div>
          ) : briefData ? (
            <div className="space-y-4 text-xs pt-1">
              {/* Executive Summary & Psychological Motivator */}
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-indigo-400" /> Executive Situational Brief</span>
                  <span className="font-mono text-[10px]">Optimal Call Time: ~{briefData.optimal_duration_minutes} mins</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {briefData.executive_summary}
                </p>
              </div>

              {/* Recommended Vocal Demeanor */}
              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center gap-2.5 text-[11px]">
                <Volume2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Vocal & Behavioral Demeanor:</strong> {briefData.recommended_tone}
                </span>
              </div>

              {/* 3 Key Talking Points */}
              <div className="space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Key Value Propositions & Proof Points
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {briefData.key_talking_points.map((tp, idx) => (
                    <div key={idx} className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
                      <div className="font-bold text-indigo-300 text-[11px]">{tp.topic}</div>
                      <div className="text-foreground text-[11px] font-medium">{tp.talking_point}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Proof: {tp.proof_point}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Likely Objections & Rebuttals */}
              <div className="space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Shield className="h-3.5 w-3.5 text-red-400" /> Anticipated Objections & Validation-First Rebuttals
                </p>
                <div className="space-y-2">
                  {briefData.likely_objections.map((obj, idx) => (
                    <div key={idx} className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl space-y-1">
                      <div className="font-bold text-red-300 text-[11px]">Objection: "{obj.objection}"</div>
                      <div className="text-muted-foreground text-[11px] leading-relaxed">
                        <strong className="text-foreground">Science-backed Counter:</strong> {obj.rebuttal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Dopamine Discovery Questions */}
              <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-400" /> High-Dopamine Discovery Questions
                </p>
                <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                  {briefData.high_impact_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" size="sm" onClick={() => setBriefModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                  Ready to Call
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── AI Daily Action Plan Modal ─── */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Daily Sales Action Plan (Vanessa Van Edwards Methodology)
              </span>
              {dailyPlan && (
                <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-xs font-mono">
                  Opportunity Score: {dailyPlan.revenue_opportunity_score}/100
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {prioritizeLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Analyzing task urgency, buyer momentum, and scheduling optimal outreach blocks...</p>
            </div>
          ) : dailyPlan ? (
            <div className="space-y-4 text-xs pt-1">
              {/* Daily Briefing Summary */}
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1.5">
                <p className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Executive Workflow Briefing
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {dailyPlan.daily_summary}
                </p>
              </div>

              {/* Time-Blocked Schedule */}
              <div className="space-y-2">
                <p className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-400" /> Time-Blocked Focus Windows
                </p>
                <div className="space-y-2">
                  {dailyPlan.time_blocked_schedule.map((block, idx) => (
                    <div key={idx} className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-indigo-300 font-mono text-[11px]">{block.time_block}</span>
                        <Badge variant="outline" className="text-[9px] bg-muted/30 text-muted-foreground">
                          {block.focus_category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{block.guidance}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Focus Tasks */}
              <div className="space-y-2">
                <p className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-emerald-400" /> High-Impact Deal Accelerators
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dailyPlan.top_focus_tasks.map((ft, idx) => (
                    <div key={idx} className="p-2.5 bg-card border border-border/50 rounded-xl space-y-1">
                      <div className="font-semibold text-foreground text-[11px] truncate">{ft.title}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">{ft.lead_or_company}</div>
                      <div className="text-[10px] text-muted-foreground">{ft.recommended_angle}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mindset Booster */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <p className="font-bold text-emerald-300 text-[10px] uppercase">Daily Charismatic Presence Tip</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{dailyPlan.psychological_mindset_tip}</p>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/30">
                <Button type="button" size="sm" onClick={() => setPlanModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                  Execute Daily Plan
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
