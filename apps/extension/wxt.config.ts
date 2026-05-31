import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Ghost Job Detector',
    description:
      'AI-powered trust-scoring overlay for LinkedIn and Indeed job postings. BYOK OpenRouter key required for AI signals.',
    permissions: ['storage', 'sidePanel'],
    host_permissions: [
      'https://*.linkedin.com/*',
      'https://*.indeed.com/*',
      'https://openrouter.ai/*',
      'https://ghost-job-detector.vercel.app/*',
      'http://localhost:3000/*',
    ],
    options_ui: {
      open_in_tab: true,
    },
    action: {
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
      },
    },
  },
  dev: { server: { port: 3001 } },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
