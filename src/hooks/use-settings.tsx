"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getCompanySettingsActionByToken,
  updateCompanySettingsActionByToken,
} from "@/services/private/settingsService";
import type {
  CompanySettings,
  LeadStage,
  SequenceStep,
  CampaignRules,
  CampaignSchedule,
  DailyFollowUpRule,
  NotificationSettings,
  AppearanceSettings,
  SecuritySettings,
} from "@/lib/types";

export interface SettingsContextType {
  settings: CompanySettings | null;
  loading: boolean;
  pipelineStages: LeadStage[];
  stageColors: Record<string, { bg: string; text: string; border: string; dot: string }>;
  tempColors: Record<string, { badge: string }>;
  defaultSequence: SequenceStep[];
  defaultRules: CampaignRules | null;
  defaultSchedule: CampaignSchedule | null;
  dailyRules: DailyFollowUpRule[];
  notifications: NotificationSettings | null;
  appearance: AppearanceSettings | null;
  security: SecuritySettings | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<CompanySettings | null>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  pipelineStages: [],
  stageColors: {},
  tempColors: {},
  defaultSequence: [],
  defaultRules: null,
  defaultSchedule: null,
  dailyRules: [],
  notifications: null,
  appearance: null,
  security: null,
  refreshSettings: async () => {},
  updateSettings: async () => null,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken(true);
      const data = await getCompanySettingsActionByToken(token);
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Could not load company settings from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<CompanySettings>): Promise<CompanySettings | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken(true);
      const updated = await updateCompanySettingsActionByToken(token, updates);
      if (updated) {
        setSettings(updated);
        return updated;
      }
    } catch (err) {
      console.error("Failed to update company settings in DB:", err);
      throw err;
    }
    return null;
  };

  const value: SettingsContextType = {
    settings,
    loading,
    pipelineStages: settings?.pipeline_stages || [],
    stageColors: settings?.stage_colors || {},
    tempColors: settings?.temp_colors || {},
    defaultSequence: settings?.default_sequence || [],
    defaultRules: settings?.default_rules || null,
    defaultSchedule: settings?.default_schedule || null,
    dailyRules: settings?.daily_rules || [],
    notifications: settings?.notifications || null,
    appearance: settings?.appearance || null,
    security: settings?.security || null,
    refreshSettings: fetchSettings,
    updateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
