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
  question: z.string().describe('The question to be answered. If generating a question, this can be a general instruction like "Generate a question".'),
  context: z.string().describe('The context text to use for answering the question.'),
  answerType: z.enum(['default', 'summary', 'bullet_points', 'true_false', 'multiple_choice']).describe('The desired format for the answer.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the provided context, or a generated question in the specified format.'),
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
  prompt: `You are an expert academic assistant. Your task is to process a user's request based on a provided context. Do not use any external knowledge.

Format your response according to the user's desired 'answerType'.

Context:
---
{{{context}}}
---

{{#if (eq answerType "true_false")}}
Based on the context, generate a single, clear true/false question and provide the correct answer on a new line.
Example:
Question: The sky is green.
Answer: False
{{else if (eq answerType "multiple_choice")}}
Based on the context, generate a single, clear multiple-choice question with four options (A, B, C, D), where only one is correct. Provide the correct answer on a new line.
Example:
Question: What is the capital of France?
A. London
B. Berlin
C. Paris
D. Madrid
Answer: C
{{else}}
User's Question: {{{question}}}

Now, answer the user's question based *only* on the provided context. If the answer is not found in the context, state that clearly.
{{#if (eq answerType "summary")}}
Provide a concise summary as the answer.
{{else if (eq answerType "bullet_points")}}
Provide the answer in bullet points.
{{else}}
Provide a direct and detailed answer.
{{/if}}
{{/if}}

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
