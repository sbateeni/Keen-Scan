'use server';
/**
 * @fileOverview An AI agent that extracts text from an image.
 *
 * - extractTextFromImage - A function that handles the text extraction process.
 * - ExtractTextFromImageInput - The input type for the extractTextFromImage function.
 * - ExtractTextFromImageOutput - The return type for the extractTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo or document to extract text from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<
  typeof ExtractTextFromImageInputSchema
>;

const ExtractTextFromImageOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text from the image or document, if any.'),
});
export type ExtractTextFromImageOutput = z.infer<
  typeof ExtractTextFromImageOutputSchema
>;

export async function extractTextFromImage(
  input: ExtractTextFromImageInput
): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const extractTextFromImagePrompt = ai.definePrompt({
  name: 'extractTextFromImagePrompt',
  input: {schema: ExtractTextFromImageInputSchema},
  output: {schema: ExtractTextFromImageOutputSchema},
  prompt: `You are an expert OCR reader specializing in academic and scientific documents. Your task is to extract all text from the provided image or document, which contains scientific summaries for exam preparation.

Pay close attention to the structure, including headings, bullet points, numbered lists, and any scientific formulas or equations. Preserve the original formatting as much as possible.

Ignore any handwritten notes, colorful highlights, or other markings that are not part of the original printed text. The goal is to get a clean, accurate transcription of the study material.

Extract the text from the following image or document.

Document: {{media url=photoDataUri}}`,
});

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: ExtractTextFromImageInputSchema,
    outputSchema: ExtractTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await extractTextFromImagePrompt(input);
    return output!;
  }
);
