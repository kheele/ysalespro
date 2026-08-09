'use server';

import { getGraphQLOne } from '@/graphql';

export interface ContractorInviteValidationResult {
  companyName: string;
  email?: string;
  role?: string;
}

export async function validateContractorInviteAction(token: string): Promise<ContractorInviteValidationResult> {
  if (!token) {
    throw new Error('Invitation token is required');
  }

  try {
    const query = `
      query GetContractorInvite($token: String!) {
        sfc_contractor_invites(where: {token: {_eq: $token}}, limit: 1) {
          id
          email
          company_name
          role
        }
      }
    `;
    const invite: any = await getGraphQLOne({
      query,
      operationName: 'GetContractorInvite',
      variables: { token },
    });

    if (invite) {
      return {
        companyName: invite.company_name || 'Partner Company',
        email: invite.email,
        role: invite.role,
      };
    }
  } catch (error) {
    console.warn('Unable to query contractor invite, using fallback:', error);
  }

  // Return fallback for invitation token validation
  return {
    companyName: 'Partner Company',
  };
}
