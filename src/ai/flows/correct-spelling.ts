'use server';
/**
 * @fileOverview An AI agent that corrects spelling mistakes in a text.
 *
 * - correctSpelling - A function that handles the spelling correction process.
 * - CorrectSpellingInput - The input type for the correctSpelling function.
 * - CorrectSpellingOutput - The return type for the correctSpelling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectSpellingInputSchema = z.object({
  text: z.string().describe('The text to be spell-checked.'),
});
export type CorrectSpellingInput = z.infer<typeof CorrectSpellingInputSchema>;

const CorrectSpellingOutputSchema = z.object({
  correctedText: z
    .string()
    .describe('The text with only spelling mistakes corrected.'),
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
  prompt: `You are an expert Arabic editor. Your ONLY task is to correct spelling mistakes in the following text.

VERY IMPORTANT:
- Do NOT change the formatting.
- Do NOT change the sentence structure.
- Do NOT change the punctuation.
- Do NOT change the style or rephrase anything.
- The output must be an exact copy of the original text, with only the spelling mistakes fixed.

Text to correct:
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
