// SHEQ Target Titles & Seniorities
export const SHEQ_TARGET_TITLES = [
  "SHEQ", "SHE", "HSE", "EHS", "QHSE", "HSSE", "HSEQ", "QESH",
  "Safety", "Health and Safety", "Occupational Health and Safety",
  "Environmental", "Quality", "Compliance", "Risk", "Sustainability"
];

export const SHEQ_TARGET_SENIORITIES = ["manager", "head", "director", "vp", "c_suite"];

// ─── Local Title Scoring Engine ──────────────────────────────────────────────
export function scoreCandidateTitle(jobTitle?: string | null): number {
  if (!jobTitle) return 0;
  const title = jobTitle.trim();
  const lower = title.toLowerCase();

  // Explicit Low/Zero Score for Clearly Unrelated Positions
  const unrelatedPatterns = [
    /\bmarketing\b/, /\bfinance\b/, /\bfinancial\b/, /\baccounting\b/,
    /\bhuman resources\b/, /\bhr\b/, /\brecruiter\b/, /\btalent\b/,
    /\bsales\b/, /\baccount executive\b/, /\baccount manager\b/,
    /\bit manager\b/, /\bsoftware engineer\b/, /\bdeveloper\b/, /\bdesigner\b/
  ];

  // Only zero out if there is NO safety/HSE/EHS/SHEQ override in the title
  const hasSafetyKeyword = /\b(safety|hse|ehs|sheq|qhse|hsse|hseq|qesh)\b/.test(lower);
  if (!hasSafetyKeyword && unrelatedPatterns.some(p => p.test(lower))) {
    return 0;
  }

  // Exact / Strong Match Scoring Table
  if (/chief\s+safety\s+officer/i.test(title) || /chief\s+hse\s+officer/i.test(title) || /chief\s+sheq\s+officer/i.test(title)) return 110;

  if (/\bsheq\s+director\b/i.test(title) || /\bhse\s+director\b/i.test(title) || /\behs\s+director\b/i.test(title) ||
      /\bqhse\s+director\b/i.test(title) || /\bhsse\s+director\b/i.test(title) || /\bhseq\s+director\b/i.test(title)) return 105;

  if (/head\s+of\s+sheq\b/i.test(title) || /head\s+of\s+hse\b/i.test(title) || /head\s+of\s+ehs\b/i.test(title) ||
      /head\s+of\s+qhse\b/i.test(title) || /head\s+of\s+safety\b/i.test(title)) return 100;

  if (/\bsheq\s+manager\b/i.test(title) || /\bhse\s+manager\b/i.test(title) || /\behs\s+manager\b/i.test(title) ||
      /\bqhse\s+manager\b/i.test(title) || /\bhsse\s+manager\b/i.test(title) || /\bhseq\s+manager\b/i.test(title)) return 95;

  if (/safety\s+manager\b/i.test(title) || /health\s+and\s+safety\s+manager\b/i.test(title) || /occupational\s+health.*manager\b/i.test(title)) return 90;

  if (/environmental\s+manager\b/i.test(title)) return 85;
  if (/quality\s+manager\b/i.test(title) || /compliance\s+manager\b/i.test(title)) return 80;
  if (/risk\s+manager\b/i.test(title)) return 75;
  if (/sustainability\s+manager\b/i.test(title)) return 70;

  if (/operations\s+director\b/i.test(title)) return 65;
  if (/\bceo\b/i.test(title) || /chief\s+executive\s+officer/i.test(title) || /managing\s+director\b/i.test(title)) return 60;

  // Pattern-based Keyword Scoring Fallback
  let baseScore = 0;
  if (hasSafetyKeyword) {
    if (/\b(chief|vp|vice president)\b/.test(lower)) baseScore = 105;
    else if (/\b(director|head)\b/.test(lower)) baseScore = 100;
    else if (/\b(manager|lead)\b/.test(lower)) baseScore = 90;
    else baseScore = 75;
  } else if (/\benvironmental\b/.test(lower)) {
    baseScore = 80;
  } else if (/\b(quality|compliance)\b/.test(lower)) {
    baseScore = 75;
  } else if (/\b(risk|sustainability)\b/.test(lower)) {
    baseScore = 70;
  } else if (/\b(operations|plant|site|field)\b/.test(lower) && /\b(director|manager|head)\b/.test(lower)) {
    baseScore = 60;
  }

  return baseScore;
}
