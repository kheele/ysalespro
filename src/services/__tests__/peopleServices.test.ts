import { describe, it, expect, vi } from 'vitest';
import * as peopleServices from '../public/peopleServices';

vi.mock('@/graphql', () => ({
  sendGraphQL: vi.fn(),
  getGraphQLOne: vi.fn(),
  listGraphQL: vi.fn(),
}));

import { sendGraphQL, getGraphQLOne, listGraphQL } from '@/graphql';

describe('peopleServices', () => {
  it('should fetch decision makers and format them properly', async () => {
    const mockPeople = [
      {
        id: '1',
        name: 'Jane Doe',
        job_title: 'Chief Technology Officer',
        email: 'jane@acme.com',
        seniority: 'C-Suite',
        department: 'Engineering',
        company_name: 'Acme Corp',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        score: 95,
      },
    ];

    (listGraphQL as any).mockResolvedValueOnce({
      aa_s_people: mockPeople,
      aa_s_people_aggregate: { aggregate: { count: 1 } },
    });

    const result = await peopleServices.getDecisionMakersAction({ search: 'Jane' });
    expect(result).toBeDefined();
    expect(result.people.length).toBeGreaterThan(0);
    expect(result.people[0].name).toBe('Jane Doe');
    expect(result.people[0].location).toBe('San Francisco, CA, USA');
  });

  it('should fetch single decision maker by ID', async () => {
    const mockPerson = {
      id: '1',
      name: 'John Smith',
      job_title: 'VP of Sales',
      email: 'john@sales.com',
      seniority: 'VP',
      department: 'Sales',
      company_name: 'Sales Inc',
      score: 88,
    };

    (getGraphQLOne as any).mockResolvedValueOnce(mockPerson);

    const result = await peopleServices.getDecisionMakerByIdAction(1);
    expect(result).toBeDefined();
    expect(result?.name).toBe('John Smith');
    expect(result?.title).toBe('VP of Sales');
  });
});
