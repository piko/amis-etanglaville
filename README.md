# Les Amis de L'Étang-la-Ville : site web

Site de l'association **Les Amis de L'Étang-la-Ville (CDPS)**, généré avec [Astro](https://astro.build) et hébergé sur Vercel.

- Architecture et décisions : [ARCHITECTURE.md](ARCHITECTURE.md)
- Règles pour les IA et les développeurs : [AGENTS.md](AGENTS.md)

## Démarrage

Prérequis : Node.js 24 (`.nvmrc`), Git, [GitHub CLI](https://cli.github.com) (`gh`), VS Code (accepter les extensions recommandées).

```bash
git clone https://github.com/piko/amis-etanglaville.git
cd amis-etanglaville
npm install          # active aussi le hook git qui protège main
npm run dev          # http://localhost:4321
```

Avant de pousser :

```bash
npm run check && npm run build
```

## Branches et publication

| Branche                       | Rôle                                                    | Déploiement Vercel                 |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `main`                        | Production (aucun push direct, merge par PR uniquement) | Production                         |
| `recette`                     | Modifications de contenu des bénévoles (Pages CMS)      | Préproduction stable de la branche |
| `feat/*`, `fix/*`, `claude/*` | Évolutions                                              | Préproduction par PR               |

Circuit :

1. Créer une branche et ouvrir une PR.
2. Vercel publie la préproduction et met son lien dans la PR.
3. Le bureau relit sur la préproduction.
4. Merge dans `main` : la production est mise à jour.

## Modifier le contenu

- **Bénévoles** : [Pages CMS](https://app.pagescms.org), sur la branche `recette`.
- **Avec Claude** : dans VS Code (Claude Code), ou en ouvrant une issue « Demande de modification » sur GitHub avec `@claude`.
- **À la main** : fichiers Markdown de `src/content/pages/` (une page = un fichier, son nom donne l'URL).

## Liens

- Production : _à compléter après le premier déploiement Vercel_
- Recette : _à compléter_
- Canevas de design : _à compléter_
