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
import {
  User, Shield, Bell, Database, Palette, Users, Key,
  Globe, Mail, Plug, ChevronRight, Save, CheckCircle2, Zap,
  ToggleLeft, ToggleRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "team", label: "Team & Permissions", icon: <Users className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
  { id: "data", label: "Data & Hasura", icon: <Database className="h-4 w-4" /> },
  { id: "security", label: "Security & API Keys", icon: <Shield className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
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
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("profile");
  const [saved, setSaved] = React.useState(false);

  // Profile state
  const [profile, setProfile] = React.useState<{
    name: string; title: string; email: string; company: string; timezone: string; language: string;
  }>({
    name: "Alex Rivers", title: "Sales Director", email: "alex.rivers@salespro.ai",
    company: "YSalesPro Enterprise", timezone: "UTC-5 (Eastern)", language: "English",
  });

  // Notifications state
  const [notifs, setNotifs] = React.useState({
    email_new_lead: true, email_followup: true, email_won: true,
    push_calls: false, push_meetings: true, push_pipeline: false,
    slack_hot_leads: true, slack_daily_digest: false,
  });

  // Security state
  const [apiKey] = React.useState("sp_live_xk9mQ7tN2bF3pL8rZ4wY6vH1cJ0dA5sE");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const INTEGRATIONS = [
    { name: "Hasura GraphQL", desc: "Primary data source for organization and lead data", color: "text-indigo-400", status: "Connected", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "Gmail / Google Workspace", desc: "Email sync for outreach tracking and thread history", color: "text-red-400", status: "Connected", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "LinkedIn Sales Navigator", desc: "Contact enrichment and LinkedIn outreach sequences", color: "text-blue-400", status: "Connected", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "Slack", desc: "Pipeline alerts, deal notifications, and daily digest bot", color: "text-purple-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
    { name: "Zoom", desc: "Auto-schedule meetings and record call outcomes", color: "text-blue-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
    { name: "HubSpot CRM", desc: "Bidirectional sync with HubSpot contacts and deals", color: "text-orange-400", status: "Not Connected", statusColor: "bg-muted/40 text-muted-foreground border-border/40" },
  ];

  const TEAM_MEMBERS = [
    { name: "Alex Rivers", email: "alex.rivers@salespro.ai", role: "Admin", avatar: "AR" },
    { name: "Sarah Connor", email: "s.connor@salespro.ai", role: "Sales Rep", avatar: "SC" },
    { name: "David Kim", email: "d.kim@salespro.ai", role: "Sales Rep", avatar: "DK" },
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
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">AR</div>
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
                  <option>UTC-8 (Pacific)</option>
                  <option>UTC-7 (Mountain)</option>
                  <option>UTC-6 (Central)</option>
                  <option>UTC-5 (Eastern)</option>
                  <option>UTC+1 (CET)</option>
                  <option>UTC+0 (GMT)</option>
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
              {TEAM_MEMBERS.map(m => (
                <div key={m.email} className="flex items-center gap-3 p-4 bg-card/40 border border-border/40 rounded-xl">
                  <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge className={m.role === "Admin" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}>
                    {m.role}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">Edit</Button>
                </div>
              ))}
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

      case "data":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Data & Hasura Configuration</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your GraphQL data source connection settings.</p>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Hasura GraphQL Endpoint</Label>
                <Input defaultValue="https://your-hasura-instance.hasura.app/v1/graphql" className="bg-muted/40 border-border/60 h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Hasura Admin Secret</Label>
                <Input type="password" defaultValue="your-admin-secret-here" className="bg-muted/40 border-border/60 h-9 text-xs font-mono" />
                <p className="text-[10px] text-muted-foreground">Stored securely as environment variable HASURA_ADMIN_SECRET</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Connection Status: Active
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Latency: 42ms</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Data Sources</p>
                {[
                  { table: "aa_s_organizations", records: "1,247 organizations", status: "Synced" },
                  { table: "aa_s_industries", records: "89 industries", status: "Synced" },
                  { table: "aa_s_decision_makers", records: "5,892 contacts", status: "Synced" },
                  { table: "aa_s_leads", records: "342 leads", status: "Synced" },
                ].map(s => (
                  <div key={s.table} className="flex items-center justify-between p-3 bg-card/40 border border-border/40 rounded-lg">
                    <div>
                      <span className="font-mono text-[11px] text-indigo-400">{s.table}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">· {s.records}</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold">Security & API Keys</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage API access tokens, 2FA, and session settings.</p>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input value={apiKey} readOnly className="bg-muted/40 border-border/60 h-9 text-xs font-mono" />
                  <Button variant="outline" size="sm" className="h-9 shrink-0 text-xs border-border/60">Copy</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Use this key to authenticate YSalesPro API requests from external systems.</p>
              </div>
              <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security to your account">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Enabled</Badge>
                </SettingRow>
                <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
                  <select className="bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-xs outline-none">
                    <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>Never</option>
                  </select>
                </SettingRow>
                <SettingRow label="IP Allowlisting" description="Restrict access to trusted IP ranges only">
                  <ToggleSwitch checked={false} onChange={() => { }} />
                </SettingRow>
              </div>
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
              <SettingRow label="Accent Color" description="Primary color used across the interface">
                <div className="flex gap-2">
                  {["bg-indigo-500", "bg-purple-500", "bg-emerald-500", "bg-blue-500", "bg-pink-500", "bg-amber-500"].map(c => (
                    <button key={c} className={`h-5 w-5 rounded-full ${c} ${c === "bg-indigo-500" ? "ring-2 ring-offset-1 ring-offset-background ring-indigo-400" : ""}`} />
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
        <main className="flex-1 p-6 max-w-5xl mx-auto overflow-y-auto">
          <div className="flex gap-6">
            {/* Settings Nav */}
            <div className="w-52 shrink-0 space-y-1">
              {NAV_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${activeSection === item.id
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                    }`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            {/* Settings Content */}
            <div className="flex-1 min-w-0">
              <Card className="border-border/50 bg-card/60 p-6">
                {renderSection()}
                <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Changes are saved immediately after clicking Save.</p>
                  <Button size="sm" onClick={handleSave}
                    className={`text-xs gap-1.5 font-semibold h-9 transition-colors ${saved ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                    {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
