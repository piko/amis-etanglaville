import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeContenu from './src/lib/rehype-contenu.mjs';

export default defineConfig({
  site: 'https://amis-letanglaville.org',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Processeur unified (remark/rehype) pour le plugin de mise en forme du contenu.
    processor: unified({ rehypePlugins: [rehypeContenu] }),
  },
  integrations: [sitemap()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      fallbacks: ['Georgia', 'serif'],
      options: { experimental: { variableAxis: { opsz: [[6, 72]] } } },
    },
    {
      provider: fontProviders.google(),
      name: 'Public Sans',
      cssVariable: '--font-public-sans',
      weights: [400, 600, 700],
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
