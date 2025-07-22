import { config } from 'dotenv';
config();

import { googleAI } from '@genkit-ai/googleai';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/proofread-text.ts';
