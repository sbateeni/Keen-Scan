import { config } from 'dotenv';
config();

import { googleAI } from '@genkit-ai/googleai';
import '@/ai/flows/extract-text-from-document.ts';
import '@/ai/flows/proofread-text.ts';
import '@/ai/flows/correct-spelling.ts';
