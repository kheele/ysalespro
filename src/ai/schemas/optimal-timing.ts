import { z } from 'zod';

export const SendTimeWindowSchema = z.object({
  day_of_week: z.string().describe('Day of the week (e.g. Tuesday, Thursday).'),
  time_range: z.string().describe('Recommended time window (e.g. 09:30 - 10:30).'),
  timezone: z.string().describe('Recipient timezone.'),
  expected_open_rate_multiplier: z.number().describe('Relative performance multiplier vs average (e.g. 1.35 = 35% higher).'),
  rationale: z.string().describe('Behavioral rationale for this window.'),
});

export const CallingWindowSchema = z.object({
  day_of_week: z.string().describe('Day of the week.'),
  time_range: z.string().describe('Recommended calling time window.'),
  timezone: z.string().describe('Recipient timezone.'),
  expected_connection_rate_multiplier: z.number().describe('Relative connection rate multiplier vs average.'),
  rationale: z.string().describe('Behavioral rationale for this calling window.'),
});

export const PredictOptimalTimingInputSchema = z.object({
  industry: z.string().describe('Industry sector.'),
  seniority: z.enum(['C-Level', 'VP', 'Director', 'Manager', 'Staff']).describe('Executive level of the prospect.'),
  timezone: z.string().optional().describe('Recipient local timezone (defaults to UTC+2 / SAST).'),
  channels: z.array(z.string()).optional().describe('Channels to optimize (Email, Phone, LinkedIn).'),
});
export type PredictOptimalTimingInput = z.infer<typeof PredictOptimalTimingInputSchema>;

export const PredictOptimalTimingOutputSchema = z.object({
  primary_channel: z.string().describe('Highest-converting outreach channel for this persona.'),
  secondary_channel: z.string().describe('Best secondary follow-up channel.'),
  top_send_windows: z.array(SendTimeWindowSchema).describe('Top 3 email send windows.'),
  top_calling_windows: z.array(CallingWindowSchema).describe('Top 2 phone calling windows.'),
  persona_behavioral_insights: z.array(z.string()).describe('3 key workday habit observations for this role and industry.'),
});
export type PredictOptimalTimingOutput = z.infer<typeof PredictOptimalTimingOutputSchema>;
