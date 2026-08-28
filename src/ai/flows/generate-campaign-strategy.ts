import { ai } from "@/ai/genkit";
import {
  GenerateCampaignStrategyInputSchema,
  GenerateCampaignStrategyOutputSchema,
  type GenerateCampaignStrategyInput,
  type GenerateCampaignStrategyOutput,
} from "../schemas/campaign-generator";

export function getFallbackCampaignStrategy(input: GenerateCampaignStrategyInput): GenerateCampaignStrategyOutput {
  const ind = input.target_industry || "Enterprise Tech";
  const seniority = input.target_seniority || "VP / Director";

  return {
    campaign_name: `${ind} Modernization & Growth Initiative`,
    description: `Targeted multi-touch outbound cadence designed for ${seniority} decision-makers in ${ind}, focusing on solving operational bottlenecks and driving measurable ROI.`,
    target_persona_summary: `${seniority} leaders who value quantifiable business outcomes over product feature lists. They respond favorably to concise, autonomy-preserving outreach with zero high-pressure sales tactics.`,
    recommended_audience_filters: {
      suggested_industries: [ind],
      suggested_seniorities: ["VP", "Director", "C-Level"],
    },
    sequence_steps: [
      {
        step_number: 1,
        day: 1,
        type: "Email",
        subject: `Quick question regarding {{company_name}}'s ${ind} roadmap — {{fname}}`,
        body: `Hi {{fname}},\n\nNoticed {{company_name}}'s recent expansion in ${ind}. Leaders in your space often face pipeline visibility and data sync latency challenges.\n\nWe helped similar teams reduce workflow bottlenecks by 38% without disrupting existing tech stacks.\n\nNo pressure at all, but would you be open to a 10-minute benchmarking conversation next Tuesday?`,
        behavioral_hook: "Warmth + Competence balance with Autonomy Preservation ('No pressure at all')",
      },
      {
        step_number: 2,
        day: 3,
        type: "Follow-up",
        subject: `Thought on {{company_name}}'s speed-to-lead`,
        body: `Hi {{fname}},\n\nWanted to share a quick 1-page benchmark report on how leading ${ind} companies handle lead conversion cycles.\n\nNo need to reply if this isn't a priority right now, but figured it might be useful for your quarterly planning.\n\nBest,\nSalesPro Team`,
        behavioral_hook: "The Giver Principle (unselfish value asset gift with zero immediate friction)",
      },
      {
        step_number: 3,
        day: 7,
        type: "Case Study",
        subject: `How similar ${ind} peers scaled throughput by 42%`,
        body: `Hi {{fname}},\n\nWhen we partnered with a peer organization in ${ind}, their primary concern was integration overhead. Within 30 days, their team automated 85% of manual CRM logging while cutting cycle times.\n\nWould you like me to send over the 2-minute architectural breakdown?`,
        behavioral_hook: "Validation-first peer proof point with Low-Friction Yes/No Micro-Commitment",
      },
      {
        step_number: 4,
        day: 14,
        type: "Final Message",
        subject: `Closing the loop — {{fname}}`,
        body: `Hi {{fname}},\n\nAssuming you have all hands on deck with higher priorities right now, so I will respectfully step back and close this thread.\n\nIf you ever want to explore benchmarking data for {{company_name}} down the road, feel free to reach out anytime.\n\nWishing you and the team continued momentum!`,
        behavioral_hook: "Respectful Breakup with High Warmth and Zero Passive Aggressiveness",
      },
    ],
    recommended_rules: {
      stop_on_reply: true,
      update_lead_status: true,
      skip_weekends: true,
    },
    recommended_schedule: {
      send_days: ["Tue", "Wed", "Thu"],
      send_time_from: "08:30",
      send_time_to: "11:30",
    },
  };
}

export const generateCampaignStrategyFlow = ai.defineFlow(
  {
    name: "generateCampaignStrategyFlow",
    inputSchema: GenerateCampaignStrategyInputSchema,
    outputSchema: GenerateCampaignStrategyOutputSchema,
  },
  async (input): Promise<GenerateCampaignStrategyOutput> => {
    try {
      const prompt = `You are an Elite Sales Campaign Architect using Vanessa Van Edwards' Science-Based People Skills.

Generate a comprehensive, high-converting outbound campaign strategy for:
- Goal: ${input.campaign_goal}
- Target Industry: ${input.target_industry || "B2B Enterprise"}
- Target Seniority: ${input.target_seniority || "VP & Director"}
- Core Value Proposition: ${input.value_proposition || "Operational efficiency and revenue growth"}
- Tone: ${input.tone || "Empathetic, credible, concise"}

Create:
1. Campaign Name & Description
2. Target Persona Mindset Summary
3. 4-step sequence (Day 0 Intro, Day 3 Giver Asset Follow-up, Day 7 Peer Case Study, Day 14 Respectful Breakup)
   - Every email MUST use Vanessa Van Edwards' human behavior principles (Warmth + Competence, Autonomy preservation 'Feel free to say no', anti-boring openers).
4. Recommended automation rules and schedule.

Return strictly valid JSON conforming to the output schema.`;

      const response = await ai.generate({
        prompt,
        output: { schema: GenerateCampaignStrategyOutputSchema },
      });

      if (response.output) {
        return response.output;
      }
      return getFallbackCampaignStrategy(input);
    } catch (err) {
      console.warn("generateCampaignStrategyFlow falling back to deterministic template:", err);
      return getFallbackCampaignStrategy(input);
    }
  }
);
