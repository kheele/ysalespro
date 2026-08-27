'use server';

/**
 * @fileOverview Hyper-personalized B2B sales outreach generation and industry analysis using Genkit.
 * Infused with Vanessa Van Edwards' science-based people skills (Warmth & Competence, Charismatic Cues, High-Dopamine Openers, Autonomy Preservation).
 */
import { ai } from '@/ai/genkit';
import type { AIMessageRequest, AIMessageResponse } from '@/lib/types';
import {
  type GenerateSalesOutreachInput,
  type GenerateSalesOutreachOutput,
  type IndustryPainPointsInput,
  type IndustryPainPointsOutput,
  GenerateSalesOutreachInputSchema,
  GenerateSalesOutreachOutputSchema,
  IndustryPainPointsInputSchema,
  IndustryPainPointsOutputSchema,
} from '@/ai/schemas/sales-outreach';

function generateFallbackOutreach(input: GenerateSalesOutreachInput): GenerateSalesOutreachOutput {
  const personName = input.person.first_name || input.person.name || input.person.full_name || 'there';
  const personTitle = input.person.title || input.person.role || 'Executive Leader';
  const companyName = input.company.name || 'your organization';
  const industry = input.company.industry || 'Enterprise';
  const senderName = input.senderName || 'Sales Operations';
  const senderTitle = input.senderTitle || 'Enterprise Account Executive';
  const location = input.company.location || 'your region';
  const trigger = input.company.recent_news
    ? `noticed your recent milestone regarding "${input.company.recent_news}"`
    : `noticed ${companyName}'s impressive growth across ${location}`;

  return {
    generated_at: new Date().toISOString(),
    industry_matched: industry,
    person: input.person,
    company: input.company,
    messages: [
      {
        type: 'email_subject',
        label: 'Subject Line Options (Curiosity + High Warmth)',
        content: `1. Question regarding ${companyName}'s ${industry} initiatives, ${personName}?\n2. Quick idea for ${personName} on ${industry} team velocity\n3. ${companyName} + sales efficiency (curious on your take)`,
        score: 96,
        personalization_score: 95,
        rationale: 'Applies Vanessa Van Edwards\' "Curiosity Sparker" principle: under 7 words, personal name cue, and inviting perspective rather than a hard pitch.',
        key_hooks: [`${companyName} growth`, `${industry} vertical`, 'Curiosity sparker'],
        hooks_used: [`${companyName} growth`, `${industry} vertical`, 'Curiosity sparker'],
      },
      {
        type: 'initial_email',
        label: 'Initial Cold Email (Warmth + Competence)',
        subject: `Quick idea on ${companyName}'s ${industry} workflow velocity, ${personName}?`,
        content: `Hi ${personName},\n\nFirst, congratulations on leading key initiatives as ${personTitle} at ${companyName}—${trigger} is remarkable.\n\nIn our research with fellow ${industry} leaders, we frequently hear that even high-performing teams lose up to 30% of their prospecting velocity dealing with unverified telemetry and manual qualification.\n\nWe built YSalesPro to solve this exact bottleneck by automating real-time decision maker intelligence, helping peer teams accelerate qualified pipeline by over 35%.\n\nI would love to learn how your team is navigating this at ${companyName}. Would you be open to a brief 10-minute introductory conversation next Tuesday?\n\n(No pressure at all if the timing is not right—happy to share our 1-page ${industry} benchmark report if you prefer).\n\nWarmly,\n${senderName}\n${senderTitle}`,
        score: 97,
        personalization_score: 96,
        rationale: 'Balanced Warmth (sincere acknowledgment, psychological safety, "no pressure" autonomy cue) + Competence (specific 35% metric, industry authority).',
        key_hooks: [personTitle, industry, 'Autonomy cue (No pressure)', '35% metric'],
        hooks_used: [personTitle, industry, 'Autonomy cue (No pressure)', '35% metric'],
      },
      {
        type: 'followup_1',
        label: 'Value-Add Follow-up (The Giver Principle)',
        subject: `Re: Quick idea for ${companyName}`,
        content: `Hi ${personName},\n\nFollowing up with zero sales pitch—I wanted to gift you a quick insight from our latest ${industry} intelligence study.\n\nWe found that revenue teams who implement verified decision-maker triggers see an immediate 2.4x lift in executive reply rates.\n\nThought this might spark an idea for your team at ${companyName}. If you'd like the full 2-page brief, just reply "yes" and I'll send it right over.\n\nBest,\n${senderName}`,
        score: 94,
        personalization_score: 93,
        rationale: 'Applies the "Giver Principle"—offering genuine value and educational insight with zero strings attached and an effortless micro-ask ("reply yes").',
        key_hooks: ['Giver principle', '2.4x metric', 'Low-friction micro-ask'],
        hooks_used: ['Giver principle', '2.4x metric', 'Low-friction micro-ask'],
      },
      {
        type: 'followup_2',
        label: 'Case Study Pitch (Social Proof & Tribal Trust)',
        subject: `How peer ${industry} teams cut qualification time by 40%`,
        content: `Hi ${personName},\n\nKnowing how focused ${companyName} is on operational excellence, I thought of you when reviewing a recent case study with a high-growth ${industry} organization in ${location}.\n\nBy automating prospect enrichment, they cut sales cycle duration by 40% and saved each executive 8+ hours per week.\n\nGiven your focus as ${personTitle}, I would value your perspective on whether this aligns with what you're seeing.\n\nWould 10 minutes this Thursday work for a quick mutual exchange?\n\nBest,\n${senderName}`,
        score: 95,
        personalization_score: 94,
        rationale: 'Validates prospect status ("knowing how focused you are"), leverages peer tribal proof, and frames the meeting as a "mutual exchange" rather than a sales pitch.',
        key_hooks: ['Status validation', '40% cycle reduction', 'Mutual exchange'],
        hooks_used: ['Status validation', '40% cycle reduction', 'Mutual exchange'],
      },
      {
        type: 'final',
        label: 'Breakup Email (Autonomy & Graceful Exit)',
        subject: `Closing the loop for now (${companyName})`,
        content: `Hi ${personName},\n\nI realize you are likely immersed in high-priority initiatives right now at ${companyName}.\n\nI will pause my notes here so I don't crowd your inbox. If accelerating ${industry.toLowerCase()} pipeline ever becomes top-of-mind down the road, please know my door is always open.\n\nWishing you and the entire ${companyName} team continued momentum!\n\nWarmly,\n${senderName}`,
        score: 93,
        personalization_score: 92,
        rationale: 'Graceful exit that respects the prospect\'s autonomy, leaves high warmth, and triggers the Columbo effect/FOMO.',
        key_hooks: ['Autonomy preservation', 'Warm exit', 'Door left open'],
        hooks_used: ['Autonomy preservation', 'Warm exit', 'Door left open'],
      },
      {
        type: 'linkedin',
        label: 'LinkedIn Connection Note (Charismatic Written Cue)',
        content: `Hi ${personName}, really admire your leadership driving ${industry} initiatives as ${personTitle} at ${companyName}. Would love to connect and share notes on trends across ${location}!`,
        score: 96,
        personalization_score: 97,
        rationale: 'Under 250 characters, provides genuine status validation, and invites mutual peer connection.',
        key_hooks: [personTitle, companyName, 'Peer connection'],
        hooks_used: [personTitle, companyName, 'Peer connection'],
      },
      {
        type: 'call_script',
        label: 'Cold Call Script (Science of People Framework)',
        content: `[WARM VOCAL OPENING & PATTERN INTERRUPT]:
"Hi ${personName}, this is ${senderName} with YSalesPro. I know you weren't expecting my call—did I catch you in the middle of something urgent, or do you have 30 seconds for me to share why I reached out to you specifically?"

[VALIDATE & DISCOVERY SPARKER]:
"The reason for my call: we partner with ${industry} leaders like ${companyName} who tell us their teams lose hours every week on outdated prospect data. How is your team currently tackling data accuracy and sales velocity across ${location}?"

[LOW-PRESSURE VALUE PITCH & MICRO-ASK]:
"We automate that entire verification process, saving teams 30%+ in qualification time. I know you might be evaluating options—would you be open to a brief 10-minute look next Wednesday to see if this makes sense for your team?"`,
        score: 96,
        personalization_score: 95,
        rationale: 'Applies Vanessa Van Edwards\' vocal confidence cues, immediate permission/autonomy check, status validation, and low-pressure micro-ask.',
        key_hooks: ['Pattern interrupt', 'Permission check', 'Discovery sparker', 'Autonomy CTA'],
        hooks_used: ['Pattern interrupt', 'Permission check', 'Discovery sparker', 'Autonomy CTA'],
      },
    ],
  };
}

export const generateSalesOutreachFlow = ai.defineFlow(
  {
    name: 'generateSalesOutreachFlow',
    inputSchema: GenerateSalesOutreachInputSchema,
    outputSchema: GenerateSalesOutreachOutputSchema,
  },
  async (input) => {
    try {
      const prompt = `You are an elite B2B Sales Outreach Strategist and Copywriter trained in Vanessa Van Edwards' science-based people skills (author of 'Captivate' and 'Cues').

CRITICAL SCIENCE-BASED PEOPLE SKILLS GUIDELINES:
1. BALANCE WARMTH & COMPETENCE: High warmth (empathy, approachability, sincere acknowledgment, psychological safety) paired with high competence (concrete metrics, industry expertise, sharp clarity).
2. ANTI-BORING OPENERS & HIGH-DOPAMINE SPARKERS: Never use cliché robotic lines ("Hope this email finds you well" or "I'm reaching out because"). Use curiosity-sparking hooks.
3. PRESERVE AUTONOMY (The "But You Are Free" technique): Use low-pressure micro-asks ("Feel free to say no", "No pressure at all", "Would you be open to a brief 10-minute look?"). Giving autonomy increases compliance by over 40%.
4. STATUS VALIDATION: Acknowledge the prospect's role and domain leadership sincerely.
5. THE GIVER PRINCIPLE: In follow-ups, provide genuine unselfish value (data, benchmark insights) without demanding immediate action.
6. PATTERN INTERRUPT PHONE SCRIPTS: Start cold calls with warm vocal cues and ask permission ("Did I catch you in the middle of something urgent, or can I have 30 seconds?").

PROSPECT CONTEXT:
- Full Name: ${input.person.full_name || input.person.name || ''} (First: ${input.person.first_name || ''})
- Title: ${input.person.title || input.person.role || ''}
- Department: ${input.person.department || ''}
- Seniority: ${input.person.seniority || ''}

COMPANY CONTEXT:
- Company Name: ${input.company.name}
- Industry: ${input.company.industry}
- Size: ${input.company.size || ''}
- Location: ${input.company.location || ''}
- Recent News/Trigger: ${input.company.recent_news || ''}

SENDER CONTEXT:
- Sender Name: ${input.senderName || 'Sales Operations'}
- Sender Title: ${input.senderTitle || 'Account Executive'}

Generate exactly 7 messages (email_subject, initial_email, followup_1, followup_2, final, linkedin, call_script) strictly following these science-based people skills.`;

      const response = await ai.generate({
        prompt,
        output: { schema: GenerateSalesOutreachOutputSchema },
      });

      if (response.output) {
        return {
          ...response.output,
          generated_at: response.output.generated_at || new Date().toISOString(),
          industry_matched: response.output.industry_matched || input.company.industry,
          person: input.person,
          company: input.company,
        };
      }

      return generateFallbackOutreach(input);
    } catch (err) {
      console.warn('[Genkit] generateSalesOutreachFlow fallback:', err);
      return generateFallbackOutreach(input);
    }
  }
);

export const getIndustryPainPointsFlow = ai.defineFlow(
  {
    name: 'getIndustryPainPointsFlow',
    inputSchema: IndustryPainPointsInputSchema,
    outputSchema: IndustryPainPointsOutputSchema,
  },
  async (input) => {
    try {
      const prompt = `Return 3 concise, highly realistic operational and regulatory pain points for the industry: "${input.industry}" using Vanessa Van Edwards' human-centered psychology perspective.`;
      const response = await ai.generate({
        prompt,
        output: { schema: IndustryPainPointsOutputSchema },
      });

      if (response.output?.pain_points?.length) {
        return response.output;
      }
    } catch (err) {
      console.warn('[Genkit] getIndustryPainPointsFlow fallback:', err);
    }

    return {
      pain_points: [
        `Operational efficiency and qualification bottlenecks in ${input.industry}`,
        `Compliance, governance, and audit readiness across ${input.industry} workflows`,
        `Fragmented prospect data and sales cycle delays in ${input.industry}`,
      ],
    };
  }
);

export async function generateSingleMessageFlow(req: AIMessageRequest): Promise<AIMessageResponse> {
  const { company, person, message_type } = req;
  const industry = company.industry || 'Enterprise';
  const location = company.location || 'Global';
  const role = person.role || 'Executive';
  const name = person.name || 'Colleague';

  try {
    const prompt = `You are an elite B2B sales copywriter trained in Vanessa Van Edwards' science-based people skills (Warmth & Competence balance, Charismatic Cues, High-Dopamine Openers, Autonomy preservation).
Generate a high-converting, personalized ${message_type} for:
Prospect: ${name} (${role}, Department: ${person.department || 'Operations'}, Seniority: ${person.seniority || 'Executive'})
Company: ${company.name} (Industry: ${industry}, Employees: ${company.employee_count || 'N/A'}, Location: ${location})
${company.business_challenges?.length ? `Key challenges: ${company.business_challenges.join(', ')}` : ''}

Ensure high warmth + high competence, avoid robotic corporate jargon, use low-pressure conversational CTAs, and validate the prospect's expertise.`;

    const response = await ai.generate({
      prompt,
    });

    const text = response.text || '';
    return {
      message_type,
      subject: message_type.toLowerCase().includes('email') ? `Quick idea for ${company.name}'s ${industry} velocity, ${name}?` : undefined,
      content: text,
      key_hooks_used: [company.name, industry, role, 'Warmth & Competence'],
    };
  } catch (err) {
    console.warn('[Genkit] generateSingleMessageFlow fallback:', err);
    const hooks = [
      `${industry} workflow velocity`,
      `initiatives at ${company.name}`,
      `${role} leadership in ${location}`,
    ];

    let subject = `Quick question regarding ${company.name}'s ${industry.toLowerCase()} growth, ${name}?`;
    let content = `Hi ${name},\n\nReally admire your leadership driving ${person.department || 'operations'} as ${role} at ${company.name}.\n\nWe recently partnered with peer ${industry} teams in ${location} to eliminate manual qualification friction, helping them accelerate qualified pipeline by 35%.\n\nCurious how your team is navigating this this quarter? Would you be open to a brief 10-minute exploratory conversation next week? (No pressure at all if timing is tight).\n\nWarmly,\nYSalesPro Intelligence`;

    if (message_type === 'LinkedIn Message') {
      subject = '';
      content = `Hi ${name}, really impressed by your leadership as ${role} at ${company.name}. We work closely with ${industry} leaders on ${hooks[0]} and would love to connect and share insights!`;
    } else if (message_type === 'Follow-up') {
      subject = `Re: ${company.name}'s ${industry.toLowerCase()} growth`;
      content = `Hi ${name},\n\nFollowing up with a quick insight—fellow ${industry} organizations implementing automated verification saw a 2.4x lift in executive engagement.\n\nHappy to gift you the 1-page benchmark brief if helpful for ${company.name}. Just let me know!\n\nBest,\nYSalesPro Intelligence`;
    } else if (message_type === 'Call Script') {
      subject = '';
      content = `[SCIENCE OF PEOPLE COLD CALL SCRIPT FOR ${name.toUpperCase()} (${role.toUpperCase()} @ ${company.name.toUpperCase()})]\nWarm Opening: "Hi ${name}, this is Sales Intelligence with YSalesPro. I know you weren't expecting my call—do you have 30 seconds for me to share why I reached out to you specifically?"\nDiscovery Sparker: "How is your team currently tackling data qualification and pipeline velocity across ${location}?"\nValue & Autonomy: "We help ${industry} teams cut qualification time by 35%. Would you be open to a 10-minute look next week?"`;
    }

    return {
      message_type,
      subject: subject || undefined,
      content,
      key_hooks_used: hooks,
    };
  }
}
