
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({
  description,
  children,
}: {
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="flex items-center justify-between gap-4 px-4 py-2">
        <div className="grid gap-1">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center shrink-0 space-x-2">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    