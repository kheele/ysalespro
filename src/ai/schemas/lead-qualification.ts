import { z } from "zod";

export const ScoreAndQualifyLeadInputSchema = z.object({
  person_name: z.string().describe("Name of the prospect/lead contact"),
  job_title: z.string().optional().describe("Job title of the prospect"),
  company_name: z.string().describe("Company name"),
  industry: z.string().optional().describe("Industry category"),
  company_size: z.string().optional().describe("Company size (e.g. Enterprise, SMB)"),
  stage: z.string().optional().describe("Current pipeline stage (Cold, Contacted, Warm, Hot)"),
  followup_count: z.number().optional().describe("Number of previous follow-up attempts"),
  last_contact_days_ago: z.number().optional().describe("Days since last contact"),
  notes: z.string().optional().describe("Any CRM activity notes or context"),
});

export type ScoreAndQualifyLeadInput = z.infer<typeof ScoreAndQualifyLeadInputSchema>;

export const ScoreAndQualifyLeadOutputSchema = z.object({
  lead_score: z.number().min(0).max(100).describe("Calculated lead score from 0 to 100"),
  lead_temperature: z.enum(["HOT", "WARM", "COLD"]).describe("Assigned lead temperature"),
  buying_readiness_grade: z.enum(["A+", "A", "B", "C", "D"]).describe("Buying readiness letter grade"),
  fit_score: z.number().min(0).max(100).describe("ICP (Ideal Customer Profile) fit score"),
  intent_score: z.number().min(0).max(100).describe("Buying intent & engagement score"),
  qualification_rationale: z.string().describe("Detailed 2-3 sentence executive reasoning for this qualification"),
  key_strengths: z.array(z.string()).describe("Top 2-3 positive indicators (e.g. high decision power, acute pain)"),
  key_risks_or_blockers: z.array(z.string()).describe("1-2 potential risks or reasons the deal could stall"),
  recommended_next_action: z.string().describe("Specific next step (e.g., Send executive case study, Call directly)"),
  optimal_outreach_channel: z.enum(["Phone", "Email", "LinkedIn", "Meeting"]).describe("Highest conversion channel for this lead"),
});

export type ScoreAndQualifyLeadOutput = z.infer<typeof ScoreAndQualifyLeadOutputSchema>;
