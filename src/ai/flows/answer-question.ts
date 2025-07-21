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
  question: z.string().describe('The question to be answered. Can be a standard question, a true/false statement, or a multiple-choice question.'),
  context: z.string().describe('The context text to use for answering the question.'),
  answerType: z.enum(['default', 'summary', 'bullet_points', 'true_false', 'multiple_choice']).describe('The format/type of the question being asked.'),
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
  input: {schema: AnswerQuestionInputSchema.extend({ instruction: z.string() })},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are an expert academic assistant. Your task is to answer a user's question based *only* on the provided context. Do not use any external knowledge. If the answer is not found in the context, state that clearly.

Context:
---
{{{context}}}
---

User's Question: {{{question}}}

Now, answer the user's question based on the context, following this instruction:
"{{instruction}}"

Answer:`,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    let instruction = "Provide a direct and detailed answer to the user's question.";
    switch (input.answerType) {
        case 'true_false':
            instruction = "The user's question is a true/false statement. Evaluate if it is true or false based on the context and provide a brief justification. Example response: True. The context states that [...].";
            break;
        case 'multiple_choice':
            instruction = "The user's question is a multiple-choice question. Determine the correct option (e.g., A, B, C, or D) based on the context and provide a brief justification for your choice. Example response: C. The context mentions that [...], which corresponds to option C.";
            break;
        case 'summary':
            instruction = "Provide a concise summary as the answer to the user's question.";
            break;
        case 'bullet_points':
            instruction = "Provide the answer in bullet points.";
            break;
    }

    const promptInput = { ...input, instruction };
    const {output} = await answerQuestionPrompt(promptInput);
    return output!;
  }
);
