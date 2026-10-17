#!/usr/bin/env node
// Allège les médias de public/medias (à lancer après l'ajout de fichiers lourds).
// Usage : npm run medias:optimiser
//
// - images (jpg, png, webp) : largeur ramenée à 2000 px au plus, recompression ;
// - PDF de plus de 2 Mo : recompression par Ghostscript (images à 150 dpi), si `gs` est installé ;
// - un fichier n'est remplacé que si le gain dépasse 10 % ;
// - public/medias/.optimises.json mémorise les fichiers déjà traités (pas de recompression en chaîne).
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const RACINE = 'public/medias';
const JOURNAL = join(RACINE, '.optimises.json');
const LARGEUR_MAX = 2000;
const GAIN_MIN = 0.9;
const executer = promisify(execFile);

const journal = existsSync(JOURNAL)
  ? JSON.parse(await readFile(JOURNAL, 'utf8'))
  : {};

async function remplacerSiPlusPetit(fichier, tampon, avant) {
  if (tampon.length >= avant * GAIN_MIN) return avant;
  await writeFile(fichier, tampon);
  return tampon.length;
}

async function optimiserImage(fichier, avant) {
  const image = sharp(fichier, { failOn: 'none' }).rotate();
  const { width = 0 } = await image.metadata();
  if (width > LARGEUR_MAX) image.resize({ width: LARGEUR_MAX });
  const extension = fichier.split('.').pop().toLowerCase();
  if (extension === 'png')
    image.png({ compressionLevel: 9, palette: true, quality: 90 });
  else if (extension === 'webp') image.webp({ quality: 80 });
  else image.jpeg({ quality: 80, mozjpeg: true });
  return remplacerSiPlusPetit(fichier, await image.toBuffer(), avant);
}

async function optimiserPdf(fichier, avant) {
  if (avant < 2_000_000) return avant;
  const temporaire = `${fichier}.tmp.pdf`;
  await executer('gs', [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    '-dPDFSETTINGS=/ebook',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${temporaire}`,
    fichier,
  ]);
  const apres = (await stat(temporaire)).size;
  if (apres < avant * GAIN_MIN) {
    await rename(temporaire, fichier);
    return apres;
  }
  await unlink(temporaire);
  return avant;
}

const gs = await executer('gs', ['--version']).then(
  () => true,
  () => false,
);
if (!gs)
  console.log(
    'Ghostscript absent : les PDF ne sont pas traités (brew install ghostscript).',
  );

const fichiers = (await readdir(RACINE, { recursive: true }))
  .filter((f) => /\.(jpe?g|png|webp|pdf)$/i.test(f))
  .map((f) => join(RACINE, f));

let total = { avant: 0, apres: 0, traites: 0 };
const taches = fichiers.map((fichier) => async () => {
  const { size: avant } = await stat(fichier);
  if (journal[fichier] === avant) return;
  const pdf = /\.pdf$/i.test(fichier);
  if (pdf && !gs) return;
  try {
    const apres = pdf
      ? await optimiserPdf(fichier, avant)
      : await optimiserImage(fichier, avant);
    journal[fichier] = apres;
    total.avant += avant;
    total.apres += apres;
    total.traites++;
    if (apres < avant) {
      console.log(
        `${fichier} : ${(avant / 1e6).toFixed(1)} → ${(apres / 1e6).toFixed(1)} Mo`,
      );
    }
  } catch (erreur) {
    console.log(`Échec sur ${fichier} : ${erreur.message}`);
  }
});

// Quatre traitements en parallèle.
const file = [...taches];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (file.length) await file.shift()();
  }),
);

await writeFile(JOURNAL, `${JSON.stringify(journal, null, 2)}\n`);
console.log(
  `${total.traites} fichier(s) traité(s) : ${(total.avant / 1e6).toFixed(0)} → ${(total.apres / 1e6).toFixed(0)} Mo.`,
);
