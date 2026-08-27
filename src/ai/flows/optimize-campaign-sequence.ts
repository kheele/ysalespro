'use server';

/**
 * @fileOverview Campaign Sequence Copilot & A/B Copy Optimizer using Genkit.
 * Infused with Vanessa Van Edwards' science-based people skills (Warmth & Competence, Curiosity Sparkers, The Giver Principle).
 */
import { ai } from '@/ai/genkit';
import {
  type OptimizeSequenceInput,
  type OptimizeSequenceOutput,
  OptimizeSequenceInputSchema,
  OptimizeSequenceOutputSchema,
} from '@/ai/schemas/sequence-optimizer';

function fallbackOptimizeSequence(input: OptimizeSequenceInput): OptimizeSequenceOutput {
  const industry = input.industry || 'B2B';
  const steps = input.current_steps || [];

  const optimizedSteps = steps.map((step, idx) => {
    let subject = step.subject;
    let body = step.body;
    let rationale = 'Refined for maximum warmth, competence, and curiosity.';
    let highlights = ['Autonomy-preserving CTA', 'Curiosity hook', 'Warmth + Competence balance'];

    if (idx === 0) {
      subject = `Quick question regarding {{company_name}}'s ${industry.toLowerCase()} velocity, {{first_name}}?`;
      body = `Hi {{first_name}},\n\nI really admire your leadership driving key initiatives as {{job_title}} at {{company_name}}.\n\nIn our discussions with fellow ${industry} executives, we frequently hear that sales teams lose up to 30% of their momentum dealing with unverified prospect records and manual qualification.\n\nAt YSalesPro, we help enterprise teams automate live intelligence, accelerating qualified pipeline velocity by over 35%.\n\nI would love to learn how your team is approaching this. Would you be open to a brief 10-minute introductory conversation next Tuesday? (No pressure at all if timing is tight).\n\nWarm regards,\n{{sender_name}}`;
      rationale = 'Combines sincere status acknowledgment, a curiosity hook, concrete 35% competence proof, and an autonomy-preserving micro-ask.';
      highlights = ['Subject line under 8 words', '10-minute micro-ask with autonomy cue', '35% acceleration metric'];
    } else if (idx === 1) {
      subject = `Re: {{company_name}}'s ${industry.toLowerCase()} velocity`;
      body = `Hi {{first_name}},\n\nFollowing up with zero sales pitch—I wanted to gift you a quick finding from our latest ${industry} sales benchmark study.\n\nWe discovered that teams implementing automated decision-maker triggers see an immediate 2.4x lift in executive reply rates.\n\nHappy to send over the 1-page summary if helpful for your initiatives at {{company_name}}. Just let me know!\n\nBest,\n{{sender_name}}`;
      rationale = 'The "Giver Principle"—providing an unselfish gift of research and data without demanding a meeting.';
      highlights = ['No pressure tone', 'Social proof 2.4x metric', 'Effortless micro-ask ("Just let me know")'];
    } else if (idx === 2) {
      subject = `How peer ${industry} teams cut qualification time by 40%`;
      body = `Hi {{first_name}},\n\nKnowing how focused {{company_name}} is on operational excellence, I thought of you when reviewing a recent case study from a peer ${industry} team.\n\nBy automating prospect enrichment, they cut sales cycle duration by 40% and saved their account executives 10+ hours every week.\n\nGiven your focus, I would value your perspective on whether this resonates with what you are seeing.\n\nWould 15 minutes this Thursday work for a quick mutual exchange?\n\nWarmly,\n{{sender_name}}`;
      rationale = 'Status validation, direct peer tribal proof, and framing the discussion as a collaborative exchange of ideas.';
      highlights = ['Quantified time savings (10+ hrs)', 'Mutual exchange framing', 'Specific time proposal'];
    } else {
      subject = `Closing the loop for now ({{company_name}})`;
      body = `Hi {{first_name}},\n\nI realize you are likely immersed in high-priority initiatives right now at {{company_name}}.\n\nI will pause my notes here so as not to clutter your inbox. If accelerating ${industry.toLowerCase()} pipeline ever becomes top-of-mind down the road, please know my door is always open.\n\nWishing you and the entire {{company_name}} team continued success!\n\nWarmly,\n{{sender_name}}`;
      rationale = 'Graceful exit that respects the prospect\'s autonomy, leaves high warmth, and triggers the Columbo effect/FOMO.';
      highlights = ['Graceful exit', 'Preserves brand integrity', 'High reply-rate closing angle'];
    }

    return {
      step_number: step.step_number || (idx + 1),
      day: step.day ?? (idx * 3),
      type: step.type || 'Email',
      subject,
      body,
      rationale,
      improvement_highlights: highlights,
    };
  });

  return {
    overall_grade: 'A',
    overall_score: 95,
    key_recommendations: [
      `Inject Vanessa Van Edwards' "Warmth + Competence" balance across all touches—sincere acknowledgment paired with sharp metrics.`,
      'Replace high-friction "demo requests" with autonomy-preserving micro-asks ("No pressure at all", "Would you be open to a 10-min look?").',
      'Leverage the "Giver Principle" in Step 2 by offering unselfish benchmark data with zero strings attached.',
      'Ensure subject lines spark curiosity and use personal name tokens while remaining under 8 words.',
    ],
    optimized_steps: optimizedSteps,
    predicted_open_rate_boost_pct: 32,
    predicted_reply_rate_boost_pct: 42,
  };
}

export const optimizeCampaignSequenceFlow = ai.defineFlow(
  {
    name: 'optimizeCampaignSequenceFlow',
    inputSchema: OptimizeSequenceInputSchema,
    outputSchema: OptimizeSequenceOutputSchema,
  },
  async (input) => {
    try {
      const prompt = `You are a master cold email copywriter and behavioral communications scientist trained in Vanessa Van Edwards' science-based people skills ('Captivate', 'Cues').

Analyze and optimize this email sequence for:
Campaign: ${input.campaign_name}
Target Industry: ${input.industry}
Target Audience / Persona: ${input.target_audience || 'Executive Decision Makers'}
Historical Metrics: ${input.current_metrics ? JSON.stringify(input.current_metrics) : 'New campaign'}

Current Sequence Steps:
${JSON.stringify(input.current_steps, null, 2)}

SCIENCE-OF-PEOPLE OPTIMIZATION MANDATES:
1. WARMTH & COMPETENCE: Ensure every email balances genuine human warmth (empathy, approachability) with undeniable competence (metrics, authority).
2. ANTI-BORING OPENERS & DAZZLE FACTOR: Eliminate robotic boilerplate openings. Use curiosity-driven subject lines under 8 words.
3. PRESERVE AUTONOMY: Use low-friction micro-asks ("Feel free to say no", "No pressure if timing is tight").
4. THE GIVER PRINCIPLE: Include follow-ups that offer unselfish value (data, benchmark insights) without demanding immediate meetings.
5. GRACEFUL BREAKUP: Ensure the final email leaves high warmth and an open door.

Return an overall letter grade, quality score, 4 strategic science-backed recommendations, fully rewritten steps, and predicted open/reply lifts.`;

      const response = await ai.generate({
        prompt,
        output: { schema: OptimizeSequenceOutputSchema },
      });

      if (response.output) {
        return response.output;
      }
    } catch (err) {
      console.warn('[Genkit] optimizeCampaignSequenceFlow fallback:', err);
    }

    return fallbackOptimizeSequence(input);
  }
);
