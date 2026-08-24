'use server';

import {
  generateSalesOutreachFlow,
  getIndustryPainPointsFlow,
  generateSingleMessageFlow,
} from '@/ai/flows/generate-sales-outreach';
import type {
  AIMessageRequest,
  AIMessageResponse,
  MessageType,
  PersonContext,
  CompanyContext,
  GeneratedMessage,
  MessageGenerationResult,
} from '@/lib/types';

export async function getIndustryPainPoints(industry: string): Promise<string[]> {
  const res = await getIndustryPainPointsFlow({ industry });
  return res?.pain_points || [];
}

export async function generateMessages(
  person: PersonContext,
  company: CompanyContext,
  senderName: string = "Alex Rivers",
  senderTitle: string = "Sales Director, YSalesPro"
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
