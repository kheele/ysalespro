import { AIMessageRequest, AIMessageResponse, AIMessageType } from '@/lib/types';
import { INDUSTRY_HOOKS, SENIORITY_TONE } from '@/mock-data/aiTemplates';

export type { AIMessageRequest, AIMessageResponse, AIMessageType };

export async function generateMessage(req: AIMessageRequest): Promise<AIMessageResponse> {
  const { company, person, message_type } = req;

  let matchedIndustry = "Mining";
  if (company.industry.toLowerCase().includes("construction")) matchedIndustry = "Construction";
  if (company.industry.toLowerCase().includes("manufacturing")) matchedIndustry = "Manufacturing";
  if (company.industry.toLowerCase().includes("engineering")) matchedIndustry = "Engineering";

  const hooks = INDUSTRY_HOOKS[matchedIndustry] || INDUSTRY_HOOKS["Mining"];
  const tone = SENIORITY_TONE[person.seniority] || SENIORITY_TONE["Manager"];

  let subject = "";
  let content = "";

  switch (message_type) {
    case "Email Subject":
      subject = `Quick question regarding ${company.name}'s ${hooks[0]}`;
      content = subject;
      break;

    case "Initial Outreach":
      subject = `Improving ${matchedIndustry.toLowerCase()} operations & compliance at ${company.name}`;
      content = `Hi ${person.name},

Companies in the ${matchedIndustry.toLowerCase()} sector often struggle with ${hooks[0]}, ${hooks[1]}, and audit readiness.

Given your role as ${person.role} at ${company.name}, our platform helps operations and safety teams centrally manage these risk areas, reducing compliance overhead by up to 35%.

Would you be open to a brief 10-minute introductory call next Tuesday morning?

Best regards,
YSalesProo AI Intelligence`;
      break;

    case "Follow-up":
      subject = `Re: ${matchedIndustry.toLowerCase()} operational compliance at ${company.name}`;
      content = `Hi ${person.name},

Following up on my previous message regarding ${hooks[0]} at ${company.name}. 

We recently helped a peer company in ${company.location || "your region"} streamline their ${hooks[1]} and eliminate manual spreadsheets.

Would Thursday afternoon work for a quick demo?`;
      break;

    case "Case Study Pitch":
      subject = `Case Study: How a Tier-1 ${matchedIndustry} operator reduced compliance friction`;
      content = `Hi ${person.name},

Thought you might find this relevant to your work as ${person.role} at ${company.name}.

Attached is our latest case study detailing how a ${company.employee_count}-employee ${matchedIndustry.toLowerCase()} enterprise solved ${hooks[2]} within 30 days of deployment.

Let me know if you'd like me to send over the benchmark data.`;
      break;

    case "LinkedIn Message":
      content = `Hello ${person.name}, noticed your leadership in ${matchedIndustry.toLowerCase()} operations at ${company.name}. Would love to connect and share insights on automating ${hooks[0]}.`;
      break;

    case "Call Script":
      content = `[CALL SCRIPT FOR ${person.name.toUpperCase()} - ${person.role.toUpperCase()}]
Tone: ${tone}

Opening:
"Hello ${person.name}, this is Alex from YSalesPro. I noticed ${company.name} operates heavily in ${matchedIndustry.toLowerCase()}. We help ${person.department} leaders centralize ${hooks[0]}."

Discovery Question:
"Are your operations teams currently managing ${hooks[1]} manually, or do you have a centralized compliance dashboard in place?"

Value Proposition:
"We provide a unified enterprise platform designed specifically to streamline ${hooks[2]} and deliver 100% audit readiness."`;
      break;

    default:
      content = `Hello ${person.name}, checking in regarding ${company.name}'s compliance workflow.`;
  }

  return {
    message_type,
    subject: subject || undefined,
    content,
    key_hooks_used: hooks,
  };
}

export function getIndustryPainPoints(industry: string): string[] {
  let matchedIndustry = "Mining";
  if (industry.toLowerCase().includes("construction")) matchedIndustry = "Construction";
  if (industry.toLowerCase().includes("manufacturing")) matchedIndustry = "Manufacturing";
  if (industry.toLowerCase().includes("engineering")) matchedIndustry = "Engineering";

  return INDUSTRY_HOOKS[matchedIndustry] || INDUSTRY_HOOKS["Mining"];
}

export const aiMessageServices = {
  generateMessage,
  getIndustryPainPoints,
};
