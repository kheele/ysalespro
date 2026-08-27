import { ai } from "@/ai/genkit";
import {
  ScoreAndQualifyLeadInputSchema,
  ScoreAndQualifyLeadOutputSchema,
  type ScoreAndQualifyLeadInput,
  type ScoreAndQualifyLeadOutput,
} from "../schemas/lead-qualification";

export function getFallbackLeadQualification(input: ScoreAndQualifyLeadInput): ScoreAndQualifyLeadOutput {
  const isCLevel = /CEO|CTO|CIO|COO|VP|Director|Founder|President/i.test(input.job_title || "");
  const isLarge = /Enterprise|1000\+|Mid-Market/i.test(input.company_size || "");
  const isWarm = /Warm|Hot/i.test(input.stage || "");

  let score = 65;
  if (isCLevel) score += 18;
  if (isLarge) score += 10;
  if (isWarm) score += 7;
  score = Math.min(96, Math.max(45, score));

  const temp = score >= 82 ? "HOT" : score >= 68 ? "WARM" : "COLD";
  const grade = score >= 88 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "C";

  return {
    lead_score: score,
    lead_temperature: temp,
    buying_readiness_grade: grade as any,
    fit_score: Math.min(98, score + 4),
    intent_score: Math.max(50, score - 6),
    qualification_rationale: `${input.person_name} holds a strategic ${input.job_title || "executive"} role at ${input.company_name}. Strong firmographic alignment with enterprise modernization requirements and high authority to allocate procurement budget.`,
    key_strengths: [
      `Direct budget authority as ${input.job_title || "Department Leader"}`,
      `Operates in high-velocity ${input.industry || "B2B"} sector facing operational scalability challenges`,
      `High warmth receptivity to proven metrics and validation-first discovery`,
    ],
    key_risks_or_blockers: [
      `Competing internal priorities may cause inertia unless time-to-value is demonstrated upfront`,
      `Requires executive consensus from technical stakeholders`,
    ],
    recommended_next_action: isCLevel
      ? "Initiate a 15-min discovery call leading with peer industry metrics; preserve autonomy ('Feel free to say no')."
      : "Share a targeted customer ROI case study and request introduction to the department lead.",
    optimal_outreach_channel: isCLevel ? "Phone" : "Email",
  };
}

export const scoreAndQualifyLeadFlow = ai.defineFlow(
  {
    name: "scoreAndQualifyLeadFlow",
    inputSchema: ScoreAndQualifyLeadInputSchema,
    outputSchema: ScoreAndQualifyLeadOutputSchema,
  },
  async (input): Promise<ScoreAndQualifyLeadOutput> => {
    try {
      const prompt = `You are a World-Class Sales Intelligence Analyst and Behavioral Psychologist specializing in Vanessa Van Edwards' human behavior research (The Science of People).

Analyze the following lead profile and evaluate their ICP (Ideal Customer Profile) Fit, Buying Intent, and Readiness:
- Prospect Name: ${input.person_name}
- Job Title: ${input.job_title || "Executive"}
- Company Name: ${input.company_name}
- Industry: ${input.industry || "B2B Enterprise"}
- Company Size: ${input.company_size || "Mid-Market"}
- Current Stage: ${input.stage || "Cold"}
- Follow-up Attempts: ${input.followup_count ?? 0}
- Days Since Last Contact: ${input.last_contact_days_ago ?? "Unknown"}
- CRM Notes: ${input.notes || "None"}

Evaluate and calculate:
1. Lead Score (0 to 100) based on seniority, decision authority, and industry fit.
2. Lead Temperature: 'HOT', 'WARM', or 'COLD'.
3. Buying Readiness Grade: 'A+', 'A', 'B', 'C', or 'D'.
4. Fit Score & Intent Score (0-100).
5. Qualification Rationale (2-3 concise, actionable sentences).
6. 2-3 Key Strengths and 1-2 Key Risks or Deal Blockers.
7. Recommended Next Action applying Vanessa Van Edwards' principles (Warmth + Competence, Autonomy preservation).
8. Optimal Outreach Channel ('Phone', 'Email', 'LinkedIn', 'Meeting').

Return strictly valid JSON matching the schema.`;

      const response = await ai.generate({
        prompt,
        output: { schema: ScoreAndQualifyLeadOutputSchema },
      });

      if (response.output) {
        return response.output;
      }
      return getFallbackLeadQualification(input);
    } catch (err) {
      console.warn("scoreAndQualifyLeadFlow falling back to deterministic heuristic:", err);
      return getFallbackLeadQualification(input);
    }
  }
);
