import { describe, it, expect } from 'vitest';
import { DEFAULT_BILLING_PLANS } from '@/services/private/billingService';

describe('Billing Tiers and Email Sending Caps', () => {
  it('should define exactly 4 tiers for South Africa (ZA)', () => {
    const zaPlans = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === 'ZA');
    expect(zaPlans).toHaveLength(4);

    const [starter, pro, business, enterprise] = zaPlans;

    // Names & Tiers
    expect(starter.name).toBe('Starter');
    expect(pro.name).toBe('Pro');
    expect(business.name).toBe('Business');
    expect(enterprise.name).toBe('Enterprise');

    // Prices: R1500, R4500, R7500, R10000
    expect(starter.price).toBe(1500);
    expect(pro.price).toBe(4500);
    expect(business.price).toBe(7500);
    expect(enterprise.price).toBe(10000);

    // Currencies: ZAR (R)
    expect(starter.currency).toBe('ZAR');
    expect(starter.currency_symbol).toBe('R');

    // Email Sending Caps: 1500, 5000, 10000, 15000
    expect(starter.email_limit).toBe(1500);
    expect(pro.email_limit).toBe(5000);
    expect(business.email_limit).toBe(10000);
    expect(enterprise.email_limit).toBe(15000);

    // Limits object
    expect(starter.limits?.email_sending).toBe(1500);
    expect(pro.limits?.email_sending).toBe(5000);
    expect(business.limits?.email_sending).toBe(10000);
    expect(enterprise.limits?.email_sending).toBe(15000);
  });

  it('should correctly configure 4 tiers for pegged regions (LSL, NAD, SZL)', () => {
    const countries = ['LS', 'NA', 'SZ'];

    for (const code of countries) {
      const plans = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === code);
      expect(plans).toHaveLength(4);

      const prices = plans.map((p) => p.price);
      expect(prices).toEqual([1500, 4500, 7500, 10000]);

      const caps = plans.map((p) => p.email_limit);
      expect(caps).toEqual([1500, 5000, 10000, 15000]);
    }
  });

  it('should correctly configure 4 tiers for Botswana (BW) and Global (US)', () => {
    const bwPlans = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === 'BW');
    expect(bwPlans).toHaveLength(4);
    expect(bwPlans.map((p) => p.email_limit)).toEqual([1500, 5000, 10000, 15000]);

    const usPlans = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === 'US');
    expect(usPlans).toHaveLength(4);
    expect(usPlans.map((p) => p.email_limit)).toEqual([1500, 5000, 10000, 15000]);
  });
});
