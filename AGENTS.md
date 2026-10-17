# AGENTS.md : règles pour les IA (Claude, Codex…) et les développeurs

Site statique de l'association **Les Amis de L'Étang-la-Ville (CDPS)**. Il remplace l'ancien site WordPress `amis-letanglaville.org`.
Référence complète : [ARCHITECTURE.md](ARCHITECTURE.md). Ce fichier en est le résumé opérationnel.

## Stack

- **Astro 7** (site 100 % statique, `output: static`), **Tailwind CSS v4** (`@tailwindcss/vite`, plugin `@tailwindcss/typography`).
- Contenu en Markdown/YAML, en **content collections** typées avec Zod.
- **Pages CMS** (édition par les bénévoles, branche `recette`).
- **Vercel** (production sur `main`, préproduction par branche ou PR).
- Node 24 (`.nvmrc`).

## Commandes

| Commande                          | Rôle                                                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Serveur local sur http://localhost:4321. Pour un agent : `npx astro dev --background`, puis `npx astro dev stop`             |
| `npm run check`                   | Types et schémas de contenu (`astro check`)                                                                                  |
| `npm run build`                   | Build de production dans `dist/`. Valide tout le contenu                                                                     |
| `npm run format` / `format:check` | Prettier (code uniquement : `src/content` et `src/data` sont exclus)                                                         |
| `npm run redirects`               | Régénère les redirections de `vercel.json` (`?page_id=N` vers le slug)                                                       |
| `npm run import:pages`            | Import initial des pages WordPress (`_import/` vers `src/content/pages`). Déjà fait, ne pas relancer sans `--force` réfléchi |

## Arborescence utile

```
src/content.config.ts     Schémas des collections (pages, bulletins, actualites, galeries)
src/content/pages/*.md    Pages fixes : <slug>.md donne l'URL /<slug>/
src/data/menu.yml         Menu principal (title, link, children)
src/data/site.yml         Nom, adresse, e-mail, liens PayAsso, Facebook
src/lib/data.ts           Lecture et validation de menu.yml et site.yml
src/styles/global.css     Design system : tokens @theme (couleurs, polices)
src/layouts/              Base.astro (head, SEO, en-tête, pied), Page.astro (page de texte)
src/components/           Header, Menu, MenuList, Footer…
src/pages/                Routes : index, [...slug] (pages fixes), 404
public/medias/AAAA/MM/    Images et PDF (mêmes chemins que WordPress), servis en /medias/…
scripts/                  Import WordPress, génération des redirections
_import/                  Export brut de l'ancien site (source de la migration, ne pas modifier)
.pages.yml                Configuration Pages CMS
vercel.json               Redirections 301
```

## Règles

1. **Jamais de push sur `main`.** Toujours créer une branche (`feat/…`, `fix/…`, `contenu/…`, `claude/…`) et ouvrir une PR. Un hook `pre-push` bloque `main` : ne pas le contourner.
2. **Avant chaque push** : `npm run check && npm run build` doivent passer (`npm run format` si du code a changé).
3. **Pas de style dans le contenu.** Ni HTML de mise en forme, ni classes, ni `style=` dans le Markdown. Le visuel vit dans `src/styles/global.css` et `src/components/`.
4. **Schémas alignés.** Toute modification d'un schéma (`src/content.config.ts`, `src/lib/data.ts`) se reporte dans `.pages.yml`, et inversement. Les `name` techniques sont stables, les libellés sont en français.
5. **Ne pas toucher au design sans demande explicite** (tokens, composants, mise en page).
6. **Slugs** : en minuscules, sans accents, avec des tirets. Si une page est renommée ou déplacée, lancer `npm run redirects` et vérifier `vercel.json`. Conserver `wp_id` dans le front matter.
7. **Médias** : fichiers dans `public/medias/AAAA/MM/`, référencés en `/medias/AAAA/MM/fichier`. Texte alternatif obligatoire pour les images porteuses de sens.
8. **Accessibilité** (objectif WCAG AA) : HTML sémantique, contrastes, focus visible, navigation au clavier. Pas de JavaScript sauf besoin réel (menu mobile, visionneuse).
9. **Langue** : contenu, libellés, commentaires de code et messages de commit **en français**.
10. Ne pas modifier `_import/` (source de la migration, supprimée une fois la migration validée).

## État du projet (17/10/2026)

- Socle en place. Les 21 pages WordPress sont importées telles quelles : slugs conservés, médias encore pointés vers l'ancien site en URL absolues.
- **Design et structure des pages : en cours de réflexion dans un canevas Claude** (lien à renseigner : _à compléter_). Le thème actuel (`global.css`) et l'accueil sont **provisoires**.
- Reste à faire après le canevas (voir ARCHITECTURE.md §14) :
  - éclater les bulletins en fichiers ;
  - convertir les cartes postales en galerie ;
  - télécharger les médias ;
  - réaliser l'accueil sur mesure ;
  - créer les pages Bulletins et Actualités.
- Commentaires `<!-- … -->` dans le contenu importé : points à vérifier relevés à l'export.

## Circuit de publication

Branche puis PR. Vercel publie une préproduction (lien dans la PR). Le bureau relit, puis la PR est fusionnée dans `main` et la production est mise à jour.
Les bénévoles modifient le contenu sur la branche `recette` via Pages CMS. Une PR `recette` → `main` regroupe leurs modifications.

Règles de fusion :

- PR d'une branche de travail (`feat/…`, `claude/…`…) → `main` : **Squash and merge**, puis supprimer la branche.
- PR `recette` → `main` : **Create a merge commit** (jamais de squash, pour que `recette` et `main` ne divergent pas) et **ne pas supprimer `recette`**.
- Après une fusion dans `main`, resynchroniser la recette : `git switch recette && git pull && git merge main && git push`.
