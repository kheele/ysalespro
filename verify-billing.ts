import { DEFAULT_BILLING_PLANS } from './src/services/private/billingService';

console.log('Testing Billing Plans...');

const zaPlans = DEFAULT_BILLING_PLANS.filter(p => p.country_code === 'ZA');
console.log(`Found ${zaPlans.length} plans for South Africa (ZA):`);
for (const p of zaPlans) {
  console.log(`- ${p.name} (${p.tier}, level ${p.tier_level}): R${p.price} | Email Cap: ${p.email_limit?.toLocaleString()}`);
}

if (zaPlans.length !== 4) {
  console.error('FAIL: Expected 4 ZA plans, got', zaPlans.length);
  process.exit(1);
}

const expected = [
  { name: 'Starter', price: 1500, email_limit: 1500 },
  { name: 'Pro', price: 4500, email_limit: 5000 },
  { name: 'Business', price: 7500, email_limit: 10000 },
  { name: 'Enterprise', price: 10000, email_limit: 15000 },
];

for (let i = 0; i < expected.length; i++) {
  const p = zaPlans[i];
  const exp = expected[i];
  if (p.name !== exp.name || p.price !== exp.price || p.email_limit !== exp.email_limit) {
    console.error(`FAIL: Plan mismatch at index ${i}`, p, exp);
    process.exit(1);
  }
}

console.log('SUCCESS: All 4 pricing tiers and email sending caps are correctly configured!');
