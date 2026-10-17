// Images responsives pour les médias de public/medias.
// Les vignettes WebP sont produites par scripts/vignettes.mjs (lancé avant `dev` et `build`)
// dans public/vignettes/, avec le même chemin que l'original suivi de la largeur :
// /medias/2019/06/carte.jpg → /vignettes/2019/06/carte-800.webp
// Sans vignette (image trop petite ou script non lancé), l'original est servi tel quel.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const LARGEURS = [400, 800, 1600];
const PUBLIC = join(process.cwd(), 'public');
const cache = new Map();

/** Chemin d'une vignette à partir du chemin public d'un média. */
export function cheminVignette(src, largeur) {
  return `${src.replace(/^\/medias\//, '/vignettes/').replace(/\.[^.\/]+$/, '')}-${largeur}.webp`;
}

/**
 * Dimensions et srcset d'un média local (/medias/…).
 * Renvoie null pour une image externe ou introuvable.
 * @param {string} src
 * @returns {Promise<{ width: number, height: number, srcset?: string, src: string } | null>}
 */
export async function infosImage(src) {
  if (!src?.startsWith('/medias/')) return null;
  if (cache.has(src)) return cache.get(src);
  const fichier = join(PUBLIC, decodeURI(src));
  let infos = null;
  if (existsSync(fichier)) {
    try {
      const {
        width = 0,
        height = 0,
        orientation,
      } = await sharp(fichier).metadata();
      // Photos prises à la verticale : dimensions affichées inversées.
      const tourne = orientation && orientation >= 5;
      const largeur = tourne ? height : width;
      const hauteur = tourne ? width : height;
      const variantes = LARGEURS.filter(
        (l) => l < largeur && existsSync(join(PUBLIC, cheminVignette(src, l))),
      ).map((l) => `${cheminVignette(src, l)} ${l}w`);
      infos = {
        width: largeur,
        height: hauteur,
        src,
        srcset: variantes.length
          ? [...variantes, `${src} ${largeur}w`].join(', ')
          : undefined,
      };
    } catch {
      infos = null;
    }
  }
  cache.set(src, infos);
  return infos;
}
