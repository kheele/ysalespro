import { z } from 'zod';

export const OptimizedStepSchema = z.object({
  step_number: z.number().describe('Step index in sequence (1, 2, 3, etc.).'),
  day: z.number().describe('Day interval from sequence start.'),
  type: z.string().describe('Step type (Introduction, Follow-up, Case Study, Final Message).'),
  subject: z.string().describe('Optimized subject line.'),
  body: z.string().describe('Optimized email body copy with tokens.'),
  rationale: z.string().describe('Strategic reason for copy modifications.'),
  improvement_highlights: z.array(z.string()).describe('Specific improvements made (e.g. Lower friction CTA, shorter hook).'),
});

export const OptimizeSequenceInputSchema = z.object({
  campaign_name: z.string().describe('Name of the sales campaign.'),
  industry: z.string().describe('Target industry vertical.'),
  target_audience: z.string().optional().describe('Persona description (e.g. VP of Sales in Fintech).'),
  current_steps: z.array(
    z.object({
      step_number: z.number(),
      day: z.number(),
      type: z.string(),
      subject: z.string(),
      body: z.string(),
    })
  ).describe('The current list of email sequence steps.'),
  current_metrics: z.object({
    open_rate: z.number().optional(),
    reply_rate: z.number().optional(),
    bounce_rate: z.number().optional(),
  }).optional().describe('Historical performance metrics if available.'),
});
export type OptimizeSequenceInput = z.infer<typeof OptimizeSequenceInputSchema>;

export const OptimizeSequenceOutputSchema = z.object({
  overall_grade: z.string().describe('Letter grade evaluation of the original sequence (e.g. A, B+, C).'),
  overall_score: z.number().min(0).max(100).describe('Sequence quality score out of 100.'),
  key_recommendations: z.array(z.string()).describe('Top 3-4 strategic recommendations for this audience.'),
  optimized_steps: z.array(OptimizedStepSchema).describe('Full updated sequence steps with polished copy.'),
  predicted_open_rate_boost_pct: z.number().describe('Estimated percentage increase in open rate.'),
  predicted_reply_rate_boost_pct: z.number().describe('Estimated percentage increase in reply rate.'),
});
export type OptimizeSequenceOutput = z.infer<typeof OptimizeSequenceOutputSchema>;
