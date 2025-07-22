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
  text: z.string().describe('The text to be proofread and enhanced.'),
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
  prompt: `You are an expert editor specializing in Arabic. Your task is to proofread the following text for any grammatical errors, spelling mistakes, or awkward phrasing.

In addition to correcting errors, please enhance the text for clarity, flow, and impact while preserving the original meaning and tone. The final output should be a clean, polished, and professional version of the text.

Review the following text:

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
