
'use server';
/**
 * @fileOverview A flow to suggest required safety documents based on a project sector.
 *
 * - suggestDocuments - A function that suggests documents for a given sector.
 */

import { ai } from '@/ai/genkit';
import { 
  SuggestDocumentsInputSchema, 
  SuggestDocumentsOutputSchema,
  type SuggestDocumentsInput,
  type SuggestDocumentsOutput,
} from '@/ai/schemas/document-suggestion';

export async function suggestDocuments(input: SuggestDocumentsInput): Promise<SuggestDocumentsOutput> {
  return suggestDocumentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDocumentsPrompt',
  model: 'googleai/gemini-1.0-pro',
  input: { schema: SuggestDocumentsInputSchema },
  output: { schema: SuggestDocumentsOutputSchema },
  prompt: `You are an expert in occupational health and safety compliance across various industries.
Given a project sector, risk level, and a list of available template documents, your task is to identify which documents are most essential for compliance.

Sector: {{sector}}
Risk Level: {{riskLevel}}

{{#if templateItems}}
Available documents in template:
{{#each templateItems}}
- {{this}}
{{/each}}

Based on the sector and risk level, return exactly which of the provided template documents are essential by returning their exact titles in the "recommendedTitles" array. Do not generate new documents.
{{else}}
Provide a list of documents in the "documents" array. For each document, provide:
1.  A concise title.
2.  A one-sentence description of its purpose.
3.  A "category" for the document from the available options.
4.  An array of 2-3 relevant "tags" (keywords) for the document.
{{/if}}

Focus on the most common and critical documents. Focus on the South African OHS context.`,
});

const suggestDocumentsFlow = ai.defineFlow(
  {
    name: 'suggestDocumentsFlow',
    inputSchema: SuggestDocumentsInputSchema,
    outputSchema: SuggestDocumentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

