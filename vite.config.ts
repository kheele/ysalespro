import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig({
  plugins: [vinext()],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@genkit-ai/ai/chat': '@genkit-ai/ai/session',
    },
  },
  optimizeDeps: {
    exclude: [
      'ansi-color',
      'genkit',
      '@genkit-ai/ai',
      '@genkit-ai/core',
      '@genkit-ai/google-genai',
    ],
  },
  ssr: {
    external: [
      'ansi-color',
      'genkit',
      '@genkit-ai/ai',
      '@genkit-ai/core',
      '@genkit-ai/google-genai',
    ],
  },
});
