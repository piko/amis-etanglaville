#!/usr/bin/env node
// Garde-fou sur le contenu (lancé par `npm run check`, donc aussi en CI).
// Pages CMS réécrit parfois les chemins d'images en adresses raw.githubusercontent.com :
// le dépôt étant privé, ces images ne s'affichent pas. Le chemin attendu est /medias/AAAA/MM/fichier.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DOSSIERS = ['src/content', 'src/data'];
const INTERDIT = /https?:\/\/raw\.githubusercontent\.com\/[^\s)"']*/g;

const erreurs = [];
for (const dossier of DOSSIERS) {
  const fichiers = await readdir(dossier, {
    recursive: true,
    withFileTypes: true,
  });
  for (const f of fichiers) {
    if (!f.isFile()) continue;
    const chemin = join(f.parentPath, f.name);
    const lignes = (await readFile(chemin, 'utf8')).split('\n');
    lignes.forEach((ligne, i) => {
      for (const [url] of ligne.matchAll(INTERDIT)) {
        const media = url.match(/\/public(\/medias\/.*)$/)?.[1];
        erreurs.push(
          `${chemin}:${i + 1} : ${url}` +
            (media ? `\n    → remplacer par ${media}` : ''),
        );
      }
    });
  }
}

if (erreurs.length) {
  console.error(
    `✋ Adresses raw.githubusercontent.com interdites dans le contenu (images cassées, dépôt privé).\n` +
      `Utiliser le chemin du média : /medias/AAAA/MM/fichier.\n\n` +
      erreurs.join('\n'),
  );
  process.exit(1);
}
console.log('Contenu : aucune adresse raw.githubusercontent.com.');
