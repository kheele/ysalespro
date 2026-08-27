import { z } from 'zod';

export const ExtractedActionItemSchema = z.object({
  title: z.string().describe('Concise task title.'),
  type: z.enum(['Call', 'Email', 'Meeting', 'Follow-up']).describe('Task category.'),
  priority: z.enum(['Urgent', 'High', 'Medium', 'Low']).describe('Task urgency.'),
  due_days_from_now: z.number().describe('Number of days from today this should be completed.'),
  notes: z.string().describe('Action context extracted from transcript.'),
});

export const ProcessCallTranscriptInputSchema = z.object({
  transcript_or_notes: z.string().describe('Raw audio transcription or call notes typed by the sales rep.'),
  prospect_name: z.string().describe('Name of the prospect.'),
  company_name: z.string().describe('Company name.'),
  rep_name: z.string().optional().describe('Sales representative name.'),
  call_type: z.string().optional().describe('Call type (Cold Call, Discovery, Demo, Check-in).'),
});
export type ProcessCallTranscriptInput = z.infer<typeof ProcessCallTranscriptInputSchema>;

export const ProcessCallTranscriptOutputSchema = z.object({
  call_summary: z.string().describe('Concise executive recap of the call.'),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'objection']).describe('Overall call sentiment.'),
  recommended_temperature: z.enum(['HOT', 'WARM', 'COLD']).describe('Recommended lead temperature update.'),
  recommended_stage: z.enum(['Contacted', 'Warm', 'Hot', 'Customer', 'Lost']).describe('Recommended pipeline stage update.'),
  key_discussion_points: z.array(z.string()).describe('Top points and requirements mentioned by the prospect.'),
  objections_raised: z.array(z.string()).describe('Any pushback or concerns raised.'),
  extracted_action_items: z.array(ExtractedActionItemSchema).describe('Action items extracted to create in tasks.'),
  draft_followup_email: z.string().describe('Personalized follow-up recap email draft ready to send to prospect.'),
});
export type ProcessCallTranscriptOutput = z.infer<typeof ProcessCallTranscriptOutputSchema>;
