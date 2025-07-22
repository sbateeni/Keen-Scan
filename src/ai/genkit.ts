import {genkit} from 'genkit';

export const ai = genkit({
  plugins: [], // Removing the global googleAI() plugin
  model: 'googleai/gemini-1.5-flash-latest',
});
