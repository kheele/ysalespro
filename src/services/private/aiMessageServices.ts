'use server';

import {
  generateSalesOutreachFlow,
  getIndustryPainPointsFlow,
  generateSingleMessageFlow,
  classifyInboundReplyFlow,
  generatePreCallBriefFlow,
  optimizeCampaignSequenceFlow,
  processCallTranscriptFlow,
  predictOptimalTimingFlow,
  scoreAndQualifyLeadFlow,
  generateCampaignStrategyFlow,
  prioritizeTasksFlow,
} from '@/ai/flows';
import type {
  AIMessageRequest,
  AIMessageResponse,
  MessageType,
  PersonContext,
  CompanyContext,
  GeneratedMessage,
  MessageGenerationResult,
} from '@/lib/types';
import type { ClassifyInboundReplyInput, ClassifyInboundReplyOutput } from '@/ai/schemas/inbound-reply';
import type { GeneratePreCallBriefInput, GeneratePreCallBriefOutput } from '@/ai/schemas/precall-brief';
import type { OptimizeSequenceInput, OptimizeSequenceOutput } from '@/ai/schemas/sequence-optimizer';
import type { ProcessCallTranscriptInput, ProcessCallTranscriptOutput } from '@/ai/schemas/call-transcript';
import type { PredictOptimalTimingInput, PredictOptimalTimingOutput } from '@/ai/schemas/optimal-timing';
import type { ScoreAndQualifyLeadInput, ScoreAndQualifyLeadOutput } from '@/ai/schemas/lead-qualification';
import type { GenerateCampaignStrategyInput, GenerateCampaignStrategyOutput } from '@/ai/schemas/campaign-generator';
import type { PrioritizeTasksInput, PrioritizeTasksOutput } from '@/ai/schemas/task-prioritizer';

export async function getIndustryPainPoints(industry: string): Promise<string[]> {
  const res = await getIndustryPainPointsFlow({ industry });
  return res?.pain_points || [];
}

export async function generateMessages(
  person: PersonContext,
  company: CompanyContext,
  senderName: string = "Sales Executive",
  senderTitle: string = "Sales Representative"
): Promise<MessageGenerationResult> {
  const result = await generateSalesOutreachFlow({
    person,
    company,
    senderName,
    senderTitle,
  });

  const messages: GeneratedMessage[] = (result.messages || []).map((m: any) => ({
    type: m.type as MessageType,
    label: m.label,
    subject: m.subject,
    content: m.content,
    personalization_score: m.personalization_score || m.score || 90,
    hooks_used: m.hooks_used || m.key_hooks || [],
  }));

  const avg_score = messages.length > 0
    ? Math.round(messages.reduce((acc, m) => acc + m.personalization_score, 0) / messages.length)
    : 0;

  return {
    person,
    company,
    messages,
    avg_score,
  };
}

export async function generateMessage(req: AIMessageRequest): Promise<AIMessageResponse> {
  return generateSingleMessageFlow(req);
}

/**
 * Classify an inbound prospect reply for sentiment, intent, and auto-generate a draft reply.
 */
export async function classifyInboundReplyAction(input: ClassifyInboundReplyInput): Promise<ClassifyInboundReplyOutput> {
  return classifyInboundReplyFlow(input);
}

/**
 * Generate a comprehensive pre-call intelligence brief and talking points for sales reps.
 */
export async function generatePreCallBriefAction(input: GeneratePreCallBriefInput): Promise<GeneratePreCallBriefOutput> {
  return generatePreCallBriefFlow(input);
}

/**
 * Analyze and optimize a multi-step email campaign sequence for maximum opens and replies.
 */
export async function optimizeCampaignSequenceAction(input: OptimizeSequenceInput): Promise<OptimizeSequenceOutput> {
  return optimizeCampaignSequenceFlow(input);
}

/**
 * Process a phone call transcript or meeting notes, extract CRM action items, and draft follow-up email.
 */
export async function processCallTranscriptAction(input: ProcessCallTranscriptInput): Promise<ProcessCallTranscriptOutput> {
  return processCallTranscriptFlow(input);
}

/**
 * Predict optimal send times and calling windows based on industry and buyer seniority.
 */
export async function predictOptimalTimingAction(input: PredictOptimalTimingInput): Promise<PredictOptimalTimingOutput> {
  return predictOptimalTimingFlow(input);
}

/**
 * Dynamically score, classify temperature, and evaluate buying readiness for a lead.
 */
export async function scoreAndQualifyLeadAction(input: ScoreAndQualifyLeadInput): Promise<ScoreAndQualifyLeadOutput> {
  return scoreAndQualifyLeadFlow(input);
}

/**
 * Automatically generate an entire multi-touch campaign strategy, description, and sequence.
 */
export async function generateCampaignStrategyAction(input: GenerateCampaignStrategyInput): Promise<GenerateCampaignStrategyOutput> {
  return generateCampaignStrategyFlow(input);
}

/**
 * Prioritize daily sales tasks and create a time-blocked execution schedule.
 */
export async function prioritizeTasksAction(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

