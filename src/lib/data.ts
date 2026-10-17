// Données globales éditables dans Pages CMS (src/data/*.yml), validées au build.
// Toute modification d'un schéma doit être reportée dans .pages.yml (et inversement).
import { parse } from 'yaml';
import { z } from 'astro/zod';
import menuSource from '../data/menu.yml?raw';
import siteSource from '../data/site.yml?raw';

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
});

export const menu = z.array(menuItem).parse(parse(menuSource));
export const site = siteSchema.parse(parse(siteSource));

/** Transforme un `link` du menu (slug ou URL) en href. « accueil » renvoie vers « / ». */
export function hrefFor(link: string): string {
  if (/^(https?:|mailto:|\/)/.test(link)) return link;
  return link === 'accueil' ? '/' : `/${link}/`;
}
