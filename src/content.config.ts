// Collections de contenu (voir ARCHITECTURE.md §6).
// Toute modification d'un schéma doit être reportée dans .pages.yml (et inversement).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Pages fixes : src/content/pages/<slug>.md → /<slug>/
const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    parent: z.string().optional(),
    order: z.number().optional(),
    image: z.string().optional(),
    wp_id: z.number().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Bulletins : src/content/bulletins/<numero>.md (à migrer après le canevas de design)
const bulletins = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/bulletins' }),
  schema: z.object({
    numero: z.number(),
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    pdf: z.string().optional(),
    cover: z.string().optional(),
    type: z.enum(['bulletin', 'flash-info']).default('bulletin'),
    disponible: z.boolean().default(true),
  }),
});

// Actualités : src/content/actualites/AAAA-MM-JJ-<slug>.md
const actualites = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/actualites' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    dateFin: z.coerce.date().optional(),
    // Précision réelle de la date : « 6 nov. 2026 », « Nov. 2023 » ou « 2023 ».
    datePrecision: z.enum(['jour', 'mois', 'annee']).default('jour'),
    lieu: z.string().optional(),
    categorie: z
      .enum(['salon', 'portes-ouvertes', 'ag', 'environnement', 'autre'])
      .default('autre'),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    resume: z.string().optional(),
    annule: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// Galeries : src/content/galeries/<nom>.yml
const galeries = defineCollection({
  loader: glob({ pattern: '**/[^_]*.yml', base: './src/content/galeries' }),
  schema: z.object({
    title: z.string(),
    sections: z.array(
      z.object({
        titre: z.string(),
        images: z.array(
          z.object({
            src: z.string(),
            legende: z.string().optional(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = { pages, bulletins, actualites, galeries };
