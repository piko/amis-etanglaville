// Données globales éditables dans Pages CMS (src/data/*.yml), validées au build.
// Toute modification d'un schéma doit être reportée dans .pages.yml (et inversement).
import { parse } from 'yaml';
import { z } from 'astro/zod';
import menuSource from '../data/menu.yml?raw';
import siteSource from '../data/site.yml?raw';
import accueilSource from '../data/accueil.yml?raw';

export interface MenuItem {
  title: string;
  link: string;
  children?: MenuItem[];
}

const menuItem: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    title: z.string(),
    link: z.string(),
    children: z.array(menuItem).optional(),
  }),
);

const siteSchema = z.object({
  nom: z.string(),
  nomCourt: z.string(),
  description: z.string(),
  email: z.string(),
  adresse: z.string(),
  adhesion: z.string(),
  don: z.string(),
  facebook: z.string().optional(),
  formulaire: z.string().optional(),
  formulaireLibelle: z.string().default('Bulletin d’adhésion à imprimer (PDF)'),
  partenaires: z
    .array(z.object({ nom: z.string(), url: z.string().optional() }))
    .default([]),
});

const titreTexte = z.object({ titre: z.string(), texte: z.string() });

const accueilSchema = z.object({
  hero: z.object({
    surtitre: z.string(),
    titre: z.string(),
    texte: z.string(),
    image: z.string(),
    alt: z.string(),
    legende: z.string().optional(),
  }),
  missions: z.array(titreTexte),
  memoire: z.string(),
  succes: z.array(titreTexte),
});

export const menu = z.array(menuItem).parse(parse(menuSource));
export const site = siteSchema.parse(parse(siteSource));
export const accueil = accueilSchema.parse(parse(accueilSource));

/** Transforme un `link` du menu (slug ou URL) en href. « accueil » renvoie vers « / ». */
export function hrefFor(link: string): string {
  if (/^(https?:|mailto:|\/)/.test(link)) return link;
  return link === 'accueil' ? '/' : `/${link}/`;
}

export interface Rubrique {
  /** Libellé de la rubrique (« Notre village ») et lien de sa page de présentation. */
  titre: string;
  href: string;
  /** Pages de la rubrique, dans l’ordre du menu. */
  pages: { titre: string; href: string }[];
}

/** Rubrique du menu qui contient la page `slug`, ou undefined (page hors menu). */
export function rubriqueDe(slug: string): Rubrique | undefined {
  for (const item of menu) {
    const enfants = item.children ?? [];
    if (enfants.some((e) => e.link === slug)) {
      return {
        titre: item.title,
        href: hrefFor(item.link),
        pages: enfants.map((e) => ({ titre: e.title, href: hrefFor(e.link) })),
      };
    }
  }
  return undefined;
}
