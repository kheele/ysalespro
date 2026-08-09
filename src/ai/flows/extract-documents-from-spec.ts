
'use server';
/**
 * @fileOverview A flow to extract a list of required documents from a specification text.
 *
 * - extractDocumentsFromSpec - A function that suggests documents based on specification text.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestDocumentsInputSchema,
  SuggestDocumentsOutputSchema,
  type SuggestDocumentsOutput,
} from '@/ai/schemas/document-suggestion';
import { z } from 'zod';


export const ExtractDocumentsFromSpecInputSchema = z.object({
  specificationText: z.string().describe('The full text content of the specification document.'),
});
export type ExtractDocumentsFromSpecInput = z.infer<typeof ExtractDocumentsFromSpecInputSchema>;


export async function extractDocumentsFromSpec(input: ExtractDocumentsFromSpecInput): Promise<SuggestDocumentsOutput> {
  return extractDocumentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDocumentsFromSpecPrompt',
  model: 'googleai/gemini-1.0-pro',
  input: { schema: ExtractDocumentsFromSpecInputSchema },
  output: { schema: SuggestDocumentsOutputSchema },
  prompt: `You are an expert in occupational health and safety compliance.
Your task is to analyze the provided specification document text and extract a list of all required safety documents mentioned or implied.

For each document you identify, provide:
1.  A concise title.
2.  A one-sentence description of its purpose based on the specification.
3.  A "category" for the document from the available options.
4.  An array of 2-3 relevant "tags" (keywords) for the document.

Analyze the following specification text:
---
{{{specificationText}}}
---`,
});

const extractDocumentsFlow = ai.defineFlow(
  {
    name: 'extractDocumentsFlow',
    inputSchema: ExtractDocumentsFromSpecInputSchema,
    outputSchema: SuggestDocumentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

