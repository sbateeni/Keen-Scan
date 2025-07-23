'use server';
/**
 * @fileOverview An AI agent that extracts text from a document (image or PDF).
 *
 * - extractTextFromDocument - A function that handles the text extraction process.
 * - ExtractTextFromDocumentInput - The input type for the extractTextFromDocument function.
 * - ExtractTextFromDocumentOutput - The return type for the extractTextFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo or document to extract text from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  isPdf: z
    .boolean()
    .describe('A flag to indicate if the document is a PDF.'),
});
export type ExtractTextFromDocumentInput = z.infer<
  typeof ExtractTextFromDocumentInputSchema
>;

const ExtractTextFromDocumentOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text from the image or document, if any.'),
});
export type ExtractTextFromDocumentOutput = z.infer<
  typeof ExtractTextFromDocumentOutputSchema
>;

export async function extractTextFromDocument(
  input: ExtractTextFromDocumentInput
): Promise<ExtractTextFromDocumentOutput> {
  return extractTextFromDocumentFlow(input);
}

const extractTextFromDocumentPrompt = ai.definePrompt({
  name: 'extractTextFromDocumentPrompt',
  input: {schema: ExtractTextFromDocumentInputSchema},
  output: {schema: ExtractTextFromDocumentOutputSchema},
  prompt: `You are an expert OCR reader specializing in academic and scientific documents. Your primary and most critical task is to extract every single word from the provided document with the highest possible accuracy.

**VERY IMPORTANT Instructions:**
- The absolute priority is to capture all text content accurately. Do not omit any text.
- Preserve the original structure and layout as best as you can, including headings, bullet points, numbered lists, and indentation.
- If you detect a table, extract its content while maintaining the logical grouping of information. The exact visual formatting is secondary to capturing all the text within the table correctly.
- Accurately transcribe any scientific formulas, equations, and special characters.
- Ignore handwritten notes, highlights, or other markings not part of the original printed text.

The final output must be a clean, complete, and highly accurate transcription of the study material.

{{#if isPdf}}
The user has provided a multi-page PDF document. Ensure you process every page to extract all content.
{{else}}
The user has provided an image. Extract all visible text from it.
{{/if}}

Extract the text from the following document:
Document: {{media url=documentDataUri}}`,
});

const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
  },
  async input => {
    const {output} = await extractTextFromDocumentPrompt(input);
    return output!;
  }
);
