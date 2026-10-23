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
| `npm run check`                   | Garde-fou contenu (aucune adresse `raw.githubusercontent.com`), puis types et schémas (`astro check`)                        |
| `npm run build`                   | Build de production dans `dist/`. Valide tout le contenu                                                                     |
| `npm run format` / `format:check` | Prettier (code uniquement : `src/content` et `src/data` sont exclus)                                                         |
| `npm run redirects`               | Régénère les redirections de `vercel.json` (`?page_id=N` vers le slug)                                                       |
| `npm run medias:optimiser`        | Recompresse les médias lourds de `public/medias` (images, PDF via Ghostscript)                                               |
| `npm run import:pages`            | Import initial des pages WordPress (`_import/` vers `src/content/pages`). Déjà fait, ne pas relancer sans `--force` réfléchi |

## Arborescence utile

```
src/content.config.ts     Schémas des collections (pages, bulletins, actualites, galeries)
src/content/pages/*.md    Pages fixes : <slug>.md donne l'URL /<slug>/
src/data/menu.yml         Menu principal (title, link, children)
src/data/site.yml         Nom, adresse, e-mail, liens PayAsso, Facebook, partenaires
src/data/accueil.yml      Textes de la page d'accueil (bandeau, missions, succès)
src/lib/data.ts           Lecture et validation de menu.yml et site.yml
src/styles/global.css     Design system : tokens @theme (couleurs, polices)
src/layouts/              Base.astro (head, SEO, en-tête, pied), Page.astro (page de texte)
src/components/           Header, Menu, MenuList, Footer…
src/pages/                Routes : index, [...slug] (pages fixes), bulletins, actualites, cartes-postales-historiques, recherche, plan-du-site, 404
public/medias/AAAA/MM/    Images et PDF (mêmes chemins que WordPress), servis en /medias/…
scripts/                  Import WordPress, redirections, garde-fou contenu (verifier-contenu.mjs)
.github/workflows/        CI, @claude (claude.yml : réalisation, fusion dans recette, lien dans l'issue), rebuild quotidien
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
11. **Brouillon** : `draft: false` par défaut pour une page ou une actualité créée à la demande. `draft: true` seulement si la demande le dit explicitement : la relecture sur la préproduction de la recette tient lieu de garde-fou.

## État du projet (17/10/2026)

- Design du canevas (piste A « La Gazette du village », `design/canevas.html`) appliqué à tous les gabarits : accueil, page de texte, bulletins, actualités, galerie, 404, plus recherche, plan du site et mentions légales.
- Contenu migré : 17 pages remises en forme (titres, typographie, textes alternatifs), 35 bulletins (`src/content/bulletins/`), 29 actualités (`src/content/actualites/`), galerie de 184 cartes postales (`src/content/galeries/cartes-postales.yml`), accueil (`src/data/accueil.yml`).
- Médias rapatriés dans `public/medias/` (305 fichiers, compressés), couvertures de bulletins dans `public/medias/bulletins/`. Les vignettes responsives (`public/vignettes/`) sont générées avant `dev` et `build`, et ne sont pas versionnées.
- Reste à faire : faire valider par le bureau les points relevés dans la PR de migration (faits douteux, noms) ; renseigner l'URL du groupe Facebook ; supprimer `_import/` après validation.

## Médias et images

- Ajouter un média : le déposer dans `public/medias/AAAA/MM/` (ou via Pages CMS), puis `npm run medias:optimiser` pour les fichiers lourds (images > 2000 px, PDF > 2 Mo ; Ghostscript requis pour les PDF).
- Dans le Markdown : `![texte alternatif](/medias/…)` suivi, à la ligne suivante sans ligne vide, de `*Légende*`. Le plugin `src/lib/rehype-contenu.mjs` en fait une `<figure>` ; plusieurs figures à la suite forment une grille. Il ajoute aussi dimensions, `srcset` et espaces insécables.
- Le Markdown passe par le processeur `unified` (`@astrojs/markdown-remark`), configuré dans `astro.config.mjs`.

## Circuit de publication

Branche puis PR. Vercel publie une préproduction (lien dans la PR). Le bureau relit, puis la PR est fusionnée dans `main` et la production est mise à jour.
Les bénévoles modifient le contenu sur la branche `recette` via Pages CMS. Une PR **« Mise en production »** `recette` → `main` regroupe les modifications. Elle est ouverte, mise à jour ou fermée automatiquement (`.github/workflows/mise-en-production.yml`), et liste les pages concernées avec leur lien sur la préproduction. Le bureau relit, puis la fusionne.

Demandes confiées à `@claude` dans une issue (`.github/workflows/claude.yml`) :

1. **Réalisation** : « @claude » dans l'issue ou un commentaire. Claude part de `recette` sur une branche `contenu/<n° issue>-<début du titre>` (ex. `contenu/12-ajouter-la-brocante-2027-aux`). En cas de doute, il pose sa question et s'arrête ; la réponse, en commentaire « @claude », le relance.
2. **Arrivée sur la recette** : si Claude a terminé, le workflow lance la CI sur la branche `contenu/…` et, dès qu'elle est verte, la fusionne dans `recette` (merge commit « Contenu : … (#n° issue) »), sans PR intermédiaire. Conflit, CI rouge ou incident : la branche est conservée et c'est signalé dans l'issue ; un membre du bureau peut alors ouvrir la PR à la main.
3. **Lien de relecture** : le workflow attend le déploiement Vercel de la recette, puis donne dans l'issue le lien direct vers chaque page concernée (ex. `/actualites/2026-10-30-brocante/`) sur la préproduction fixe https://amis-etanglaville-git-recette-amis-etang-la-ville.vercel.app.

`@claude` ajouté en modifiant la description d'une issue ne déclenche rien (seule la création est écoutée) : l'écrire dans un commentaire. Dans une PR, `@claude` agit directement sur la branche de la PR.

Règles de fusion :

- Branche `contenu/…` (workflow `@claude`) → `recette` : **merge commit automatique, sans PR**, une fois la CI verte, puis branche supprimée.
- PR d'une branche de travail (`feat/…`, `claude/…`…) → `main` : **Squash and merge**, puis supprimer la branche.
- PR `recette` → `main` : **Create a merge commit** (jamais de squash, pour que `recette` et `main` ne divergent pas) et **ne pas supprimer `recette`**.
- Après une fusion dans `main`, la recette est **resynchronisée automatiquement** (`mise-en-production.yml`). En cas de conflit, le workflow échoue et il faut le faire à la main : `git switch recette && git pull && git merge main && git push`. Une mise en production fusionnée par erreur en squash est signalée dans sa PR.
