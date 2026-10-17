#!/usr/bin/env node
// Régénère les redirections de vercel.json à partir des `wp_id` de src/content/pages.
// Usage : npm run redirects  (à relancer après tout renommage ou déplacement de page)
//
// - /?page_id=N (ancienne URL WordPress) → /<slug>/ ;
// - /wp-content/uploads/* → /medias/* ;
// - les redirections ajoutées à la main dans vercel.json sont conservées
//   (seules celles marquées comme générées sont remplacées).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { parse } from 'yaml';

const PAGES = 'src/content/pages';
const VERCEL = 'vercel.json';

const config = JSON.parse(await readFile(VERCEL, 'utf8'));
const generated = [];

for (const file of (await readdir(PAGES)).filter((f) => f.endsWith('.md'))) {
  const raw = await readFile(join(PAGES, file), 'utf8');
  const fm = parse(raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') ?? {};
  const slug = basename(file, '.md');
  // L'accueil est déjà servi sur « / » : une redirection vers « / » bouclerait.
  if (!fm.wp_id || fm.draft || slug === 'accueil') continue;
  generated.push({
    source: '/',
    has: [{ type: 'query', key: 'page_id', value: String(fm.wp_id) }],
    destination: `/${slug}/`,
    permanent: true,
  });
}

generated.sort((a, b) => Number(a.has[0].value) - Number(b.has[0].value));
generated.push({
  source: '/wp-content/uploads/:path*',
  destination: '/medias/:path*',
  permanent: true,
});

const isGenerated = (r) =>
  r.source === '/wp-content/uploads/:path*' ||
  (r.source === '/' && r.has?.[0]?.key === 'page_id');

const manual = (config.redirects ?? []).filter((r) => !isGenerated(r));
config.redirects = [...manual, ...generated];

await writeFile(VERCEL, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `${generated.length} redirection(s) générée(s), ${manual.length} manuelle(s) conservée(s).`,
);
