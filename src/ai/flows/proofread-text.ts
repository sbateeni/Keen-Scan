'use server';
/**
 * @fileOverview An AI agent that proofreads and enhances text.
 *
 * - proofreadText - A function that handles the text proofreading process.
 * - ProofreadTextInput - The input type for the proofreadText function.
 * - ProofreadTextOutput - The return type for the proofreadText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProofreadTextInputSchema = z.object({
  text: z.string().describe('The text to be proofread and improved.'),
});
export type ProofreadTextInput = z.infer<typeof ProofreadTextInputSchema>;

const ProofreadTextOutputSchema = z.object({
  proofreadText: z
    .string()
    .describe('The proofread and improved version of the text.'),
});
export type ProofreadTextOutput = z.infer<typeof ProofreadTextOutputSchema>;

export async function proofreadText(
  input: ProofreadTextInput
): Promise<ProofreadTextOutput> {
  return proofreadTextFlow(input);
}

const proofreadTextPrompt = ai.definePrompt({
  name: 'proofreadTextPrompt',
  input: {schema: ProofreadTextInputSchema},
  output: {schema: ProofreadTextOutputSchema},
  prompt: `You are an expert Arabic editor. Your task is to proofread the following text for any spelling, grammar, or punctuation errors. In addition to correcting mistakes, please improve the overall clarity, flow, and style of the text while preserving its original meaning.

Provide only the final, polished Arabic text as the output.

Text to proofread:
{{{text}}}`,
});

const proofreadTextFlow = ai.defineFlow(
  {
    name: 'proofreadTextFlow',
    inputSchema: ProofreadTextInputSchema,
    outputSchema: ProofreadTextOutputSchema,
  },
  async input => {
    const {output} = await proofreadTextPrompt(input);
    return output!;
  }
);
