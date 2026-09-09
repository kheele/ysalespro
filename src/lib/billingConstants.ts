// Billing constants � no 'use server' directive, safe to import anywhere.
// These are plain data objects so they cannot live in a 'use server' file
// because @vitejs/plugin-rsc requires every export from such files to be async functions.

import type { BillingPlan, SouthernAfricanCountry } from '@/lib/types';

export const SOUTHERN_AFRICAN_COUNTRIES: SouthernAfricanCountry[] = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currency_symbol: 'R' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL', currency_symbol: 'L' },
  { code: 'NA', name: 'Namibia', currency: 'NAD', currency_symbol: 'N$' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', currency_symbol: 'E' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', currency_symbol: 'P' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', currency_symbol: '$' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', currency_symbol: 'K' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', currency_symbol: 'MT' },
  { code: 'US', name: 'United States (Global)', currency: 'USD', currency_symbol: '$' },
];

