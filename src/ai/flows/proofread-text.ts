'use server';
/**
 * @fileOverview An AI agent that proofreads text.
 *
 * - proofreadText - A function that corrects spelling, grammar, and removes extra spaces.
 * - ProofreadTextInput - The input type for the proofreadText function.
 * - ProofreadTextOutput - The return type for the proofreadText function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const ProofreadTextInputSchema = z.object({
  apiKey: z.string().describe('The user-provided Google AI API key.'),
  text: z.string().describe('The text to be proofread.'),
});
export type ProofreadTextInput = z.infer<typeof ProofreadTextInputSchema>;

const ProofreadTextOutputSchema = z.object({
  proofreadText: z
    .string()
    .describe(
      'The proofread text with corrected spelling, grammar, and normalized spacing.'
    ),
});
export type ProofreadTextOutput = z.infer<typeof ProofreadTextOutputSchema>;

export async function proofreadText(
  input: ProofreadTextInput
): Promise<ProofreadTextOutput> {
  ai.configure({
    plugins: [googleAI({apiKey: input.apiKey})],
  });
  return proofreadTextFlow(input);
}

const proofreadTextPrompt = ai.definePrompt({
  name: 'proofreadTextPrompt',
  input: {schema: ProofreadTextInputSchema},
  output: {schema: ProofreadTextOutputSchema},
  prompt: `You are an expert proofreader. Your task is to correct any spelling and grammatical errors in the following text. Also, remove any unnecessary spaces or line breaks to make it clean and readable. Only return the corrected text.

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
    if (!input.text.trim()) {
      return {proofreadText: ''};
    }
    const {output} = await proofreadTextPrompt(input);
    return output!;
  }
);
