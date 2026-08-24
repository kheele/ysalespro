'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function UpgradeDialog({ open, onOpenChange, allPlans }: { open?: boolean; onOpenChange?: (open: boolean) => void; allPlans?: any }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Account</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
