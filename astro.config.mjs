// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://amis-letanglaville.org',
  // Toutes les URL se terminent par « / » (aligné avec vercel.json)
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  // Polices du canevas, téléchargées au build et servies par le site (aucune requête vers Google)
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
