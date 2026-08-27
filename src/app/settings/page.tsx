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
  ToggleLeft, ToggleRight, Plus, Trash2, Edit3, Loader2, Sparkles,
  Linkedin, Check, AlertCircle, RefreshCw, Key, Server, Lock,
} from "lucide-react";
import {
  getConnectedAccountsActionByToken,
  saveConnectedAccountActionByToken,
  deleteConnectedAccountActionByToken,
  toggleAccountActiveActionByToken,
  testAccountConnectionActionByToken,
} from "@/services/private/connectedAccountsService";
import type {
  ConnectedAccount,
  EmailAccountConfig,
  LinkedInAccountConfig,
  EmailProviderType,
  LinkedInProviderType,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

  // Connected accounts state
  const [accounts, setAccounts] = React.useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);
  const [testingAccountId, setTestingAccountId] = React.useState<string | null>(null);

  // Email account modal state
  const [emailModalOpen, setEmailModalOpen] = React.useState(false);
  const [editingEmailAccount, setEditingEmailAccount] = React.useState<ConnectedAccount | null>(null);
  const [emailForm, setEmailForm] = React.useState<{
    name: string;
    provider: EmailProviderType;
    host: string;
    port: string;
    secure: boolean;
    username: string;
    password: string;
    api_key: string;
    from_name: string;
    from_email: string;
    reply_to: string;
    daily_send_limit: string;
    is_default: boolean;
  }>({
    name: "",
    provider: "google_workspace",
    host: "smtp.gmail.com",
    port: "465",
    secure: true,
    username: "",
    password: "",
    api_key: "",
    from_name: "",
    from_email: "",
    reply_to: "",
    daily_send_limit: "250",
    is_default: false,
  });

  // LinkedIn account modal state
  const [linkedinModalOpen, setLinkedinModalOpen] = React.useState(false);
  const [editingLinkedinAccount, setEditingLinkedinAccount] = React.useState<ConnectedAccount | null>(null);
  const [linkedinForm, setLinkedinForm] = React.useState<{
    name: string;
    provider: LinkedInProviderType;
    account_name: string;
    vanity_name: string;
    profile_url: string;
    access_token: string;
    webhook_url: string;
    daily_connection_limit: string;
    daily_message_limit: string;
    is_default: boolean;
  }>({
    name: "",
    provider: "linkedin_api",
    account_name: "",
    vanity_name: "",
    profile_url: "",
    access_token: "",
    webhook_url: "",
    daily_connection_limit: "30",
    daily_message_limit: "50",
    is_default: false,
  });

  // Test feedback in modal
  const [testingModal, setTestingModal] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

  // Load connected accounts
  const loadAccounts = React.useCallback(async () => {
    if (!user) return;
    setLoadingAccounts(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getConnectedAccountsActionByToken(token);
      setAccounts(data || []);
    } catch (err) {
      console.error("Failed to load connected accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleOpenEmailModal = (account?: ConnectedAccount) => {
    setTestResult(null);
    if (account) {
      setEditingEmailAccount(account);
      setEmailForm({
        name: account.name,
        provider: account.email_config?.provider || "google_workspace",
        host: account.email_config?.host || "smtp.gmail.com",
        port: String(account.email_config?.port || 465),
        secure: account.email_config?.secure ?? true,
        username: account.email_config?.username || "",
        password: account.email_config?.password || "",
        api_key: account.email_config?.api_key || "",
        from_name: account.email_config?.from_name || "",
        from_email: account.email_config?.from_email || "",
        reply_to: account.email_config?.reply_to || "",
        daily_send_limit: String(account.email_config?.daily_send_limit || 250),
        is_default: account.is_default,
      });
    } else {
      setEditingEmailAccount(null);
      setEmailForm({
        name: "Google Workspace Mailbox",
        provider: "google_workspace",
        host: "smtp.gmail.com",
        port: "465",
        secure: true,
        username: profile.email || "",
        password: "",
        api_key: "",
        from_name: profile.name || "SalesPro Executive",
        from_email: profile.email || "",
        reply_to: profile.email || "",
        daily_send_limit: "250",
        is_default: accounts.filter(a => a.channel === "Email").length === 0,
      });
    }
    setEmailModalOpen(true);
  };

  const handleOpenLinkedinModal = (account?: ConnectedAccount) => {
    setTestResult(null);
    if (account) {
      setEditingLinkedinAccount(account);
      setLinkedinForm({
        name: account.name,
        provider: account.linkedin_config?.provider || "linkedin_api",
        account_name: account.linkedin_config?.account_name || "",
        vanity_name: account.linkedin_config?.vanity_name || "",
        profile_url: account.linkedin_config?.profile_url || "",
        access_token: account.linkedin_config?.access_token || "",
        webhook_url: account.linkedin_config?.webhook_url || "",
        daily_connection_limit: String(account.linkedin_config?.daily_connection_limit || 30),
        daily_message_limit: String(account.linkedin_config?.daily_message_limit || 50),
        is_default: account.is_default,
      });
    } else {
      setEditingLinkedinAccount(null);
      setLinkedinForm({
        name: "Executive LinkedIn Profile",
        provider: "linkedin_api",
        account_name: profile.name || "Outreach Rep",
        vanity_name: (profile.name || "outreach").toLowerCase().replace(/\s+/g, "-"),
        profile_url: "https://linkedin.com/in/",
        access_token: "",
        webhook_url: "",
        daily_connection_limit: "30",
        daily_message_limit: "50",
        is_default: accounts.filter(a => a.channel === "LinkedIn").length === 0,
      });
    }
    setLinkedinModalOpen(true);
  };

  const handleTestEmailModal = async () => {
    if (!user) return;
    setTestingModal(true);
    setTestResult(null);
    try {
      const token = await user.getIdToken(true);
      const res = await testAccountConnectionActionByToken(token, {
        channel: "Email",
        email_config: {
          provider: emailForm.provider,
          host: emailForm.host,
          port: Number(emailForm.port) || 465,
          secure: emailForm.secure,
          username: emailForm.username,
          password: emailForm.password,
          api_key: emailForm.api_key,
          from_name: emailForm.from_name,
          from_email: emailForm.from_email,
          reply_to: emailForm.reply_to,
          daily_send_limit: Number(emailForm.daily_send_limit) || 200,
        },
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Connection test failed." });
    } finally {
      setTestingModal(false);
    }
  };

  const handleTestLinkedinModal = async () => {
    if (!user) return;
    setTestingModal(true);
    setTestResult(null);
    try {
      const token = await user.getIdToken(true);
      const res = await testAccountConnectionActionByToken(token, {
        channel: "LinkedIn",
        linkedin_config: {
          provider: linkedinForm.provider,
          account_name: linkedinForm.account_name,
          vanity_name: linkedinForm.vanity_name,
          profile_url: linkedinForm.profile_url,
          access_token: linkedinForm.access_token,
          webhook_url: linkedinForm.webhook_url,
          daily_connection_limit: Number(linkedinForm.daily_connection_limit) || 30,
          daily_message_limit: Number(linkedinForm.daily_message_limit) || 50,
        },
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Linkage test failed." });
    } finally {
      setTestingModal(false);
    }
  };

  const handleSaveEmailAccount = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await saveConnectedAccountActionByToken(token, {
        id: editingEmailAccount?.id,
        name: emailForm.name || "Email Mailbox",
        channel: "Email",
        status: "active",
        is_default: emailForm.is_default,
        is_active: true,
        email_config: {
          provider: emailForm.provider,
          host: emailForm.host,
          port: Number(emailForm.port) || 465,
          secure: emailForm.secure,
          username: emailForm.username,
          password: emailForm.password,
          api_key: emailForm.api_key,
          from_name: emailForm.from_name,
          from_email: emailForm.from_email,
          reply_to: emailForm.reply_to,
          daily_send_limit: Number(emailForm.daily_send_limit) || 250,
        },
      });
      setEmailModalOpen(false);
      loadAccounts();
    } catch (err) {
      console.error("Failed to save email account:", err);
    }
  };

  const handleSaveLinkedinAccount = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await saveConnectedAccountActionByToken(token, {
        id: editingLinkedinAccount?.id,
        name: linkedinForm.name || "LinkedIn Profile",
        channel: "LinkedIn",
        status: "active",
        is_default: linkedinForm.is_default,
        is_active: true,
        linkedin_config: {
          provider: linkedinForm.provider,
          account_name: linkedinForm.account_name,
          vanity_name: linkedinForm.vanity_name,
          profile_url: linkedinForm.profile_url,
          access_token: linkedinForm.access_token,
          webhook_url: linkedinForm.webhook_url,
          daily_connection_limit: Number(linkedinForm.daily_connection_limit) || 30,
          daily_message_limit: Number(linkedinForm.daily_message_limit) || 50,
        },
      });
      setLinkedinModalOpen(false);
      loadAccounts();
    } catch (err) {
      console.error("Failed to save LinkedIn account:", err);
    }
  };

  const handleToggleAccount = async (id: string, active: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await toggleAccountActiveActionByToken(token, id, active);
      loadAccounts();
    } catch (err) {
      console.error("Failed to toggle account:", err);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to disconnect this sending account?")) return;
    try {
      const token = await user.getIdToken(true);
      await deleteConnectedAccountActionByToken(token, id);
      loadAccounts();
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const handleTestExistingAccount = async (account: ConnectedAccount) => {
    if (!user) return;
    setTestingAccountId(account.id);
    try {
      const token = await user.getIdToken(true);
      const res = await testAccountConnectionActionByToken(token, account);
      alert(res.message);
    } catch (err: any) {
      alert("Test failed: " + err?.message);
    } finally {
      setTestingAccountId(null);
    }
  };

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
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Plug className="h-4 w-4 text-indigo-400" /> Connected Sending Accounts & Integrations
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Link live email mailboxes (Google Workspace, SMTP, Resend) and LinkedIn profiles for outbound multi-channel outreach.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenEmailModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Mail className="h-3.5 w-3.5" /> Connect Mailbox
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenLinkedinModal()}
                  className="text-xs h-8 gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                >
                  <Linkedin className="h-3.5 w-3.5" /> Link LinkedIn
                </Button>
              </div>
            </div>

            {/* ─── 1. Email Sending Channels ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Outbound Email Mailboxes & SMTP Transports
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
                  {accounts.filter(a => a.channel === "Email" && a.is_active).length} Active Mailbox(es)
                </Badge>
              </div>

              {loadingAccounts ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border/40 rounded-xl flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Loading connected mailboxes...
                </div>
              ) : accounts.filter(a => a.channel === "Email").length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border/50 rounded-xl bg-card/20 space-y-2">
                  <p className="text-xs font-semibold text-foreground">No email sending mailboxes connected</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Connect Google Workspace, an SMTP server, or an API key to dispatch real outreach emails directly to contacts.
                  </p>
                  <Button size="sm" onClick={() => handleOpenEmailModal()} className="text-xs bg-indigo-600 text-white h-8 mt-2">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Connect Mailbox
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.filter(a => a.channel === "Email").map(acc => (
                    <div key={acc.id} className="flex items-center justify-between gap-3 p-4 bg-card/60 border border-border/50 rounded-xl hover:border-border/80 transition-all flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-foreground">{acc.name}</p>
                            {acc.is_default && (
                              <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[9px]">
                                Default Sender
                              </Badge>
                            )}
                            <Badge className={acc.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]" : "bg-muted text-muted-foreground text-[9px]"}>
                              {acc.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {acc.email_config?.from_email} · Provider: <span className="capitalize">{acc.email_config?.provider?.replace("_", " ")}</span> · Limit: {acc.email_config?.daily_send_limit || 200}/day
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={testingAccountId === acc.id}
                          onClick={() => handleTestExistingAccount(acc)}
                          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {testingAccountId === acc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEmailModal(acc)}
                          className="h-8 text-xs gap-1 border-border/60"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </Button>
                        <ToggleSwitch
                          checked={acc.is_active}
                          onChange={(v) => handleToggleAccount(acc.id, v)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── 2. LinkedIn Sending Channels ─── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    LinkedIn Sender Profiles & Automation Relays
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
                  {accounts.filter(a => a.channel === "LinkedIn" && a.is_active).length} Active LinkedIn Profile(s)
                </Badge>
              </div>

              {loadingAccounts ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border/40 rounded-xl flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Loading LinkedIn accounts...
                </div>
              ) : accounts.filter(a => a.channel === "LinkedIn").length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border/50 rounded-xl bg-card/20 space-y-2">
                  <p className="text-xs font-semibold text-foreground">No LinkedIn accounts linked</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Link a LinkedIn profile or automation relay to dispatch personalized InMails and connection requests.
                  </p>
                  <Button size="sm" onClick={() => handleOpenLinkedinModal()} className="text-xs bg-blue-600 text-white h-8 mt-2">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Link LinkedIn
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.filter(a => a.channel === "LinkedIn").map(acc => (
                    <div key={acc.id} className="flex items-center justify-between gap-3 p-4 bg-card/60 border border-border/50 rounded-xl hover:border-border/80 transition-all flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Linkedin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-foreground">{acc.name}</p>
                            {acc.is_default && (
                              <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[9px]">
                                Default Profile
                              </Badge>
                            )}
                            <Badge className={acc.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]" : "bg-muted text-muted-foreground text-[9px]"}>
                              {acc.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {acc.linkedin_config?.account_name} · Safety Limits: {acc.linkedin_config?.daily_connection_limit || 30} connects/day, {acc.linkedin_config?.daily_message_limit || 50} msgs/day
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={testingAccountId === acc.id}
                          onClick={() => handleTestExistingAccount(acc)}
                          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {testingAccountId === acc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-blue-400" />}
                          Test Linkage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLinkedinModal(acc)}
                          className="h-8 text-xs gap-1 border-border/60"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </Button>
                        <ToggleSwitch
                          checked={acc.is_active}
                          onChange={(v) => handleToggleAccount(acc.id, v)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── 3. Other CRM & Collaboration Integrations ─── */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                CRM, Telephony & Notification Integrations
              </h3>
              <div className="space-y-2.5">
                {INTEGRATIONS.map(int => (
                  <div key={int.name} className="flex items-center gap-3 p-3.5 bg-card/40 border border-border/40 rounded-xl">
                    <div className={`h-8 w-8 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center ${int.color} shrink-0`}>
                      <Plug className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground">{int.name}</p>
                      <p className="text-[10px] text-muted-foreground">{int.desc}</p>
                    </div>
                    <Badge className={`${int.statusColor} text-[9px] shrink-0`}>{int.status}</Badge>
                    <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 border-border/60 shrink-0">
                      {int.status === "Connected" ? "Manage" : "Connect"}
                    </Button>
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
      {/* ─── Email Mailbox Modal ─── */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-xl bg-card border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-400" />
              {editingEmailAccount ? "Edit Email Sending Mailbox" : "Connect New Email Mailbox"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure SMTP or API credentials to send live outreach emails with custom headers and delivery tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Account / Mailbox Name</Label>
              <Input
                placeholder="e.g. Primary Google Workspace / SDR Outbox"
                value={emailForm.name}
                onChange={e => setEmailForm(f => ({ ...f, name: e.target.value }))}
                className="bg-muted/40 text-xs h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Provider Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "google_workspace", label: "Google / Gmail" },
                  { id: "smtp", label: "Custom SMTP" },
                  { id: "resend", label: "Resend API" },
                  { id: "sendgrid", label: "SendGrid API" },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setEmailForm(f => ({
                        ...f,
                        provider: p.id as EmailProviderType,
                        host: p.id === "google_workspace" ? "smtp.gmail.com" : p.id === "smtp" ? f.host : "",
                        port: p.id === "google_workspace" ? "465" : p.id === "smtp" ? "587" : "",
                        secure: p.id === "google_workspace" ? true : f.secure,
                      }));
                      setTestResult(null);
                    }}
                    className={`p-2 rounded-lg text-center border text-[11px] font-semibold transition-all ${
                      emailForm.provider === p.id
                        ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/50"
                        : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider specific inputs */}
            {(emailForm.provider === "google_workspace" || emailForm.provider === "smtp") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">SMTP Host Server</Label>
                  <Input
                    placeholder="smtp.gmail.com or smtp.mailgun.org"
                    value={emailForm.host}
                    onChange={e => setEmailForm(f => ({ ...f, host: e.target.value }))}
                    className="bg-muted/40 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Port (465 SSL / 587 TLS)</Label>
                  <Input
                    placeholder="465"
                    value={emailForm.port}
                    onChange={e => setEmailForm(f => ({ ...f, port: e.target.value }))}
                    className="bg-muted/40 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Username / Auth Email</Label>
                  <Input
                    placeholder="rep@yourcompany.com"
                    value={emailForm.username}
                    onChange={e => setEmailForm(f => ({ ...f, username: e.target.value }))}
                    className="bg-muted/40 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">
                    {emailForm.provider === "google_workspace" ? "Google App Password (16 characters)" : "SMTP Password"}
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={emailForm.password}
                    onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-muted/40 text-xs h-8 font-mono"
                  />
                  {emailForm.provider === "google_workspace" && (
                    <p className="text-[10px] text-muted-foreground">
                      Tip: Generate an App Password in your Google Account Security settings for secure 2FA sending.
                    </p>
                  )}
                </div>
              </div>
            )}

            {(emailForm.provider === "resend" || emailForm.provider === "sendgrid") && (
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                <Label className="text-[11px]">
                  {emailForm.provider === "resend" ? "Resend API Key (re_...)" : "SendGrid API Key (SG....)"}
                </Label>
                <Input
                  type="password"
                  placeholder="Enter API Key..."
                  value={emailForm.api_key}
                  onChange={e => setEmailForm(f => ({ ...f, api_key: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From Name</Label>
                <Input
                  placeholder="e.g. Alex Rivera"
                  value={emailForm.from_name}
                  onChange={e => setEmailForm(f => ({ ...f, from_name: e.target.value }))}
                  className="bg-muted/40 text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From Email Address</Label>
                <Input
                  placeholder="alex@yourcompany.com"
                  value={emailForm.from_email}
                  onChange={e => setEmailForm(f => ({ ...f, from_email: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Reply-To Address (Optional)</Label>
                <Input
                  placeholder="replies@yourcompany.com"
                  value={emailForm.reply_to}
                  onChange={e => setEmailForm(f => ({ ...f, reply_to: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Daily Send Quota / Safety Cap</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={emailForm.daily_send_limit}
                  onChange={e => setEmailForm(f => ({ ...f, daily_send_limit: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-foreground">Set as Default Sender Mailbox</p>
                <p className="text-[10px] text-muted-foreground">Automatically used for single messages and cold sequences.</p>
              </div>
              <ToggleSwitch
                checked={emailForm.is_default}
                onChange={v => setEmailForm(f => ({ ...f, is_default: v }))}
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />}
                <p className="leading-relaxed">{testResult.message}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              disabled={testingModal}
              onClick={handleTestEmailModal}
              className="text-xs h-8 gap-1.5 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10"
            >
              {testingModal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
              Test Connection
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEmailModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveEmailAccount}
                disabled={!emailForm.from_email || testingModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 shadow-md shadow-indigo-500/20"
              >
                Save Mailbox
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── LinkedIn Profile Modal ─── */}
      <Dialog open={linkedinModalOpen} onOpenChange={setLinkedinModalOpen}>
        <DialogContent className="max-w-xl bg-card border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-400" />
              {editingLinkedinAccount ? "Edit LinkedIn Account" : "Link LinkedIn Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure LinkedIn API credentials, OAuth session, or automation webhook relay with automated safety limits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Account Label</Label>
              <Input
                placeholder="e.g. Senior AE LinkedIn Profile"
                value={linkedinForm.name}
                onChange={e => setLinkedinForm(f => ({ ...f, name: e.target.value }))}
                className="bg-muted/40 text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Profile Name</Label>
                <Input
                  placeholder="e.g. Alex Rivera"
                  value={linkedinForm.account_name}
                  onChange={e => setLinkedinForm(f => ({ ...f, account_name: e.target.value }))}
                  className="bg-muted/40 text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vanity Identifier / Slug</Label>
                <Input
                  placeholder="e.g. alex-rivera-sales"
                  value={linkedinForm.vanity_name}
                  onChange={e => setLinkedinForm(f => ({ ...f, vanity_name: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">LinkedIn Profile URL</Label>
              <Input
                placeholder="https://linkedin.com/in/alexrivera"
                value={linkedinForm.profile_url}
                onChange={e => setLinkedinForm(f => ({ ...f, profile_url: e.target.value }))}
                className="bg-muted/40 text-xs h-8 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Connection Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "linkedin_api", label: "LinkedIn API" },
                  { id: "webhook", label: "Webhook Relay" },
                  { id: "unipile", label: "Unipile Proxy" },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLinkedinForm(f => ({ ...f, provider: p.id as LinkedInProviderType }));
                      setTestResult(null);
                    }}
                    className={`p-2 rounded-lg text-center border text-[11px] font-semibold transition-all ${
                      linkedinForm.provider === p.id
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/50"
                        : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {linkedinForm.provider === "webhook" ? (
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                <Label className="text-[11px]">Webhook Dispatch Endpoint URL</Label>
                <Input
                  placeholder="https://automation.yourdomain.com/webhook/linkedin"
                  value={linkedinForm.webhook_url}
                  onChange={e => setLinkedinForm(f => ({ ...f, webhook_url: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                <Label className="text-[11px]">Access Token / Session Cookie (li_at)</Label>
                <Input
                  type="password"
                  placeholder="Enter token or session identifier..."
                  value={linkedinForm.access_token}
                  onChange={e => setLinkedinForm(f => ({ ...f, access_token: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Daily Connect Limit (Safety Cap)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={linkedinForm.daily_connection_limit}
                  onChange={e => setLinkedinForm(f => ({ ...f, daily_connection_limit: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Daily Message Limit</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={linkedinForm.daily_message_limit}
                  onChange={e => setLinkedinForm(f => ({ ...f, daily_message_limit: e.target.value }))}
                  className="bg-muted/40 text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-foreground">Set as Default LinkedIn Sender</p>
                <p className="text-[10px] text-muted-foreground">Used for LinkedIn messages across AI messaging & campaigns.</p>
              </div>
              <ToggleSwitch
                checked={linkedinForm.is_default}
                onChange={v => setLinkedinForm(f => ({ ...f, is_default: v }))}
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />}
                <p className="leading-relaxed">{testResult.message}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              disabled={testingModal}
              onClick={handleTestLinkedinModal}
              className="text-xs h-8 gap-1.5 border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
            >
              {testingModal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-blue-400" />}
              Test Linkage
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLinkedinModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveLinkedinAccount}
                disabled={(!linkedinForm.account_name && !linkedinForm.profile_url) || testingModal}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 shadow-md shadow-blue-500/20"
              >
                Save LinkedIn Profile
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
