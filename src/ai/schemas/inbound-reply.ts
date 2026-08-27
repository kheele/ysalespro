import { z } from 'zod';

export const ReplyIntentEnum = z.enum([
  'interested',
  'objection',
  'not_interested',
  'out_of_office',
  'referral',
  'general_question',
]);
export type ReplyIntent = z.infer<typeof ReplyIntentEnum>;

export const SentimentEnum = z.enum(['positive', 'neutral', 'negative']);
export type Sentiment = z.infer<typeof SentimentEnum>;

export const RecommendedActionEnum = z.enum([
  'promote_to_hot',
  'draft_booking_reply',
  'draft_objection_counter',
  'reschedule_task',
  'pause_sequence',
  'log_referral',
]);
export type RecommendedAction = z.infer<typeof RecommendedActionEnum>;

export const ClassifyInboundReplyInputSchema = z.object({
  inbound_message: z.string().describe('The raw inbound message or email body received from the prospect.'),
  subject: z.string().optional().describe('The email subject line.'),
  prospect_name: z.string().optional().describe('Name of the prospect who sent the reply.'),
  prospect_title: z.string().optional().describe('Job title of the prospect.'),
  company_name: z.string().optional().describe('Prospect company name.'),
  original_outreach_context: z.string().optional().describe('Original campaign context or email thread history.'),
});
export type ClassifyInboundReplyInput = z.infer<typeof ClassifyInboundReplyInputSchema>;

export const ClassifyInboundReplyOutputSchema = z.object({
  intent: ReplyIntentEnum.describe('Classified intent category of the prospect response.'),
  sentiment: SentimentEnum.describe('Overall sentiment detected.'),
  sentiment_score: z.number().min(0).max(100).describe('Sentiment score from 0 (very negative) to 100 (extremely positive).'),
  confidence_score: z.number().min(0).max(100).describe('AI confidence score for classification.'),
  summary: z.string().describe('1-2 sentence executive summary of the reply.'),
  return_date: z.string().optional().describe('Parsed return date if the prospect is Out of Office (ISO or YYYY-MM-DD format).'),
  referral_name: z.string().optional().describe('Name of the colleague referred to, if applicable.'),
  referral_email: z.string().optional().describe('Email of the colleague referred to, if applicable.'),
  recommended_action: RecommendedActionEnum.describe('Automated CRM workflow action to take.'),
  draft_reply: z.string().describe('Ready-to-send AI drafted response tailored to the prospect message.'),
});
export type ClassifyInboundReplyOutput = z.infer<typeof ClassifyInboundReplyOutputSchema>;
