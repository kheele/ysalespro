
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderKanban,
  GanttChartSquare,
  Users,
  FileText,
  Calendar,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  Gavel,
  Layers,
  Handshake,
  Building2,
  Sparkles,
  Archive,
  CreditCard,
  Rocket,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { UpgradeDialog } from "../forms/upgrade-dialog";
import { type BillingPlan } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { getActiveBillingPlansAction } from "@/services/private/billingService";

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, dbUser } = useAuth();
  const [plans, setPlans] = React.useState<BillingPlan[]>([]);
  const permissions = dbUser?.permissions || {};
  const isSuperAdmin = dbUser?.role === 'SuperAdmin';

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", permission: "View Projects & Documents" },
    { name: "Calendar", icon: Calendar, path: "/calendar", permission: "View Projects & Documents" },

    { name: "Projects", icon: FolderKanban, path: "/", permission: "View Projects & Documents" },
    { name: "Contractors", icon: Users, path: "/contractors", permission: "View Projects & Documents" },
    { name: "All Documents", icon: FileText, path: "/all-documents", permission: "View Projects & Documents" },
    { name: "Templates", icon: GanttChartSquare, path: "/templates", permission: "View Projects & Documents" },
    { name: "Legal Register", icon: Gavel, path: "/legal-register", permission: "View Projects & Documents" },

    { name: "Users", icon: Users, path: "/users", permission: "User Management" },
    { name: "Permissions", icon: ShieldCheck, path: "/permissions", permission: "User Management" },
    { name: "Notifications", icon: Bell, path: "/notifications", permission: "View Projects & Documents" },
  ];

  const contractorMenuItems = [
    { name: "My Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "My Calendar", icon: Calendar, path: "/calendar" },

    { name: "My Projects", icon: FolderKanban, path: "/" },
    { name: "My Documents", icon: FileText, path: "/all-documents" },
    { name: "My Clients", icon: Handshake, path: "/clients", permission: "View Projects & Documents" },
    { name: "Company Profile", icon: Building2, path: "/profile" },
    { name: "AI Assistant", icon: Sparkles, path: "/ai-assistant" },
  ];

  const [viewMode, setViewMode] = React.useState<string>("organization");

  const adminMenuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Users", icon: Users, path: "/admin/users" },
    { name: "Clients", icon: Users, path: "/admin/clients" },
    { name: "Sectors", icon: Archive, path: "/admin/sectors" },
    { name: "Document Categories", icon: Layers, path: "/admin/document-categories" },
    { name: "Templates", icon: GanttChartSquare, path: "/admin/templates" },
    { name: "Billing", icon: CreditCard, path: "/admin/billing" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith('/documents');
    }
    if (path === "/templates") {
      return pathname.startsWith('/templates') || pathname.startsWith('/project-templates') || pathname.startsWith('/specifications');
    }
    if (path === "/admin/templates") {
      return pathname.startsWith('/admin/templates') || pathname.startsWith('/admin/document-templates') || pathname.startsWith('/admin/project-templates');
    }
    if (path === "/admin/dashboard" && pathname.startsWith('/admin')) {
      return pathname === path || pathname === '/admin'; // Treat /admin as /admin/dashboard
    }
    // Exact match for other main routes
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const visibleMenuItems = menuItems.filter(item => dbUser?.role === 'Admin' || permissions[item.permission]);

  const handleToggle = async (checked: boolean) => {
    const newMode = checked ? 'contractor' : 'company';

    // Redirect logic: if the user toggled and the active path doesn't exist in the new mode's nav list...
    const isAllowedInNewMode = newMode === 'contractor'
      ? contractorMenuItems.some(item => isActive(item.path))
      : visibleMenuItems.some(item => isActive(item.path));

    if (!isAllowedInNewMode) {
      router.push('/');
    }

    setViewMode(newMode);
  };

  const isContractorOnly = (dbUser as any)?.organization?.is_contractor && !(dbUser as any)?.organization?.subscription;

  // Fetch plans for upgrade CTA
  React.useEffect(() => {
    async function fetchPlans() {
      if (!user) return;
      try {
        const data = await getActiveBillingPlansAction();
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans', error);
      }
    }
    fetchPlans();
  }, [user]);

  // Auto-enforce contractor mode for invitation-only contractors
  React.useEffect(() => {
    if (isContractorOnly && viewMode !== 'contractor') {
      setViewMode('contractor');
    }
  }, [isContractorOnly, viewMode, setViewMode]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col justify-center items-center gap-4 border-b py-4">
          <div className="flex flex-col items-center gap-1">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold">SafetyFilePro</span>
          </div>

          {!isContractorOnly && (
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-full">
              <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full transition-all", viewMode === 'company' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Host</span>
              <Switch
                checked={viewMode === 'contractor'}
                onCheckedChange={handleToggle}
                className="scale-75"
              />
              <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full transition-all", viewMode === 'contractor' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Guest</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 overflow-hidden overflow-y-auto">
        <SidebarMenu>
          {isSuperAdmin ? (
            <>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem
                  key={item.name}
                >
                  <Link
                    href={item.path}
                    className={cn(
                      'flex text-[14px] h-[30px] items-center gap-3 rounded-lg px-2 py-1 text-muted-foreground transition-all hover:text-primary',
                      isActive(item.path) && 'bg-muted text-primary'
                    )}
                  >
                    <item.icon className="h-[1.2rem] w-[1.2rem]" />
                    {item.name}
                  </Link>
                </SidebarMenuItem>
              ))}
            </>
          ) : (
            <>
              {(viewMode === 'contractor' ? contractorMenuItems : visibleMenuItems).map((item) => (
                <React.Fragment key={item.name}>
                  <SidebarMenuItem>
                    <Link
                      href={item.path}
                      className={cn(
                        'flex text-[14px] h-[30px] items-center gap-3 rounded-lg px-2 py-1 text-muted-foreground transition-all hover:text-primary',
                        isActive(item.path) && 'bg-muted text-primary'
                      )}
                    >
                      <item.icon className="h-[1.2rem] w-[1.2rem]" />
                      {item.name}
                    </Link>
                  </SidebarMenuItem>
                  {(item.name === 'Calendar' || item.name === 'Legal Register' || (viewMode === 'contractor' && (item.name === 'My Calendar' || item.name === 'My Calendar' || item.name === 'My Clients'))) && <Separator className="mx-2 my-2" />}
                </React.Fragment>
              ))}
            </>
          )}
        </SidebarMenu>

        {isContractorOnly && (
          <div className="mt-auto p-2 py-4 border-t">
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
              <div className="absolute -right-2 -top-2 opacity-20">
                <Rocket className="h-20 w-20 rotate-12" />
              </div>
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  Grow Your Business
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-300">
                  Upgrade to manage your own contractors and custom templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <UpgradeDialog allPlans={plans} />
              </CardContent>
            </Card>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="p-2 text-center text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} SafetyFilePro
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
