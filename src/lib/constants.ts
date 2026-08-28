/**
 * Application Constants
 *
 * NOTE: Dynamic business configurations (Pipeline Stages, Stage Colors, Lead Temperatures,
 * Campaign Sequence Templates, Automation Rules, Schedules, Notifications, Appearance, and Security)
 * have been migrated to normalized PostgreSQL tables (aa_s_settings_*) and are loaded dynamically
 * per account company via `useSettings()` and `src/services/private/settingsService.ts`.
 */

export const APP_NAME = "SalesPro AI";
export const APP_VERSION = "2.0.0";

