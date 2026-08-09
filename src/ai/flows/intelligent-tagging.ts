'use server';

/**
 * @fileOverview Implements the intelligent document tagging flow.
 *
 * - intelligentTagging - A function that automatically tags uploaded documents with relevant keywords.
 * - IntelligentTaggingInput - The input type for the intelligentTagging function.
 * - IntelligentTaggingOutput - The return type for the intelligentTagging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentTaggingInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the document to be tagged.'),
});
export type IntelligentTaggingInput = z.infer<typeof IntelligentTaggingInputSchema>;

const IntelligentTaggingOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of relevant keywords for the document.'),
});
export type IntelligentTaggingOutput = z.infer<typeof IntelligentTaggingOutputSchema>;

export async function intelligentTagging(input: IntelligentTaggingInput): Promise<IntelligentTaggingOutput> {
  return intelligentTaggingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentTaggingPrompt',
  input: {schema: IntelligentTaggingInputSchema},
  output: {schema: IntelligentTaggingOutputSchema},
  prompt: `You are an AI assistant specializing in document tagging.
  Your task is to analyze the content of a given document and extract relevant keywords that can be used for categorization and retrieval.
  Provide the keywords as an array of strings.

  Document Content: {{{documentText}}}

  Keywords:`, // Removed handlebars helper
});

const intelligentTaggingFlow = ai.defineFlow(
  {
    name: 'intelligentTaggingFlow',
    inputSchema: IntelligentTaggingInputSchema,
    outputSchema: IntelligentTaggingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
