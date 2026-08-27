import { z } from "zod";

export const PrioritizeTasksInputSchema = z.object({
  rep_name: z.string().optional().describe("Name of the sales rep"),
  available_hours: z.number().optional().describe("Number of hours available for sales outreach today"),
  tasks: z.array(
    z.object({
      id: z.string().or(z.number()),
      title: z.string(),
      type: z.string(),
      priority: z.string(),
      due_date: z.string().optional(),
      due_time: z.string().optional(),
      related_lead_name: z.string().optional(),
      related_company: z.string().optional(),
      notes: z.string().optional(),
      status: z.string().optional(),
    })
  ),
});

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

export const PrioritizeTasksOutputSchema = z.object({
  daily_summary: z.string().describe("High-level executive briefing for the rep's daily sales workflow"),
  revenue_opportunity_score: z.number().min(0).max(100).describe("Composite revenue potential score of today's pipeline"),
  urgent_attention_count: z.number().describe("Count of tasks requiring immediate action today"),
  time_blocked_schedule: z.array(
    z.object({
      time_block: z.string().describe("e.g. 09:00 AM - 10:30 AM (Peak Connection Window)"),
      focus_category: z.string().describe("e.g. High-Warmth Phone Calls & Discovery"),
      task_ids: z.array(z.string().or(z.number())),
      guidance: z.string().describe("Science-based psychological advice for this block"),
    })
  ),
  top_focus_tasks: z.array(
    z.object({
      task_id: z.string().or(z.number()),
      title: z.string(),
      lead_or_company: z.string(),
      urgency_reason: z.string(),
      recommended_angle: z.string().describe("Vanessa Van Edwards conversation angle"),
    })
  ),
  psychological_mindset_tip: z.string().describe("Daily charismatic presence & vocal confidence booster"),
});

export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;
