/**
 * @fileOverview Defines the Zod schemas and TypeScript types for sales outreach AI generation flows.
 */
import { z } from 'zod';

export const MessageTypeSchema = z.enum([
  'email_subject',
  'initial_email',
  'followup_1',
  'followup_2',
  'final',
  'linkedin',
  'call_script',
]);

export const GeneratedMessageSchema = z.object({
  type: MessageTypeSchema.describe('The format/channel type for the sales message.'),
  label: z.string().describe('User-friendly label for the message step.'),
  subject: z.string().optional().describe('Email subject line if applicable.'),
  content: z.string().describe('The generated message copy or structured script.'),
  score: z.number().describe('Overall quality score (0-100).'),
  personalization_score: z.number().describe('Personalization relevancy score (0-100).'),
  rationale: z.string().describe('Strategic rationale for why this copy converts.'),
  key_hooks: z.array(z.string()).describe('Key contextual hooks and pain points utilized.'),
  hooks_used: z.array(z.string()).describe('Key contextual hooks and pain points utilized.'),
});

export const GenerateSalesOutreachInputSchema = z.object({
  person: z.object({
    name: z.string().optional(),
    fname: z.string().optional(),
    lname: z.string().optional(),
    full_name: z.string().optional(),
    role: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    seniority: z.string().optional(),
  }).describe('Context about the target prospect.'),
  company: z.object({
    name: z.string().describe('Company name.'),
    industry: z.string().describe('Industry vertical.'),
    employee_count: z.number().optional(),
    size: z.string().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    recent_news: z.string().optional(),
    challenges: z.array(z.string()).optional(),
    business_challenges: z.array(z.string()).optional(),
  }).describe('Context about the prospect company.'),
  senderName: z.string().optional().describe('Sender full name.'),
  senderTitle: z.string().optional().describe('Sender job title.'),
});
export type GenerateSalesOutreachInput = z.infer<typeof GenerateSalesOutreachInputSchema>;

export const GenerateSalesOutreachOutputSchema = z.object({
  generated_at: z.string().describe('ISO timestamp of generation.'),
  industry_matched: z.string().describe('The industry sector analyzed.'),
  person: z.any().describe('The prospect context.'),
  company: z.any().describe('The company context.'),
  messages: z.array(GeneratedMessageSchema).describe('The sequence of generated outreach messages.'),
});
export type GenerateSalesOutreachOutput = z.infer<typeof GenerateSalesOutreachOutputSchema>;

export const IndustryPainPointsInputSchema = z.object({
  industry: z.string().describe('The industry sector to analyze.'),
});
export type IndustryPainPointsInput = z.infer<typeof IndustryPainPointsInputSchema>;

export const IndustryPainPointsOutputSchema = z.object({
  pain_points: z.array(z.string()).describe('Array of 3 specific operational/regulatory pain points.'),
});
export type IndustryPainPointsOutput = z.infer<typeof IndustryPainPointsOutputSchema>;
