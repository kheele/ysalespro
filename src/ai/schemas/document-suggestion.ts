/**
 * @fileOverview Defines the Zod schemas and TypeScript types for the document suggestion AI flow.
 *
 * - SuggestDocumentsInputSchema, SuggestDocumentsInput
 * - DocumentSuggestionSchema
 * - SuggestDocumentsOutputSchema, SuggestDocumentsOutput
 */
import { z } from 'zod';

export const SuggestDocumentsInputSchema = z.object({
  sector: z.string().describe('The industry sector for the project (e.g., Construction, Mining).'),
  riskLevel: z.string().optional().describe('The risk level of the project (Low, Medium, High).'),
  templateItems: z.array(z.string()).optional().describe('A list of available document titles in the sector template to choose from.'),
});
export type SuggestDocumentsInput = z.infer<typeof SuggestDocumentsInputSchema>;

export const DocumentSuggestionSchema = z.object({
  title: z.string().describe('The official title of the suggested document.'),
  description: z.string().describe('A brief, one-sentence description of the document\'s purpose.'),
  category: z.string().describe('A relevant category for the document (e.g., "Risk Assessment", "Permit", "Safety Manual").'),
  tags: z.array(z.string()).describe('An array of 2-3 relevant keywords for the document.'),
});

export const SuggestDocumentsOutputSchema = z.object({
  recommendedTitles: z.array(z.string()).describe('A list of document titles recommended by AI from the given template.'),
  documents: z.array(DocumentSuggestionSchema).optional().describe('A list of new suggested safety documents if template was not provided.'),
});
export type SuggestDocumentsOutput = z.infer<typeof SuggestDocumentsOutputSchema>;
