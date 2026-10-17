#!/usr/bin/env node
// Import des pages WordPress brutes : _import/content/pages/*.md → src/content/pages/*.md
// Usage : npm run import:pages [-- --force]
//
// - front matter : `modified` devient `updated` (date seule) ; `type`, `slug` et `date`
//   sont supprimés (le slug vient du nom de fichier) ; `wp_id` et `parent` sont conservés ;
// - liens internes `](./slug.md#ancre)` réécrits en `](/slug/#ancre)` ;
// - n'écrase pas un fichier existant sauf avec --force (le contenu migré peut avoir été retouché).
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

const SOURCE = '_import/content/pages';
const DESTINATION = 'src/content/pages';
const force = process.argv.includes('--force');

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

function convertFrontMatter(fm) {
  const out = { title: fm.title };
  if (fm.parent) out.parent = fm.parent;
  if (fm.wp_id) out.wp_id = fm.wp_id;
  if (fm.modified) out.updated = String(fm.modified).slice(0, 10);
  if (fm.draft) out.draft = true;
  return out;
}

function rewriteLinks(body) {
  return body.replace(
    /\]\(\.\/([a-z0-9-]+)\.md(#[^)]*)?\)/g,
    (_, slug, anchor = '') =>
      `](${slug === 'accueil' ? '/' : `/${slug}/`}${anchor})`,
  );
}

const files = (await readdir(SOURCE)).filter((f) => f.endsWith('.md'));
let written = 0;
let skipped = 0;

for (const file of files) {
  const destination = join(DESTINATION, file);
  if (!force && (await exists(destination))) {
    skipped++;
    continue;
  }
  const raw = await readFile(join(SOURCE, file), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Front matter introuvable : ${file}`);
  const frontMatter = convertFrontMatter(parse(match[1]));
  const body = rewriteLinks(match[2]).trimStart();
  await writeFile(destination, `---\n${stringify(frontMatter)}---\n\n${body}`);
  written++;
}

console.log(
  `${written} page(s) importée(s), ${skipped} ignorée(s) (déjà présentes).`,
);
