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

| Branche                       | Rôle                                                     | Déploiement Vercel                 |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------- |
| `main`                        | Production (aucun push direct, merge par PR uniquement)  | Production                         |
| `recette`                     | Modifications de contenu des bénévoles (Pages CMS)       | Préproduction stable de la branche |
| `contenu/*`                   | Demandes confiées à `@claude`, fusionnées dans `recette` | (vues sur la recette)              |
| `feat/*`, `fix/*`, `claude/*` | Évolutions                                               | Préproduction par PR               |

Circuit :

1. Créer une branche et ouvrir une PR.
2. Vercel publie la préproduction et met son lien dans la PR.
3. Le bureau relit sur la préproduction.
4. Merge dans `main` : la production est mise à jour.

Fusion : _Squash and merge_ pour les branches de travail ; _Create a merge commit_ pour `recette` → `main`, sans supprimer `recette` (détails dans [AGENTS.md](AGENTS.md)).

## Modifier le contenu

- **Bénévoles** : [Pages CMS](https://app.pagescms.org), sur la branche `recette`.
- **Avec Claude** : dans VS Code (Claude Code), ou en ouvrant une issue « Demande de modification » sur GitHub avec `@claude`. Claude réalise la modification (ou pose ses questions s'il a un doute), qui arrive automatiquement sur la recette. Le lien direct pour la relire est donné dans l'issue (circuit détaillé dans [AGENTS.md](AGENTS.md)).
- **À la main** :
  - pages : `src/content/pages/` (une page = un fichier, son nom donne l'URL) ;
  - bulletins : `src/content/bulletins/` (un fichier par numéro) ;
  - actualités : `src/content/actualites/` ;
  - cartes postales : `src/content/galeries/cartes-postales.yml` ;
  - accueil : `src/data/accueil.yml`.
- **Médias** : dans `public/medias/AAAA/MM/`, puis `npm run medias:optimiser` pour alléger les fichiers lourds.

## Liens

- Production (provisoire, avant bascule du domaine) : https://amis-etanglaville.vercel.app
- Recette : https://amis-etanglaville-git-recette-amis-etang-la-ville.vercel.app
- Canevas de design : [`design/canevas.html`](design/canevas.html) et [`design/composants.md`](design/composants.md)
