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
  prompt: `You are an expert OCR reader specializing in academic and scientific documents. Your task is to extract all text from the provided document.

Pay meticulous attention to the structure and formatting. It is critical to preserve the original layout as closely as possible.

**VERY IMPORTANT Instructions for Tables:**
- If you detect a table, you MUST preserve its structure.
- Use Markdown-style tables or a similar plain text format that maintains rows and columns.
- Ensure that the text within each cell remains aligned in its respective column to make it easily copy-pastable.
- Do not flatten the table into a single block of text. This is a critical requirement.

**General Formatting:**
- Preserve headings, bullet points, numbered lists, and indentation.
- Accurately transcribe any scientific formulas, equations, and special characters.
- Ignore handwritten notes, highlights, or other markings not part of the original printed text.

The goal is to get a clean, accurate, and complete transcription of the study material, with special emphasis on correctly structured tables.

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
