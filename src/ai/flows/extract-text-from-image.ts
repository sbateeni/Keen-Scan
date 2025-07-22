'use server';
/**
 * @fileOverview An AI agent that extracts text from an image or a PDF document.
 *
 * - extractTextFromImage - A function that handles the text extraction process.
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
  prompt: `{{#if isPdf}}
You are an expert OCR reader specializing in academic and scientific PDF documents. Your task is to extract all text from all pages of the provided multi-page document.

Pay close attention to the structure, including headings, bullet points, numbered lists, tables, and any scientific formulas or equations. Preserve the original formatting as much as possible.

Ignore any handwritten notes, colorful highlights, or other markings that are not part of the original printed text. The goal is to get a clean, accurate, and complete transcription of the study material from the entire document.

Extract the text from the following document.
{{else}}
You are an expert OCR reader specializing in academic and scientific documents. Your task is to extract all text from the provided image.

Pay close attention to the structure, including headings, bullet points, numbered lists, and any scientific formulas or equations. Preserve the original formatting as much as possible.

Ignore any handwritten notes, colorful highlights, or other markings that are not part of the original printed text. The goal is to get a clean, accurate transcription of the study material.

Extract the text from the following image.
{{/if}}

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
