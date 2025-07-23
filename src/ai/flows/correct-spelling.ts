'use server';
/**
 * @fileOverview An AI agent that corrects spelling mistakes and formats paragraphs in a text.
 *
 * - correctSpelling - A function that handles the spelling correction and formatting process.
 * - CorrectSpellingInput - The input type for the correctSpelling function.
 * - CorrectSpellingOutput - The return type for the correctSpelling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectSpellingInputSchema = z.object({
  text: z.string().describe('The text to be spell-checked and formatted.'),
});
export type CorrectSpellingInput = z.infer<typeof CorrectSpellingInputSchema>;

const CorrectSpellingOutputSchema = z.object({
  correctedText: z
    .string()
    .describe('The text with spelling mistakes corrected and paragraphs formatted.'),
});
export type CorrectSpellingOutput = z.infer<
  typeof CorrectSpellingOutputSchema
>;

export async function correctSpelling(
  input: CorrectSpellingInput
): Promise<CorrectSpellingOutput> {
  return correctSpellingFlow(input);
}

const correctSpellingPrompt = ai.definePrompt({
  name: 'correctSpellingPrompt',
  input: {schema: CorrectSpellingInputSchema},
  output: {schema: CorrectSpellingOutputSchema},
  prompt: `You are an expert Arabic editor. Your task is to correct spelling mistakes and format paragraphs in the following text.

VERY IMPORTANT:
- Your primary goal is to fix spelling errors.
- You should also ensure proper paragraph formatting. When a sentence ends with a period (.), it often signifies the end of a paragraph or requires a new line. Format the text accordingly.
- Do NOT change the sentence structure significantly.
- Do NOT change the style or rephrase anything.
- The output must be as close as possible to the original text, with only spelling mistakes fixed and paragraph formatting applied.

Text to correct and format:
{{{text}}}`,
});

const correctSpellingFlow = ai.defineFlow(
  {
    name: 'correctSpellingFlow',
    inputSchema: CorrectSpellingInputSchema,
    outputSchema: CorrectSpellingOutputSchema,
  },
  async input => {
    const {output} = await correctSpellingPrompt(input);
    return output!;
  }
);
