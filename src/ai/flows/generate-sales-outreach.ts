'use server';

/**
 * @fileOverview Hyper-personalized B2B sales outreach generation and industry analysis using Google Gemini API.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIMessageRequest, AIMessageResponse } from '@/lib/types';
import type {
  GenerateSalesOutreachInput,
  GenerateSalesOutreachOutput,
  IndustryPainPointsInput,
  IndustryPainPointsOutput,
} from '@/ai/schemas/sales-outreach';

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function generateFallbackOutreach(input: GenerateSalesOutreachInput): GenerateSalesOutreachOutput {
  const personName = input.person.first_name || input.person.name || input.person.full_name || 'there';
  const personTitle = input.person.title || input.person.role || 'Executive';
  const companyName = input.company.name || 'your organization';
  const industry = input.company.industry || 'Enterprise';
  const senderName = input.senderName || 'Sales Operations';
  const senderTitle = input.senderTitle || 'Enterprise Account Executive';
  const location = input.company.location || 'your region';
  const trigger = input.company.recent_news
    ? `following your recent news regarding "${input.company.recent_news}"`
    : `as ${companyName} continues expanding in ${location}`;

  return {
    generated_at: new Date().toISOString(),
    industry_matched: industry,
    person: input.person,
    company: input.company,
    messages: [
      {
        type: 'email_subject',
        label: 'Subject Line Options',
        content: `1. Question regarding ${companyName}'s pipeline velocity in ${industry}\n2. Idea for ${personName} regarding ${industry} operational compliance\n3. ${companyName} + YSalesPro: 15-min executive sync`,
        score: 95,
        personalization_score: 94,
        rationale: 'High curiosity, low friction subject lines tailored directly to executive decision makers.',
        key_hooks: [`${companyName} growth`, `${industry} vertical`, 'Pipeline velocity'],
        hooks_used: [`${companyName} growth`, `${industry} vertical`, 'Pipeline velocity'],
      },
      {
        type: 'initial_email',
        label: 'Initial Cold Email',
        subject: `Quick thought for ${companyName} on ${industry} pipeline efficiency`,
        content: `Hi ${personName},\n\nI noticed your role driving key initiatives as ${personTitle} at ${companyName}, especially ${trigger}.\n\nMany ${industry} leaders we partner with often find that fragmented outreach telemetry and manual prospect qualification slow down deal cycles by over 30%.\n\nAt YSalesPro, we help enterprise teams automate lead enrichment, accelerate executive outreach, and ensure full audit readiness across channels.\n\nWould you be open to a brief 10-minute chat next Tuesday to see how peer organizations in ${industry} are accelerating their sales velocity?\n\nBest regards,\n${senderName}\n${senderTitle}`,
        score: 96,
        personalization_score: 95,
        rationale: 'Punchy opening citing executive title and company triggers, highlighting tangible industry pain points.',
        key_hooks: [personTitle, industry, trigger],
        hooks_used: [personTitle, industry, trigger],
      },
      {
        type: 'followup_1',
        label: 'Value-Add Follow-up',
        subject: `Re: Quick thought for ${companyName}`,
        content: `Hi ${personName},\n\nFollowing up on my note from last week. I wanted to share a quick benchmark report we recently compiled on top operational metrics for ${industry} organizations.\n\nOne interesting finding: companies that integrate real-time decision maker telemetry see an average 2.4x increase in positive response rates from executive prospects.\n\nHappy to share the brief breakdown if helpful for your team at ${companyName}.\n\nBest,\n${senderName}`,
        score: 92,
        personalization_score: 93,
        rationale: 'Delivers educational industry benchmark data instead of just asking for a meeting.',
        key_hooks: ['Industry benchmark', '2.4x response rate', `${industry} data`],
        hooks_used: ['Industry benchmark', '2.4x response rate', `${industry} data`],
      },
      {
        type: 'followup_2',
        label: 'Case Study Pitch',
        subject: `How peer ${industry} teams increased deal velocity by 40%`,
        content: `Hi ${personName},\n\nThought you might find this relevant—we recently helped a high-growth ${industry} organization address qualification bottlenecks, resulting in a 40% reduction in sales cycle duration within 60 days.\n\nGiven ${companyName}'s current focus in ${location}, I believe we could achieve similar impact for your revenue pipeline.\n\nDo you have 15 minutes this Thursday afternoon for a quick introduction?\n\nBest,\n${senderName}`,
        score: 94,
        personalization_score: 92,
        rationale: 'Leverages social proof and quantifiable outcomes from direct sector peers.',
        key_hooks: ['40% deal velocity', 'Case study impact', `${companyName} expansion`],
        hooks_used: ['40% deal velocity', 'Case study impact', `${companyName} expansion`],
      },
      {
        type: 'final',
        label: 'Breakup Email',
        subject: `Closing the loop for now (${companyName})`,
        content: `Hi ${personName},\n\nI understand you are likely focused on high-priority initiatives right now at ${companyName}.\n\nI will pause outreach for now so as not to clutter your inbox. If pipeline velocity or automated compliance ever becomes a priority down the road, please feel free to reach out anytime.\n\nWishing you and the ${companyName} team continued success!\n\nWarmly,\n${senderName}`,
        score: 90,
        personalization_score: 91,
        rationale: 'Respectful, professional closure that leaves the door open and often prompts last-minute replies.',
        key_hooks: ['Respectful closure', 'Future priority alignment'],
        hooks_used: ['Respectful closure', 'Future priority alignment'],
      },
      {
        type: 'linkedin',
        label: 'LinkedIn Connection Note',
        content: `Hi ${personName}, noticed your impressive leadership as ${personTitle} at ${companyName}. Would love to connect and share insights on what we're seeing across the ${industry} space in ${location}!`,
        score: 95,
        personalization_score: 96,
        rationale: 'Concise connection request well under LinkedIn 300-character limit.',
        key_hooks: [personTitle, companyName, industry],
        hooks_used: [personTitle, companyName, industry],
      },
      {
        type: 'call_script',
        label: 'Cold Call Script',
        content: `[OPENING HOOK]: "Hi ${personName}, this is ${senderName} with YSalesPro. I know I caught you out of the blue—do you have 30 seconds for me to tell you why I called, and you can let me know if it makes sense to continue?"\n\n[DISCOVERY QUESTION]: "We work with several ${industry} executives who tell us their teams spend up to 40% of their time verifying decision-maker data instead of speaking with buyers. How is ${companyName} currently tackling pipeline enrichment?"\n\n[VALUE PITCH & CLOSE]: "We help teams automate that entirely so your reps focus purely on qualified conversations. Could we set up 10 minutes next Wednesday to walk through a live demo tailored for ${companyName}?"`,
        score: 93,
        personalization_score: 94,
        rationale: 'Structured cold call script with pattern interrupt, contextual pain point, and clear micro-ask.',
        key_hooks: ['Pattern interrupt', `${industry} benchmark`, '10-min live demo'],
        hooks_used: ['Pattern interrupt', `${industry} benchmark`, '10-min live demo'],
      },
    ],
  };
}

export async function generateSalesOutreachFlow(input: GenerateSalesOutreachInput): Promise<GenerateSalesOutreachOutput> {
  const genAI = getGeminiClient();
  if (!genAI) {
    return generateFallbackOutreach(input);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an elite B2B Sales Outreach Strategist and Copywriter.
Generate a complete, hyper-personalized sales outreach sequence in JSON format.

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

Format your response as a valid JSON object matching this structure:
{
  "industry_matched": "${input.company.industry}",
  "messages": [
    {
      "type": "email_subject",
      "label": "Subject Line Options",
      "content": "...",
      "personalization_score": 94,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "initial_email",
      "label": "Initial Cold Email",
      "subject": "...",
      "content": "...",
      "personalization_score": 95,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "followup_1",
      "label": "Value-Add Follow-up",
      "subject": "...",
      "content": "...",
      "personalization_score": 93,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "followup_2",
      "label": "Case Study Pitch",
      "subject": "...",
      "content": "...",
      "personalization_score": 92,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "final",
      "label": "Breakup Email",
      "subject": "...",
      "content": "...",
      "personalization_score": 91,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "linkedin",
      "label": "LinkedIn Connection Note",
      "content": "...",
      "personalization_score": 96,
      "rationale": "...",
      "hooks_used": ["..."]
    },
    {
      "type": "call_script",
      "label": "Cold Call Script",
      "content": "...",
      "personalization_score": 94,
      "rationale": "...",
      "hooks_used": ["..."]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
      return {
        generated_at: new Date().toISOString(),
        industry_matched: parsed.industry_matched || input.company.industry,
        person: input.person,
        company: input.company,
        messages: parsed.messages,
      };
    }
  } catch (err) {
    console.warn('[Gemini] generateSalesOutreachFlow fallback:', err);
  }

  return generateFallbackOutreach(input);
}

export async function getIndustryPainPointsFlow(input: IndustryPainPointsInput): Promise<IndustryPainPointsOutput> {
  const genAI = getGeminiClient();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Return a JSON object with exactly 3 concise, highly realistic operational pain points for the industry: "${input.industry}". Format: {"pain_points": ["...", "...", "..."]}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.pain_points) && parsed.pain_points.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('[Gemini] getIndustryPainPointsFlow fallback:', err);
    }
  }

  return {
    pain_points: [
      `Operational efficiency and qualification bottlenecks in ${input.industry}`,
      `Compliance, governance, and audit readiness across ${input.industry} workflows`,
      `Fragmented decision-maker telemetry and sales cycle delays in ${input.industry}`,
    ],
  };
}

export async function generateSingleMessageFlow(req: AIMessageRequest): Promise<AIMessageResponse> {
  const { company, person, message_type } = req;
  const industry = company.industry || 'Enterprise';
  const location = company.location || 'Global';
  const role = person.role || 'Executive';
  const name = person.name || 'Colleague';

  const genAI = getGeminiClient();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an elite B2B sales copywriter and strategist.
Generate a high-converting, personalized ${message_type} for:
Prospect: ${name} (${role}, Department: ${person.department || 'Operations'}, Seniority: ${person.seniority || 'Executive'})
Company: ${company.name} (Industry: ${industry}, Employees: ${company.employee_count || 'N/A'}, Location: ${location})
${company.business_challenges?.length ? `Key challenges: ${company.business_challenges.join(', ')}` : ''}

Provide a compelling response.`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      return {
        message_type,
        subject: message_type.toLowerCase().includes('email') ? `Regarding ${company.name}'s ${industry} initiatives` : undefined,
        content: text,
        key_hooks_used: [company.name, industry, role],
      };
    } catch (err) {
      console.warn('[Gemini] generateSingleMessageFlow fallback:', err);
    }
  }

  const hooks = [
    `${industry} workflow optimization`,
    `operations at ${company.name}`,
    `${role} leadership in ${location}`,
  ];

  let subject = `Quick question regarding ${company.name}'s ${industry.toLowerCase()} operations`;
  let content = `Hi ${name},\n\nGiven your role leading ${person.department || 'initiatives'} as ${role} at ${company.name}, I wanted to reach out regarding ${hooks[0]}.\n\nOur platform helps ${industry} teams in ${location} streamline data qualification and reduce manual overhead by 35%.\n\nWould you be open to a brief 10-minute introductory call next week?\n\nBest regards,\nYSalesPro Intelligence`;

  if (message_type === 'LinkedIn Message') {
    subject = '';
    content = `Hi ${name}, noticed your leadership as ${role} at ${company.name}. We work with ${industry} teams on ${hooks[0]} and would love to connect!`;
  } else if (message_type === 'Follow-up') {
    subject = `Re: ${company.name}'s ${industry.toLowerCase()} operations`;
    content = `Hi ${name},\n\nFollowing up on my note regarding ${hooks[0]} at ${company.name}. Peer organizations in ${location} have seen substantial gains in team productivity.\n\nWould Thursday work for a brief call?\n\nBest,\nYSalesPro Intelligence`;
  } else if (message_type === 'Call Script') {
    subject = '';
    content = `[COLD CALL SCRIPT FOR ${name.toUpperCase()} (${role.toUpperCase()} @ ${company.name.toUpperCase()})]\nOpening: "Hi ${name}, reaching out because of your leadership at ${company.name} in ${industry}."\nDiscovery: "How are your teams currently handling ${hooks[0]} across ${location}?"\nValue: "We help ${industry} enterprises streamline operations with 100% audit readiness."`;
  }

  return {
    message_type,
    subject: subject || undefined,
    content,
    key_hooks_used: hooks,
  };
}
