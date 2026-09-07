import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  injectTrackingToEmailHtml,
  recordEmailOpen,
  recordEmailClick,
  processInboundReplyAndEscalate,
} from '../private/trackingService';

// Mock Hasura GraphQL client
vi.mock('@/graphql', () => ({
  sendGraphQL: vi.fn(),
  updateGraphQL: vi.fn(),
  insertGraphQL: vi.fn(),
  listGraphQL: vi.fn(),
}));

// Mock Genkit AI inbound classification flow
vi.mock('@/ai/flows/classify-inbound-reply', () => ({
  classifyInboundReplyFlow: vi.fn(),
}));

import { sendGraphQL } from '@/graphql';
import { classifyInboundReplyFlow } from '@/ai/flows/classify-inbound-reply';

describe('Tracking & Inbound AI Reply Escalation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('injectTrackingToEmailHtml', () => {
    it('rewrites external links through /api/track/click and appends 1x1 tracking pixel', () => {
      const sampleHtml = `
        <html>
          <body>
            <p>Hi Alex,</p>
            <p>Check out our demo <a href="https://salespro.com/demo">here</a> or read our <a href="https://salespro.com/pricing">pricing</a>.</p>
          </body>
        </html>
      `;

      const result = injectTrackingToEmailHtml(sampleHtml, {
        outreachId: 101,
        leadId: 202,
        campaignId: 303,
        baseUrl: 'https://app.salespro.com',
      });

      // 1. Check click tracking rewrites
      expect(result).toContain('https://app.salespro.com/api/track/click?');
      expect(result).toContain('url=https%3A%2F%2Fsalespro.com%2Fdemo');
      expect(result).toContain('outreach_id=101');
      expect(result).toContain('lead_id=202');
      expect(result).toContain('campaign_id=303');

      // 2. Check 1x1 pixel injection
      expect(result).toContain('https://app.salespro.com/api/track/open?');
      expect(result).toContain('<img src="https://app.salespro.com/api/track/open?outreach_id=101&lead_id=202&campaign_id=303"');
      expect(result).toContain('width="1" height="1"');
    });

    it('does not double-wrap existing tracking links', () => {
      const alreadyTrackedHtml = `
        <a href="https://app.salespro.com/api/track/click?url=https%3A%2F%2Fgoogle.com">Link</a>
      `;

      const result = injectTrackingToEmailHtml(alreadyTrackedHtml, {
        outreachId: 101,
        baseUrl: 'https://app.salespro.com',
      });

      const count = (result.match(/\/api\/track\/click\?/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('recordEmailOpen', () => {
    it('marks outreach activity as Opened and increments lead score', async () => {
      (sendGraphQL as any).mockImplementation((args: any) => {
        if (args.operationName === 'GetOutreachById') {
          return Promise.resolve({
            data: {
              aa_s_outreach_activities_by_pk: { id: 101, status: 'Sent', lead_id: 202 },
            },
          });
        }
        if (args.operationName === 'GetLeadById') {
          return Promise.resolve({
            data: {
              aa_s_leads_by_pk: { id: 202, lead_score: 10, lead_temperature: 'COLD' },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      const res = await recordEmailOpen({ outreachId: 101, leadId: 202 });
      expect(res.success).toBe(true);

      // Verify Hasura was called to update status
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'MarkOutreachOpened' })
      );
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'UpdateLeadOnOpen' })
      );
    });
  });

  describe('recordEmailClick (Dual Fallback)', () => {
    it('marks outreach as Clicked and bumps lead score', async () => {
      (sendGraphQL as any).mockImplementation((args: any) => {
        if (args.operationName === 'GetLeadById') {
          return Promise.resolve({
            data: {
              aa_s_leads_by_pk: { id: 202, lead_score: 15, lead_temperature: 'COLD' },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      const res = await recordEmailClick({
        targetUrl: 'https://company.com/book',
        outreachId: 101,
        leadId: 202,
      });

      expect(res.success).toBe(true);
      expect(res.target_url).toBe('https://company.com/book');

      // Verify Hasura marked clicked & bumped lead score
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'MarkOutreachClicked' })
      );
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'UpdateLeadOnClick' })
      );
    });
  });

  describe('processInboundReplyAndEscalate', () => {
    it('escalates to HOT when AI detects an interested reply', async () => {
      // 1. Mock lead and outreach lookup
      (sendGraphQL as any).mockImplementation((args: any) => {
        if (args.operationName === 'FindRecentOutreach') {
          return Promise.resolve({
            data: {
              aa_s_outreach_activities: [{ id: 101, lead_id: 202, account_company_id: 1 }],
            },
          });
        }
        if (args.operationName === 'GetLeadForTriage') {
          return Promise.resolve({
            data: {
              aa_s_leads_by_pk: {
                id: 202,
                account_company_id: 1,
                person_name: 'Sarah Connor',
                company_name: 'Cyberdyne',
                lead_temperature: 'COLD',
                lead_score: 10,
                assigned_user_id: 5,
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      // 2. Mock AI flow returning positive intent
      (classifyInboundReplyFlow as any).mockResolvedValueOnce({
        intent: 'interested',
        sentiment: 'positive',
        sentiment_score: 95,
        confidence_score: 98,
        summary: 'Prospect wants a demo on Thursday at 2pm',
        recommended_action: 'promote_to_hot',
        draft_reply: 'Hi Sarah, great to connect! Thursday at 2pm is locked in.',
      });

      const res = await processInboundReplyAndEscalate({
        fromEmail: 'sarah@cyberdyne.com',
        subject: 'Re: Quick question',
        body: "Sounds interesting! Let's do a demo Thursday at 2pm.",
      });

      expect(res.success).toBe(true);
      expect(res.escalation_action).toBe('escalated_to_hot');
      expect(res.classification?.intent).toBe('interested');

      // 3. Verify lead was promoted to HOT
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'EscalateLeadToHot' })
      );

      // 4. Verify urgent task was created for sales rep with pre-drafted reply
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'CreateHotReplyTask' })
      );

      // 5. Verify in-app notification was created
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'CreateHotReplyNotification' })
      );
    });

    it('handles out of office by rescheduling next follow-up', async () => {
      (sendGraphQL as any).mockImplementation((args: any) => {
        if (args.operationName === 'GetLeadForTriage') {
          return Promise.resolve({
            data: {
              aa_s_leads_by_pk: {
                id: 202,
                account_company_id: 1,
                person_name: 'Sarah Connor',
                company_name: 'Cyberdyne',
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      (classifyInboundReplyFlow as any).mockResolvedValueOnce({
        intent: 'out_of_office',
        sentiment: 'neutral',
        sentiment_score: 50,
        confidence_score: 95,
        summary: 'Away on vacation until Sept 15',
        return_date: '2026-09-15',
        recommended_action: 'reschedule_task',
        draft_reply: '',
      });

      const res = await processInboundReplyAndEscalate({
        fromEmail: 'sarah@cyberdyne.com',
        leadId: 202,
        body: 'I am away on vacation until Sept 15.',
      });

      expect(res.success).toBe(true);
      expect(res.escalation_action).toBe('rescheduled_for_return_date');
      expect(sendGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ operationName: 'RescheduleOooLead' })
      );
    });
  });
});
