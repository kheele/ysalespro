import { z } from "zod";

export const GenerateCampaignStrategyInputSchema = z.object({
  campaign_goal: z.string().describe("Goal or theme of the campaign (e.g., 'Book demo calls with VP Operations in Logistics')"),
  target_industry: z.string().optional().describe("Primary industry target"),
  target_seniority: z.string().optional().describe("Target persona seniority level (e.g. VP, Director, C-Level)"),
  value_proposition: z.string().optional().describe("Core value proposition or offer"),
  tone: z.string().optional().describe("Desired communication style"),
});

export type GenerateCampaignStrategyInput = z.infer<typeof GenerateCampaignStrategyInputSchema>;

export const GenerateCampaignStrategyOutputSchema = z.object({
  campaign_name: z.string().describe("Catchy and professional campaign title"),
  description: z.string().describe("Strategic overview and targeting parameters of the campaign"),
  target_persona_summary: z.string().describe("Brief analysis of the target buyer mindset and key pain points"),
  recommended_audience_filters: z.object({
    suggested_industries: z.array(z.string()),
    suggested_seniorities: z.array(z.string()),
  }),
  sequence_steps: z.array(
    z.object({
      step_number: z.number(),
      day: z.number(),
      type: z.enum(["Introduction", "Follow-up", "Case Study", "Final Message", "Custom"]),
      subject: z.string(),
      body: z.string(),
      behavioral_hook: z.string().describe("Psychological principle used (e.g., Warmth/Competence, Autonomy preservation)"),
    })
  ),
  recommended_rules: z.object({
    stop_on_reply: z.boolean(),
    update_lead_status: z.boolean(),
    skip_weekends: z.boolean(),
  }),
  recommended_schedule: z.object({
    send_days: z.array(z.string()),
    send_time_from: z.string(),
    send_time_to: z.string(),
  }),
});

export type GenerateCampaignStrategyOutput = z.infer<typeof GenerateCampaignStrategyOutputSchema>;
