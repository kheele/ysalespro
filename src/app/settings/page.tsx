"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  User, Shield, Bell, Palette, Users,
  Globe, Mail, Plug, ChevronRight, Save, CheckCircle2, Zap,
  ToggleLeft, ToggleRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: <User className="h-3.5 w-3.5" /> },
  { id: "team", label: "Team & Permissions", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-3.5 w-3.5" /> },
  { id: "integrations", label: "Integrations", icon: <Plug className="h-3.5 w-3.5" /> },
  { id: "security", label: "Security", icon: <Shield className="h-3.5 w-3.5" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-3.5 w-3.5" /> },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full border transition-all flex items-center px-0.5 ${checked ? "bg-indigo-600 border-indigo-600" : "bg-muted/40 border-border/60"
        }`}>
      <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, dbUser } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("profile");
  const [saved, setSaved] = React.useState(false);

  // Profile state
  const [profile, setProfile] = React.useState<{
    name: string; title: string; email: string; company: string; timezone: string; language: string;
  }>({
    name: "", title: "", email: "",
    company: "", timezone: "UTC+2 (South Africa / SAST)", language: "English",
  });

  React.useEffect(() => {
    if (dbUser || user) {
      const fullName = dbUser?.fname || dbUser?.lname
        ? `${dbUser?.fname || ""} ${dbUser?.lname || ""}`.trim()
        : user?.displayName || "";
      const companyName = dbUser?.account_company?.name || "";
      const userRole = dbUser?.role || "";
      const userEmail = dbUser?.email || user?.email || "";

      setProfile(p => ({
        ...p,
        name: fullName || p.name,
        email: userEmail || p.email,
        title: userRole || p.title,
        company: companyName || p.company,
      }));
    }
  }, [user, dbUser]);

  const initials = profile.name
    ? profile.name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "SP";

  // Notifications state
  const [notifs, setNotifs] = React.useState({
    email_new_lead: true, email_followup: true, email_won: true,
    push_calls: false, push_meetings: true, push_pipeline: false,
    slack_hot_leads: true, slack_daily_digest: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const INTEGRATIONS = [
    { name: "Gmail / Google Workspace", desc: "Email sync for outreach tracking and thread history", color: "text-red-400", status: "Connected", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "LinkedIn Sales Navigator", desc: "Contact enrichment and LinkedIn outreach sequences", color: "text-blue-400", status: "Connected", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "Slack", desc: "Pipeline alerts, deal notifications, and daily digest bot", color: "text-purple-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
    { name: "Microsoft Teams", desc: "Real-time deal alerts, scheduled call sync, and channel notifications", color: "text-indigo-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
    { name: "Zoom", desc: "Auto-schedule meetings and record call outcomes", color: "text-blue-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
    { name: "HubSpot CRM", desc: "Bidirectional sync with HubSpot contacts and deals", color: "text-orange-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
  ];

  const renderSection = () => {
    switch (activeSection) {

      case "profile":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Profile Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your personal account information and preferences.</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/20 border border-border/40 rounded-xl">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-bold text-sm">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.title} · {profile.company}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto text-xs h-8 border-border/60">Change Photo</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { label: "Full Name", field: "name" as const },
                { label: "Job Title", field: "title" as const },
                { label: "Email Address", field: "email" as const },
                { label: "Company", field: "company" as const },
              ].map(f => (
                <div key={f.field} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input value={profile[f.field]} onChange={e => setProfile(p => ({ ...p, [f.field]: e.target.value }))}
                    className="bg-muted/40 border-border/60 h-9 text-xs" />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                  className="w-full bg-muted/40 border border-border/60 rounded-md px-3 py-2 text-xs outline-none text-foreground h-9">
                  <option>UTC+2 (South Africa / SAST)</option>
                  <option>UTC+0 (GMT / London)</option>
                  <option>UTC+1 (CET / Paris / Berlin)</option>
                  <option>UTC+2 (EET / Cairo)</option>
                  <option>UTC+3 (EAT / Nairobi)</option>
                  <option>UTC-5 (Eastern / New York)</option>
                  <option>UTC-6 (Central / Chicago)</option>
                  <option>UTC-7 (Mountain / Denver)</option>
                  <option>UTC-8 (Pacific / Los Angeles)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
                  className="w-full bg-muted/40 border border-border/60 rounded-md px-3 py-2 text-xs outline-none text-foreground h-9">
                  <option>English</option><option>German</option><option>French</option><option>Spanish</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Team & Permissions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage team members and their access levels.</p>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5">
                <User className="h-3.5 w-3.5" /> Invite Member
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 bg-card/40 border border-border/40 rounded-xl">
                <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{profile.name || user?.displayName || "Account Member"}</p>
                  <p className="text-[11px] text-muted-foreground">{profile.email || user?.email || ""}</p>
                </div>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                  {profile.title || "Admin"}
                </Badge>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Notification Preferences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose which events trigger alerts across channels.</p>
            </div>
            {[
              {
                section: "Email Notifications", rows: [
                  { key: "email_new_lead" as const, label: "New Lead Created", desc: "Alert when a new lead enters the pipeline" },
                  { key: "email_followup" as const, label: "Follow-Up Due", desc: "Reminder when a follow-up is overdue" },
                  { key: "email_won" as const, label: "Deal Won", desc: "Celebrate when a lead becomes a customer" },
                ]
              },
              {
                section: "Push Notifications", rows: [
                  { key: "push_calls" as const, label: "Upcoming Calls", desc: "Reminder 15 min before scheduled calls" },
                  { key: "push_meetings" as const, label: "Meeting Reminders", desc: "Calendar alerts for booked meetings" },
                  { key: "push_pipeline" as const, label: "Pipeline Movements", desc: "When a lead moves stages" },
                ]
              },
              {
                section: "Slack Alerts", rows: [
                  { key: "slack_hot_leads" as const, label: "Hot Lead Alert", desc: "Instant Slack message when a lead hits Hot" },
                  { key: "slack_daily_digest" as const, label: "Daily Digest Bot", desc: "Morning pipeline summary in your Slack channel" },
                ]
              },
            ].map(group => (
              <div key={group.section} className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground pt-2">{group.section}</p>
                <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                  {group.rows.map(row => (
                    <SettingRow key={row.key} label={row.label} description={row.desc}>
                      <ToggleSwitch checked={notifs[row.key]} onChange={v => setNotifs(n => ({ ...n, [row.key]: v }))} />
                    </SettingRow>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Integrations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Connect YSalesPro with your existing tools and data sources.</p>
            </div>
            <div className="space-y-3">
              {INTEGRATIONS.map(int => (
                <div key={int.name} className="flex items-center gap-3 p-4 bg-card/40 border border-border/40 rounded-xl">
                  <div className={`h-9 w-9 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center ${int.color} shrink-0`}>
                    <Plug className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{int.name}</p>
                    <p className="text-[11px] text-muted-foreground">{int.desc}</p>
                  </div>
                  <Badge className={`${int.statusColor} text-[10px] shrink-0`}>{int.status}</Badge>
                  <Button variant="outline" size="sm" className="text-xs h-8 border-border/60 shrink-0">
                    {int.status === "Connected" ? "Configure" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Security</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage authentication, two-factor verification, and session preferences.</p>
            </div>
            <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
              <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security to your account">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Enabled</Badge>
              </SettingRow>
              <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
                <select className="bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-xs outline-none text-foreground">
                  <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>Never</option>
                </select>
              </SettingRow>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Appearance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Customize the look and feel of the YSalesPro interface.</p>
            </div>
            <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
              <SettingRow label="Theme" description="Choose between dark and light mode">
                <div className="flex items-center gap-2">
                  {["Dark", "Light", "System"].map(t => (
                    <button key={t}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${t === "Dark" ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted/30 text-muted-foreground border-border/40"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </SettingRow>
              <SettingRow label="Sidebar Collapsed by Default" description="Start with a compact sidebar">
                <ToggleSwitch checked={false} onChange={() => { }} />
              </SettingRow>
              <SettingRow label="Compact Table Rows" description="Show more rows with reduced row height">
                <ToggleSwitch checked={true} onChange={() => { }} />
              </SettingRow>
              <SettingRow label="Animations" description="Enable UI micro-animations and transitions">
                <ToggleSwitch checked={true} onChange={() => { }} />
              </SettingRow>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader title="Settings" subtitle="Account, security, integrations, and platform configuration" onOpenCommandPalette={() => setCommandOpen(true)} />
        <main className="flex-1 p-6 w-full mx-auto overflow-y-auto space-y-6">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full space-y-5">
            {/* Horizontal Tabs List aligned left */}
            <div className="flex justify-start w-full overflow-x-auto pb-1 scrollbar-none">
              <TabsList className="bg-card p-1 rounded-xl h-auto flex flex-wrap justify-start items-center gap-1 border border-border/40 w-full">
                {NAV_ITEMS.map(item => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3.5 gap-2 rounded-lg font-semibold whitespace-nowrap transition-all"
                  >
                    {item.icon} {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Settings Content Card */}
            <Card className="border-border/50 bg-card p-6">
              {renderSection()}
              <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Changes are saved immediately after clicking Save.</p>
                <Button size="sm" onClick={handleSave}
                  className={`text-xs gap-1.5 font-semibold h-9 transition-colors ${saved ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"}`}>
                  {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                </Button>
              </div>
            </Card>
          </Tabs>
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
