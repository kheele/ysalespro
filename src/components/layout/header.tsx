
import * as React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";

type PageHeaderProps = {
  title: string | React.ReactNode;
  titleContent?: React.ReactNode;
  children?: React.ReactNode;
};

export function Header({ title, titleContent, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-sidebar px-4 text-sidebar-foreground md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
        <Logo className="w-6 h-6 text-primary" />
        <span className="text-lg font-semibold">SafetyFilePro</span>
      </div>
      <div className="flex-1">
        {titleContent || <h2 className="text-lg font-normal md:text-xl hidden md:block">{title as string}</h2>}
      </div>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}
