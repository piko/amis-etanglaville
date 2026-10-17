#!/usr/bin/env node
// Télécharge les médias de l'ancien site WordPress dans public/medias/AAAA/MM/
// puis remplace leurs URL dans src/content et src/data (ARCHITECTURE.md §14, étape 5).
// Usage : node scripts/download-medias.mjs
//
// - source : _import/data/medias.txt (une URL par ligne) ;
// - les noms de fichiers sont gardés, sauf les caractères à risque (accents, espaces, °)
//   qui sont translittérés : « Séguie Le Brun.jpg » devient « Seguie-Le-Brun.jpg » ;
// - un fichier déjà présent n'est jamais réécrasé ;
// - rapport des échecs en fin d'exécution.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const PREFIXE = 'https://amis-letanglaville.org/wp-content/uploads/';
const SORTIE = 'public/medias';
const CONTENU = ['src/content', 'src/data'];

/** Nom de fichier sûr pour Git, Vercel et les URL. */
export function nomSur(nom) {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/°/g, 'o')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-\./g, '.')
    .replace(/\.{2,}/g, '.');
}

/** Chemin public (/medias/AAAA/MM/fichier) d'une URL WordPress. */
export function cheminMedia(url) {
  const relatif = decodeURIComponent(url.slice(PREFIXE.length));
  const morceaux = relatif.split('/');
  const fichier = nomSur(morceaux.pop());
  return `/medias/${[...morceaux, fichier].join('/')}`;
}

async function telecharger(url) {
  const chemin = cheminMedia(url);
  const destination = join('public', chemin);
  if (existsSync(destination)) return { url, chemin, statut: 'présent' };
  const reponse = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!reponse.ok)
    return { url, chemin, statut: `échec HTTP ${reponse.status}` };
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await reponse.arrayBuffer()));
  return { url, chemin, statut: 'téléchargé' };
}

async function fichiers(dossier) {
  const entrees = await readdir(dossier, {
    withFileTypes: true,
    recursive: true,
  });
  return entrees
    .filter((e) => e.isFile() && /\.(md|ya?ml)$/.test(e.name))
    .map((e) => join(e.parentPath, e.name));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const urls = (await readFile('_import/data/medias.txt', 'utf8'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith(PREFIXE));

  await mkdir(SORTIE, { recursive: true });
  const resultats = [];
  // Huit téléchargements en parallèle, pour ne pas surcharger l'ancien serveur.
  for (let i = 0; i < urls.length; i += 8) {
    resultats.push(
      ...(await Promise.all(urls.slice(i, i + 8).map(telecharger))),
    );
  }

  // Remplacement des URL dans le contenu (forme encodée et forme décodée).
  const correspondances = resultats
    .filter((r) => !r.statut.startsWith('échec'))
    .flatMap((r) => [
      [r.url, r.chemin],
      [decodeURI(r.url), r.chemin],
    ]);
  let modifies = 0;
  for (const dossier of CONTENU) {
    for (const fichier of await fichiers(dossier)) {
      const avant = await readFile(fichier, 'utf8');
      let apres = avant;
      for (const [ancien, nouveau] of correspondances)
        apres = apres.split(ancien).join(nouveau);
      if (apres !== avant) {
        await writeFile(fichier, apres);
        modifies++;
      }
    }
  }

  const compte = (s) => resultats.filter((r) => r.statut.startsWith(s)).length;
  console.log(
    `${compte('téléchargé')} téléchargé(s), ${compte('présent')} déjà présent(s), ${compte('échec')} échec(s). ${modifies} fichier(s) de contenu mis à jour.`,
  );
  for (const r of resultats.filter((r) => r.statut.startsWith('échec'))) {
    console.log(`  ${r.statut} : ${r.url}`);
  }
}
