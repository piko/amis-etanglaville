#!/usr/bin/env node
// Produit les vignettes WebP des images de public/medias dans public/vignettes/
// (lancé automatiquement avant `npm run dev` et `npm run build`).
// Les vignettes ne sont pas versionnées : seules celles qui manquent ou sont périmées sont recalculées.
import { existsSync } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { LARGEURS, cheminVignette } from '../src/lib/medias.mjs';

const RACINE = 'public';
const fichiers = (
  await readdir(join(RACINE, 'medias'), { recursive: true })
).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

let creees = 0;
const taches = fichiers.map((f) => async () => {
  const src = `/medias/${f.split('\\').join('/')}`;
  const original = join(RACINE, src);
  const { mtimeMs } = await stat(original);
  const image = sharp(original, { failOn: 'none' });
  let largeur;
  for (const l of LARGEURS) {
    const sortie = join(RACINE, cheminVignette(src, l));
    if (existsSync(sortie) && (await stat(sortie)).mtimeMs >= mtimeMs) continue;
    largeur ??= (await image.metadata()).width ?? 0;
    if (l >= largeur) continue;
    await mkdir(dirname(sortie), { recursive: true });
    await image
      .clone()
      .rotate()
      .resize({ width: l })
      .webp({ quality: 74 })
      .toFile(sortie);
    creees++;
  }
});

const file = [...taches];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (file.length) await file.shift()();
  }),
);
console.log(`Vignettes : ${creees} créée(s) pour ${fichiers.length} image(s).`);
