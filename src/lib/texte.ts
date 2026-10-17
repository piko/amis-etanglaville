/** Ancre ou slug : minuscules, sans accents, mots séparés par des tirets. */
export function slugifier(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** « 1 carte », « 9 cartes ». */
export const pluriel = (n: number, mot: string) =>
  `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Numéro de référence d'une carte postale, tiré du nom de fichier (« 310-Foret… » → « 310 »). */
export function referenceCarte(src: string): string | undefined {
  return src
    .split('/')
    .pop()
    ?.match(/^(\d+)/)?.[1];
}

/**
 * Typographie française des textes courts (YAML, front matter) : apostrophe typographique,
 * espace insécable avant « : »,
 * espace fine insécable avant ; ! ? » et après «. Même règle que src/lib/rehype-contenu.mjs.
 */
export function typo(texte: string): string;
export function typo(texte: string | undefined): string | undefined;
export function typo(texte?: string) {
  return texte
    ?.replace(/(\p{L})'/gu, '$1’')
    .replace(/ :/g, '\u00a0:')
    .replace(/ ([;!?»])/g, '\u202f$1')
    .replace(/« /g, '«\u202f');
}
