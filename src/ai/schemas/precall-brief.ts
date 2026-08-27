import { z } from 'zod';

export const KeyTalkingPointSchema = z.object({
  topic: z.string().describe('The subject or focus area (e.g. Pipeline Visibility, Audit Readiness).'),
  talking_point: z.string().describe('Specific conversational pitch or insight for the rep to say.'),
  proof_point: z.string().describe('Quantitative benchmark, case study, or metric evidence.'),
});

export const LikelyObjectionSchema = z.object({
  objection: z.string().describe('The expected pushback or objection from this persona.'),
  rebuttal: z.string().describe('The recommended conversational counter and redirection.'),
  confidence: z.number().min(0).max(100).describe('Likelihood percentage of encountering this objection.'),
});

export const GeneratePreCallBriefInputSchema = z.object({
  prospect: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    seniority: z.string().optional(),
    linkedin_url: z.string().optional(),
    email: z.string().optional(),
  }).describe('Prospect details.'),
  company: z.object({
    name: z.string().describe('Company name.'),
    industry: z.string().describe('Industry sector.'),
    employee_count: z.number().optional(),
    revenue: z.string().optional(),
    location: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).describe('Company details and tech stack.'),
  recent_signals: z.array(z.string()).optional().describe('Recent growth signals, news, or intent telemetry.'),
  call_goal: z.string().optional().describe('Objective of the call (e.g. Discovery, Demo Booking, Proposal Review).'),
});
export type GeneratePreCallBriefInput = z.infer<typeof GeneratePreCallBriefInputSchema>;

export const GeneratePreCallBriefOutputSchema = z.object({
  executive_summary: z.string().describe('30-second situational brief on the company and persona.'),
  company_overview_bullets: z.array(z.string()).describe('3 fast facts about the company business model, scale, and focus.'),
  key_talking_points: z.array(KeyTalkingPointSchema).describe('3 core talking points tailored to their pain points.'),
  likely_objections: z.array(LikelyObjectionSchema).describe('Top 2-3 anticipated objections with prepared battlecard rebuttals.'),
  high_impact_questions: z.array(z.string()).describe('4 open-ended discovery questions to uncover budget and authority.'),
  recommended_tone: z.string().describe('Recommended conversational style (e.g. Strategic & Direct, Consultative).'),
  optimal_duration_minutes: z.number().describe('Target call duration in minutes.'),
});
export type GeneratePreCallBriefOutput = z.infer<typeof GeneratePreCallBriefOutputSchema>;
