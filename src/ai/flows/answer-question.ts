'use server';
/**
 * @fileOverview An AI agent that answers questions based on a given context.
 *
 * - answerQuestion - A function that handles the question answering process.
 * - AnswerQuestionInput - The input type for the answerQuestion function.
 * - AnswerQuestionOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question to be answered.'),
  context: z.string().describe('The context text to use for answering the question.'),
  answerType: z.enum(['default', 'summary', 'bullet_points']).describe('The desired format for the answer.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the provided context.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(
  input: AnswerQuestionInput
): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are an expert academic assistant. Your task is to answer the user's question based *only* on the provided context. Do not use any external knowledge. If the answer is not found in the context, state that clearly.

Format your answer according to the user's desired answer type.
{{#if (eq answerType "summary")}}
Provide a concise summary as the answer.
{{else if (eq answerType "bullet_points")}}
Provide the answer in bullet points.
{{else}}
Provide a direct and detailed answer.
{{/if}}

Context:
---
{{{context}}}
---

Question: {{{question}}}

Answer:`,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerQuestionPrompt(input);
    return output!;
  }
);
