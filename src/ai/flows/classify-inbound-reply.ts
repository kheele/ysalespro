'use server';

/**
 * @fileOverview Inbound reply sentiment & intent classification flow with automatic triage and suggested draft responses.
 * Infused with Vanessa Van Edwards' science-based people skills (Empathetic Mirroring, Autonomy Preservation, High-Warmth Responses).
 */
import { ai } from '@/ai/genkit';
import {
  type ClassifyInboundReplyInput,
  type ClassifyInboundReplyOutput,
  ClassifyInboundReplyInputSchema,
  ClassifyInboundReplyOutputSchema,
} from '@/ai/schemas/inbound-reply';

function fallbackClassification(input: ClassifyInboundReplyInput): ClassifyInboundReplyOutput {
  const text = input.inbound_message.toLowerCase();
  const name = input.prospect_name || 'there';
  const company = input.company_name || 'your company';

  if (text.includes('unsubscribe') || text.includes('remove') || text.includes('not interested') || text.includes('stop')) {
    return {
      intent: 'not_interested',
      sentiment: 'negative',
      sentiment_score: 15,
      confidence_score: 95,
      summary: 'Prospect requested to be removed from future outreach.',
      recommended_action: 'pause_sequence',
      draft_reply: `Hi ${name},\n\nUnderstood completely. I have paused all future correspondence and removed your email from our list.\n\nWishing you and ${company} continued success!\n\nWarmly,\nSales Operations`,
    };
  }

  if (text.includes('out of office') || text.includes('auto-reply') || text.includes('away from my desk') || text.includes('returning on')) {
    return {
      intent: 'out_of_office',
      sentiment: 'neutral',
      sentiment_score: 50,
      confidence_score: 98,
      summary: 'Automated Out of Office reply received.',
      return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommended_action: 'reschedule_task',
      draft_reply: '',
    };
  }

  if (text.includes('talk to') || text.includes('forward to') || text.includes('reach out to') || text.includes('refer')) {
    return {
      intent: 'referral',
      sentiment: 'positive',
      sentiment_score: 80,
      confidence_score: 90,
      summary: 'Prospect referred the outreach to an internal team colleague.',
      recommended_action: 'log_referral',
      draft_reply: `Hi ${name},\n\nThank you so much for pointing me in the right direction! I will reach out to them directly and mention you suggested connecting.\n\nReally appreciate your help!\n\nBest regards,\nSales Operations`,
    };
  }

  if (text.includes('interested') || text.includes('demo') || text.includes('call') || text.includes('schedule') || text.includes('time next week') || text.includes('sounds good')) {
    return {
      intent: 'interested',
      sentiment: 'positive',
      sentiment_score: 95,
      confidence_score: 96,
      summary: 'Prospect expressed positive interest and is open to a call or demo.',
      recommended_action: 'promote_to_hot',
      draft_reply: `Hi ${name},\n\nWonderful! I would love to connect. Would Tuesday at 10:00 AM or Thursday at 2:00 PM work for a brief 15-minute introductory conversation?\n\nIf easier, feel free to pick any slot that fits your schedule directly on my calendar: [Calendar Link]\n\nLooking forward to speaking!\n\nWarmly,\nSales Operations`,
    };
  }

  if (text.includes('competitor') || text.includes('already have') || text.includes('budget') || text.includes('timing') || text.includes('later')) {
    return {
      intent: 'objection',
      sentiment: 'neutral',
      sentiment_score: 45,
      confidence_score: 88,
      summary: 'Prospect raised an objection regarding existing vendor, timing, or budget.',
      recommended_action: 'draft_objection_counter',
      draft_reply: `Hi ${name},\n\nAppreciate your honesty! That makes complete sense regarding your current priorities.\n\nMany of our current partners previously had similar setups before seeing how our live telemetry accelerates pipeline velocity by 35%.\n\nNo pressure at all to change anything right now—would you be open to me sending over our 1-page peer benchmark study so you have it for future planning?\n\nBest,\nSales Operations`,
    };
  }

  return {
    intent: 'general_question',
    sentiment: 'neutral',
    sentiment_score: 65,
    confidence_score: 82,
    summary: 'Prospect sent an exploratory inquiry or question.',
    recommended_action: 'draft_booking_reply',
    draft_reply: `Hi ${name},\n\nThanks for reaching out! Happy to clarify: we specialize in live sales intelligence and automated verification to help revenue teams cut prospecting friction.\n\nI would be glad to share a quick 10-minute walkthrough tailored to ${company} whenever your schedule permits. Does sometime this week work?\n\nWarmly,\nSales Operations`,
  };
}

export const classifyInboundReplyFlow = ai.defineFlow(
  {
    name: 'classifyInboundReplyFlow',
    inputSchema: ClassifyInboundReplyInputSchema,
    outputSchema: ClassifyInboundReplyOutputSchema,
  },
  async (input) => {
    try {
      const prompt = `You are an expert sales operations AI triage assistant trained in Vanessa Van Edwards' science-based people skills (Captivate, Cues).

Analyze this inbound reply from a prospect:
Prospect Name: ${input.prospect_name || 'Unknown'}
Prospect Title: ${input.prospect_title || 'Unknown'}
Company: ${input.company_name || 'Unknown'}
Subject: ${input.subject || 'N/A'}
Original Context: ${input.original_outreach_context || 'Standard outbound campaign'}

Inbound Message:
"""
${input.inbound_message}
"""

SCIENCE-OF-PEOPLE TRIAGE GUIDELINES:
1. EMPATHETIC MIRRORING: In the draft reply, mirror 1-2 specific terms the prospect used to create psychological warmth and rapport.
2. PRESERVE AUTONOMY: Never sound desperate or pushy. Use low-friction options ("No pressure at all", "Feel free to pick any slot").
3. HIGH-WARMTH OBJECTION HANDLING: If an objection was raised, validate their reality first before offering an unselfish gift of insight.
4. GRACEFUL OPTS: If not interested, exit with dignity and warm wishes to preserve the brand relationship.

Classify intent, sentiment, confidence, summary, parse return date if OOO, parse referral contact, suggest recommended action, and write a high-warmth + high-competence draft reply.`;

      const response = await ai.generate({
        prompt,
        output: { schema: ClassifyInboundReplyOutputSchema },
      });

      if (response.output) {
        return response.output;
      }
    } catch (err) {
      console.warn('[Genkit] classifyInboundReplyFlow fallback:', err);
    }

    return fallbackClassification(input);
  }
);
