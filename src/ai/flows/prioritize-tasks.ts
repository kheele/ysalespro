import { ai } from "@/ai/genkit";
import {
  PrioritizeTasksInputSchema,
  PrioritizeTasksOutputSchema,
  type PrioritizeTasksInput,
  type PrioritizeTasksOutput,
} from "../schemas/task-prioritizer";

export function getFallbackPrioritizeTasks(input: PrioritizeTasksInput): PrioritizeTasksOutput {
  const urgentTasks = input.tasks.filter((t) => /Urgent|High/i.test(t.priority || "") || /Call|Meeting/i.test(t.type || ""));
  const taskIds = input.tasks.map((t) => t.id);

  return {
    daily_summary: `Today's pipeline has ${input.tasks.length} total actions with ${urgentTasks.length} high-leverage conversations. Focus your morning energy on high-connection phone calls and scheduled meetings while cognitive alertness is at peak.`,
    revenue_opportunity_score: Math.min(94, Math.max(70, 72 + urgentTasks.length * 4)),
    urgent_attention_count: urgentTasks.length,
    time_blocked_schedule: [
      {
        time_block: "09:00 AM - 10:30 AM (Peak Connection Window)",
        focus_category: "High-Warmth Discovery Calls & Executive Touchpoints",
        task_ids: taskIds.slice(0, 3),
        guidance: "Use downward vocal inflections and begin with high-warmth curiosity sparkers rather than defensive pitches.",
      },
      {
        time_block: "11:00 AM - 12:30 PM (Mid-Day Momentum)",
        focus_category: "Meeting Prep & Pre-Call Intelligence Review",
        task_ids: taskIds.slice(3, 5),
        guidance: "Review target account pain points and prepare 1 validation-first objection rebuttal before dialing.",
      },
      {
        time_block: "02:00 PM - 03:30 PM (Afternoon Outbound Flow)",
        focus_category: "Email Follow-ups & LinkedIn Reciprocity Messages",
        task_ids: taskIds.slice(5),
        guidance: "Keep follow-up emails under 75 words and include an unselfish value asset (The Giver Principle).",
      },
    ],
    top_focus_tasks: input.tasks.slice(0, 4).map((t) => ({
      task_id: t.id,
      title: t.title,
      lead_or_company: t.related_company || t.related_lead_name || "Target Account",
      urgency_reason: "High buying intent window; timely follow-up increases meeting set rates by 3.2x.",
      recommended_angle: "Validate their operational timeline upfront; emphasize mutual discovery with zero pressure.",
    })),
    psychological_mindset_tip: "Adopt a 'Giver & Consultant' mindset. You are not asking for their time; you are offering them an objective benchmark to solve a real friction point.",
  };
}

export const prioritizeTasksFlow = ai.defineFlow(
  {
    name: "prioritizeTasksFlow",
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async (input): Promise<PrioritizeTasksOutput> => {
    try {
      const prompt = `You are an Elite Sales Productivity Coach and Behavioral Strategist using Vanessa Van Edwards' Science of People frameworks.

Analyze the following list of pending sales tasks and organize them into an optimal high-impact Daily Action Plan:
Tasks List (${input.tasks.length} tasks):
${JSON.stringify(input.tasks, null, 2)}

Provide:
1. Daily Executive Summary briefing.
2. Revenue Opportunity Score (0-100) and count of urgent attention items.
3. Time-Blocked Schedule (Morning high-connection blocks, mid-day momentum, afternoon outreach).
4. Top Focus Tasks with specific behavioral conversation angles.
5. Daily Psychological Mindset Tip for charismatic presence and vocal confidence.

Return strictly valid JSON conforming to the output schema.`;

      const response = await ai.generate({
        prompt,
        output: { schema: PrioritizeTasksOutputSchema },
      });

      if (response.output) {
        return response.output;
      }
      return getFallbackPrioritizeTasks(input);
    } catch (err) {
      console.warn("prioritizeTasksFlow falling back to deterministic plan:", err);
      return getFallbackPrioritizeTasks(input);
    }
  }
);
