# Site des Amis de L'Étang-la-Ville (CDPS) : architecture

Document de référence pour lancer le développement dans VS Code, et pour toute personne (ou IA) qui reprendra le site.

> État : cadrage du 17/10/2026. Socle initialisé le 17/10/2026 (Astro 7.4, Tailwind 4.3). Design du canevas (piste A) appliqué et migration du contenu réalisée le 17/10/2026 (§14). Les choix ouverts sont listés en fin de document.

---

## 1. Objectifs

| Objectif                                   | Réponse technique                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Reprise facile par quelqu'un d'autre       | Technos très répandues (Astro, Markdown, GitHub), code proche du HTML, ce document, `AGENTS.md` |
| Design refaisable facilement               | Design isolé dans les composants et un fichier de thème, jamais dans le contenu                 |
| Contenu modifiable par un humain ou une IA | Markdown/YAML dans Git, édité via Pages CMS (humains) ou par PR (Claude)                        |
| Déploiement simple et recette              | Vercel : production sur `main`, préproduction automatique pour chaque branche ou PR             |
| Coût et sécurité                           | Site 100 % statique : pas de base de données, pas de serveur à maintenir, hébergement gratuit   |

---

## 2. Vue d'ensemble

```
 Bénévole ──► Pages CMS ──┐
                          ├──► GitHub (dépôt) ──► Vercel ──► amis-letanglaville.org
 Bureau / Alexis ─► Claude┘        │                │
   (issue @claude, Claude Code)    │                └─► URL de recette par branche/PR
                                   └─► PR : relecture humaine, puis merge sur main
```

Règle d'or : **rien n'arrive en production sans passer par une PR relue sur la recette.**

---

## 3. Stack

| Brique             | Choix                                                                     | Rôle                                                        |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Générateur         | **Astro** (v7 au 17/10/2026, prendre la dernière stable)                  | Transforme Markdown et gabarits en pages HTML statiques     |
| Style              | **Tailwind CSS v4** (plugin Vite `@tailwindcss/vite`)                     | Classes utilitaires + thème centralisé (`@theme`)           |
| Contenu            | Markdown + front matter YAML, **content collections** Astro (schémas Zod) | Contenu typé et validé à la construction                    |
| CMS                | **Pages CMS** (app.pagescms.org, connexion GitHub)                        | Interface d'édition pour les bénévoles, écrit dans le dépôt |
| Hébergement        | **Vercel** (plan Hobby au départ)                                         | Build + CDN + recette par branche                           |
| Code               | **GitHub**, dépôt **public**                                              | Source unique de vérité                                     |
| IA                 | **Claude** : Claude Code (poste) + GitHub Action `@claude`                | Évolutions, contenu, corrections par PR                     |
| Recherche (option) | Pagefind                                                                  | Recherche plein texte statique                              |
| SEO                | `@astrojs/sitemap`, balises meta, redirections                            | Référencement conservé                                      |

Prérequis poste : Node.js LTS (≥ 22), Git, GitHub CLI (`gh`), VS Code, Claude Code.

Extensions VS Code conseillées : _Astro_, _Tailwind CSS IntelliSense_, _Prettier_, _YAML_, _markdownlint_.

---

## 4. Comptes et accès

Phase 1 (démarrage) : tout est sur le **compte personnel d'Alexis**.

| Service                          | Compte                                                | Remarque                                                    |
| -------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| GitHub                           | Perso (`piko`), dépôt public `piko/amis-etanglaville` | Public depuis le 25/10/2026 (voir ci-dessous)               |
| Vercel                           | Team d'Alexis, plan Hobby                             | Associer le dépôt GitHub perso                              |
| Pages CMS                        | Connexion GitHub perso                                | Installer l'app GitHub Pages CMS sur le seul dépôt          |
| Claude                           | Jeton d'abonnement (`CLAUDE_CODE_OAUTH_TOKEN`)        | Lié à Alexis, à remplacer par une clé API de l'asso à terme |
| Domaine `amis-letanglaville.org` | Registrar actuel (à identifier)                       | DNS vers Vercel à la mise en production                     |

**Dépôt public depuis le 25/10/2026.** Il a démarré en privé (décision du 17/10/2026). Sur l'offre Vercel Hobby, il **doit rester public** : revenir en privé bloquerait à nouveau les déploiements décrits ci-dessous. Historique des limites du dépôt privé :

- **GitHub Free ne protège pas `main` sur un dépôt privé.** Compensation : hook `.githooks/pre-push` (activé par `npm install`) qui refuse tout push direct sur `main`, règle `deny` dans `.claude/settings.json`, règle n°1 de `AGENTS.md`. Le dépôt public permet désormais la protection de `main` (voir « Configuration Vercel »).
- **Vercel Hobby et dépôt privé : seuls le propriétaire de la Team et les bots peuvent déclencher un déploiement.** Les commits d'un autre humain (bénévole via Pages CMS, autre membre du bureau) sont bloqués : la collaboration n'est pas permise sur Hobby ([KB Vercel](https://vercel.com/kb/guide/commits-not-triggering-deployments)). Les commits de bots passent : constaté le 23/10/2026 sur la recette, avec une fusion signée `github-actions[bot]` déployée normalement (issue #13). Les commits faits en local par Claude Code passent aussi, car ils portent l'identité git d'Alexis (e-mail vérifié sur `piko`).
- ⇒ Décision du 23/10/2026 : **le dépôt reste privé**. `@claude` fonctionne (commits de bots). Pour ouvrir Pages CMS aux bénévoles, il faudra passer Vercel en Pro ou rendre le dépôt public. Le dépôt public lève aussi la limite de minutes GitHub Actions et permet la protection de `main` (merge par PR, CI verte requise). Il ne contient aucun secret : les jetons sont dans les secrets GitHub et Vercel.
- ⇒ Le 25/10/2026, la PR « Mise en production » #28, fusionnée par un membre du bureau sans compte Vercel, n'a pas été déployée (« Git author … must have access to the project on Vercel »), ni par Vercel ni par le Deploy Hook : un hook construit le dernier commit de la branche, et son auteur est contrôlé de la même façon. **Le dépôt est passé en public** le jour même, et le déploiement est reparti.

Phase 2 (transfert à l'association), à planifier :

- créer une organisation GitHub et une équipe Vercel avec une adresse générique (ex. `comite-ca@…`) ;
- transférer le dépôt (GitHub conserve l'historique et redirige l'ancienne URL) ;
- **point d'attention** : sur Vercel Hobby, le déploiement d'un dépôt _privé appartenant à une organisation GitHub_ nécessite en principe le plan Pro (à vérifier au moment du transfert). Options : rendre le dépôt public, garder le dépôt sur un compte utilisateur dédié à l'asso, ou passer en Pro ;
- remplacer le jeton Claude perso par une clé API Claude Console de l'asso, avec un plafond mensuel ;
- usage commercial sur Hobby : les dons sont explicitement autorisés. Les adhésions payantes et la page « Les Produits » sont une zone grise : demander une confirmation écrite au support Vercel.

---

## 5. Arborescence cible du dépôt

```
amis-etanglaville/
├─ ARCHITECTURE.md            ← ce document
├─ AGENTS.md                  ← règles pour toute IA (Claude, Codex…)
├─ CLAUDE.md                  ← renvoie vers AGENTS.md (+ spécificités Claude)
├─ README.md                  ← démarrage rapide (install, dev, build)
├─ .pages.yml                 ← configuration Pages CMS
├─ astro.config.mjs
├─ package.json
├─ vercel.json                ← redirections des anciennes URL WordPress
├─ .github/
│  ├─ workflows/claude.yml    ← @claude dans issues/PR
│  └─ ISSUE_TEMPLATE/demande-modification.yml
├─ public/
│  ├─ medias/                 ← images et PDF (AAAA/MM/fichier, même chemin que WordPress)
│  └─ favicon.svg
├─ scripts/
│  ├─ import-wordpress.mjs    ← _import → src/content (une seule fois)
│  └─ download-medias.mjs     ← télécharge data/medias.txt → public/medias
├─ src/
│  ├─ content.config.ts       ← déclaration des collections + schémas
│  ├─ content/
│  │  ├─ pages/               ← pages fixes (*.md)
│  │  ├─ bulletins/           ← un fichier par bulletin (*.md, souvent sans corps)
│  │  ├─ actualites/          ← salons, AG, portes ouvertes (*.md)
│  │  └─ galeries/            ← cartes postales, etc. (*.yml)
│  ├─ data/
│  │  ├─ menu.yml             ← menu principal (éditable dans Pages CMS)
│  │  └─ site.yml             ← nom, adresse, e-mail, liens PayAsso, réseaux
│  ├─ styles/
│  │  └─ global.css           ← @import "tailwindcss" + @theme (tokens de design)
│  ├─ layouts/
│  │  ├─ Base.astro           ← <html>, <head>, SEO, Header, Footer
│  │  └─ Page.astro           ← gabarit page de texte
│  ├─ components/             ← Header, Menu, Footer, Hero, CarteBulletin, Galerie, AppelAdhesion…
│  └─ pages/                  ← routes Astro
│     ├─ index.astro          ← page d'accueil sur mesure
│     ├─ [...slug].astro      ← pages fixes (collection pages)
│     ├─ bulletins/index.astro
│     ├─ actualites/index.astro + [slug].astro
│     └─ 404.astro
└─ _import/                   ← export brut de l'ancien site (à supprimer après migration)
```

---

## 6. Modèle de contenu

### 6.1 `pages` (pages fixes)

`src/content/pages/<slug>.md`, et l'URL est `/<slug>/`. Les slugs WordPress sont conservés.

```yaml
---
title: 'Un peu d’histoire' # obligatoire
description: "Seigneurs, Révolution, maires de l'Étang…" # SEO, optionnel
parent: notre-village # optionnel : rubrique
order: 10 # optionnel : tri dans la rubrique
image: /medias/2019/01/S%C3%A9guie-Charles_Le_Brun.jpg # optionnel : vignette / partage
wp_id: 392 # ancienne page WordPress (redirections)
updated: 2026-10-08
draft: false
---
Texte en Markdown…
```

### 6.2 `bulletins`

`src/content/bulletins/<numero>.md`, extraits des pages « Bulletins » et « Bulletins 1 et 2 ».

```yaml
---
numero: 134
title: 'Bulletin n°134'
date: 2025-11-01 # mois de parution
pdf: /medias/2026/01/Bulletin-134-Nov-2025-s.pdf
cover: /medias/…/couverture-134.webp # optionnel
type: bulletin # bulletin | flash-info
disponible: true # false = « en attente » (pas de PDF)
---
Sommaire ou résumé (optionnel).
```

La page `/bulletins/` est générée automatiquement, triée par numéro décroissant et groupée par décennie. La page d'accueil affiche le dernier bulletin.

### 6.3 `actualites`

`src/content/actualites/AAAA-MM-JJ-<slug>.md` : remplace le « Blog » vide de WordPress.

```yaml
---
title: 'Salon des Arts 2026'
date: 2026-11-06
dateFin: 2026-11-09 # optionnel (événement sur plusieurs jours)
lieu: 'Salle Fonton'
categorie: salon # salon | portes-ouvertes | ag | environnement | autre
image: /medias/2026/10/affiche-salon-arts.webp
draft: false
---
```

### 6.4 `galeries`

`src/content/galeries/cartes-postales.yml` : la page « Cartes postales historiques » (184 images) devient une galerie structurée par sections.

```yaml
title: 'Cartes postales historiques'
sections:
  - titre: 'La forêt'
    images:
      - src: /medias/2019/06/310-For%C3%AAt-Place-Royale.jpg
        legende: 'Forêt Place Royale'
```

### 6.5 Données globales

- `src/data/menu.yml` : entrées `title` et `link` (slug), avec `children` éventuels. La base est `_import/data/menu.yml`.
- `src/data/site.yml` : nom de l'asso, adresse du siège, e-mail de contact, URL PayAsso (adhésion, don), lien Facebook « Les arbres de l'Étang la Ville ».

### 6.6 Médias

- Dossier `public/medias/AAAA/MM/fichier`, servi en `/medias/AAAA/MM/fichier`. On garde les chemins WordPress pour simplifier la réécriture des liens.
- Les images sont optimisées au build avec `astro:assets` quand elles sont utilisées par un composant. Les images insérées dans le Markdown restent servies telles quelles.
- Les PDF lourds (bulletins) sont à surveiller : vérifier les limites de taille de fichier et de déploiement Vercel. En cas de dépassement, externaliser vers un stockage objet.

---

## 7. Gabarits et composants

| Élément             | Fichier                       | Notes                                                                                                                                       |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil             | `src/pages/index.astro`       | Sur mesure : Hero (tableau de Vuillard), chiffres clés (1960, salons, bulletins), dernier bulletin, prochaines actualités, appel à adhésion |
| Page de texte       | `layouts/Page.astro`          | Titre, fil d'Ariane, sommaire auto si plus de 3 titres, contenu, navigation de rubrique                                                     |
| Liste des bulletins | `pages/bulletins/index.astro` | Grille de cartes (couverture, n°, date, lien PDF)                                                                                           |
| Actualités          | `pages/actualites/*`          | Liste et détail, avec séparation entre événements à venir et passés                                                                         |
| Galerie             | `components/Galerie.astro`    | Grille et visionneuse (lightbox légère), légendes, navigation clavier                                                                       |
| Menu                | `components/Menu.astro`       | Alimenté par `menu.yml`, sous-menus, version mobile accessible                                                                              |
| Pied de page        | `components/Footer.astro`     | Adresse, contact, adhésion, liens partenaires (JADE, CADEB…)                                                                                |

Principes : HTML sémantique, accessibilité (contrastes, focus visible, `alt`), pas de JS sauf besoin réel (menu mobile, lightbox).

---

## 8. Design system

Tous les choix visuels sont dans `src/styles/global.css`. Ses tokens `@theme` reprennent le canevas piste A « La Gazette du village » (validé le 17/10/2026) :

- couleurs : `papier` (fond), `creme`, `pierre`, `filet`, `encre`, `nuit`, `gris`, `foret`, `foret-fonce`, `mousse`, `ocre`, `ocre-fonce`, `sepia` ;
- typographies : `titre` (Newsreader) et `texte` (Public Sans) ;
- mise en page : `max-w-site` (1200 px), `max-w-texte` (46rem), `tracking-surtitre`, ombres `shadow-carte` et `shadow-carte-survol`.

Les polices sont déclarées dans `astro.config.mjs` (API Fonts d'Astro, fournisseur Google). Elles sont téléchargées au build et servies par le site : aucune requête vers Google côté visiteur. Newsreader inclut son axe optique (`opsz` de 6 à 72).

```css
@theme {
  --color-papier: #f4f0e6;
  --color-foret: #1f5b3f;
  /* … */
  --font-titre: var(--font-newsreader);
  --font-texte: var(--font-public-sans);
}
```

Pour refaire le design : modifier ces tokens et les composants de `src/components/`. Ne jamais mettre de style dans le contenu Markdown.

Le texte Markdown est mis en forme avec le plugin `@tailwindcss/typography` (classe `prose`), ajusté au thème.

---

## 9. Pages CMS

Fichier `.pages.yml` à la racine (brouillon, à valider à l'initialisation avec la documentation Pages CMS) :

```yaml
media:
  input: public/medias
  output: /medias

content:
  - name: pages
    label: Pages
    type: collection
    path: src/content/pages
    fields:
      - { name: title, label: Titre, type: string, required: true }
      - { name: description, label: Résumé (référencement), type: text }
      - { name: parent, label: Rubrique, type: string }
      - { name: order, label: Ordre, type: number }
      - { name: image, label: Image de partage, type: image }
      - { name: draft, label: Brouillon, type: boolean }
      - {
          name: body,
          label: Contenu,
          type: rich-text,
          options: { format: markdown },
        }

  - name: bulletins
    label: Bulletins
    type: collection
    path: src/content/bulletins
    fields:
      - { name: numero, label: Numéro, type: number, required: true }
      - { name: title, label: Titre, type: string }
      - { name: date, label: Date de parution, type: date }
      - { name: pdf, label: Fichier PDF, type: file }
      - { name: cover, label: Couverture, type: image }
      - { name: disponible, label: Disponible, type: boolean }

  - name: actualites
    label: Actualités
    type: collection
    path: src/content/actualites
    fields:
      - { name: title, label: Titre, type: string, required: true }
      - { name: date, label: Date, type: date }
      - { name: dateFin, label: Date de fin, type: date }
      - { name: lieu, label: Lieu, type: string }
      - { name: image, label: Affiche / photo, type: image }
      - { name: draft, label: Brouillon, type: boolean }
      - {
          name: body,
          label: Texte,
          type: rich-text,
          options: { format: markdown },
        }

  - name: menu
    label: Menu
    type: file
    path: src/data/menu.yml
    # champs : liste d'objets { title, link, children }

  - name: site
    label: Infos de l'association
    type: file
    path: src/data/site.yml
```

Règles d'usage :

- les bénévoles travaillent sur la branche **`recette`** (branche sélectionnée dans Pages CMS), jamais sur `main` ;
- noms de fichiers : slug en minuscules, sans accents ;
- les libellés des champs sont en français. Les noms techniques (`name`) restent stables, car ils sont liés aux schémas Astro.

Les schémas Zod de `src/content.config.ts` et les champs de `.pages.yml` doivent rester alignés. Toute modification de l'un s'accompagne de l'autre, et cette règle figure dans `AGENTS.md`.

---

## 10. Branches, recette et déploiement

| Branche              | Rôle                                                   | Déploiement Vercel                                            |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `main`               | Production                                             | `amis-letanglaville.org` (à la bascule), sinon `*.vercel.app` |
| `recette`            | Modifications de contenu des bénévoles (Pages CMS)     | URL stable de branche (`…-git-recette-….vercel.app`)          |
| `contenu/*`          | Demandes `@claude` (issues), fusionnées dans `recette` | Vues sur la recette                                           |
| `feat/*`, `claude/*` | Évolutions (dev, Claude)                               | Préproduction par PR                                          |

Circuit :

1. Une modification est faite sur `recette` ou sur une branche de fonctionnalité.
2. Vercel publie la préproduction, et son lien apparaît dans la PR.
3. Le bureau relit sur la préproduction.
4. La PR est fusionnée dans `main`, et la production est mise à jour automatiquement.

Pour la recette, la PR `recette` → `main` (« Mise en production ») est tenue à jour par `.github/workflows/mise-en-production.yml` (`.github/scripts/mise-en-production.sh`). Il se déclenche à chaque push sur `recette` ou `main`, et par `workflow_dispatch` depuis `vers-recette.sh`, car les fusions faites avec le `GITHUB_TOKEN` ne déclenchent pas `push`. Ce workflow :

- ouvre la PR quand la recette contient des modifications à publier, met à jour sa description (pages concernées avec leur lien sur la préproduction, issues d'origine, nombre de modifications Pages CMS), et la ferme quand il n'y a plus rien à publier ;
- lance la CI sur `recette` pour que la PR porte une vérification, puis supprime les exécutions `pull_request` en attente d'approbation que crée une PR ouverte avec le `GITHUB_TOKEN` ;
- après chaque arrivée sur `main`, resynchronise `recette` (avance rapide, sinon merge commit), et signale dans sa PR une mise en production fusionnée en squash.

Prérequis : « Allow GitHub Actions to create and approve pull requests » (Settings > Actions > General).

Configuration Vercel :

- framework « Astro », commande `npm run build`, dossier `dist` ;
- **Deployment Protection** : par défaut, les préproductions demandent une connexion Vercel. Pour que le bureau relise sans compte, désactiver la protection des previews (le contenu est public de toute façon) ;
- protéger `main` dans GitHub (merge par PR uniquement, CI et build Vercel verts requis), possible depuis le passage en public. Ça empêche aussi Pages CMS d'écrire directement sur `main`. Tant que ce n'est pas fait, le hook `pre-push` fait office de garde-fou en local (voir §4) ;
- tant que le domaine n'a pas basculé, toutes les pages portent `noindex`. À la bascule, définir `PUBLIC_INDEXABLE=true` dans les variables d'environnement Vercel (Production) ;
- **rebuild quotidien** : le statut « à venir » / « passé » des actualités (accueil, liste, fiches) est calculé au build. Le workflow `.github/workflows/rebuild-quotidien.yml` redéploie la production chaque nuit (3 h 15 UTC) via un Deploy Hook Vercel, pour qu'un événement terminé ne reste pas plus de 24 h à la une. Configuration : créer le hook sur `main` (Settings > Git > Deploy Hooks) et enregistrer son URL dans le secret GitHub `VERCEL_DEPLOY_HOOK`. Lancement manuel possible depuis l'onglet Actions. Sur un dépôt public, GitHub suspend les workflows programmés après 60 jours sans commit : le réactiver si besoin.

Redirections : `npm run redirects` régénère `vercel.json` à partir des `wp_id` du front matter de `src/content/pages`. À relancer après tout renommage ou déplacement de page.

Redirections dans `vercel.json` (anciennes URL `?page_id=N` vers les nouveaux slugs) :

```json
{
  "redirects": [
    {
      "source": "/",
      "has": [{ "type": "query", "key": "page_id", "value": "392" }],
      "destination": "/un-peu-dhistoire/",
      "permanent": true
    }
  ]
}
```

Une ligne par page : la correspondance `wp_id` → slug est dans le front matter de `_import/content/pages/*.md`. Les URL de médias `/wp-content/uploads/*` sont aussi redirigées vers `/medias/*`.

---

## 11. IA (Claude)

- **`AGENTS.md`** (lu par toute IA) : structure du dépôt, conventions de contenu, règles (pas de style dans le Markdown, schémas alignés avec `.pages.yml`, ne pas toucher au design sans demande, toujours passer par une PR, vérifier `npm run build` avant de pousser).
- **`CLAUDE.md`** : `@AGENTS.md` et les spécificités Claude.
- **GitHub Action** `anthropics/claude-code-action@v1` (`.github/workflows/claude.yml`) :
  - installation : `claude` dans le dépôt, puis `/install-github-app`, option « abonnement » ;
  - secret : `CLAUDE_CODE_OAUTH_TOKEN` (via `claude setup-token`), à remplacer par `ANTHROPIC_API_KEY` de l'asso en phase 2 ;
  - déclenchement : `@claude` dans une issue ou une PR, réservé aux membres qui ont l'accès en écriture ;
  - issues : job `realisation` sur « @claude » (issue ou commentaire), qui travaille sur une branche `contenu/<n°>-<titre>` partie de `recette`. En cas de doute, Claude pose sa question et renvoie `travail_termine=false` (sortie `--json-schema`) : rien n'est intégré ;
  - arrivée sur la recette : job `vers-recette` (`.github/scripts/vers-recette.sh`) qui lance la CI sur la branche (`workflow_dispatch`, seul événement que le `GITHUB_TOKEN` peut déclencher), attend qu'elle soit verte et fusionne la branche dans `recette` en merge commit par l'API `merges`, **sans PR intermédiaire**. Une telle PR ne serait relue par personne, et une PR ouverte avec le `GITHUB_TOKEN` crée une exécution de la CI en attente d'approbation, qui finit en échec à la fusion. Il attend ensuite le déploiement Vercel du commit de fusion (statut de commit « Vercel » posé par Vercel, permission `statuses: read`), puis donne dans l'issue le lien direct vers les pages concernées. Conflits, CI rouge et incidents sont signalés dans l'issue ;
  - PR : action directe sur la branche de la PR ;
  - modèle `sonnet`, rapport d'exécution dans le résumé du run (`display_report`) ;
  - garde-fous : `--max-turns`, `timeout-minutes` sur le job ;
  - dépôt public : les minutes GitHub Actions ne sont pas décomptées.
- **Modèle d'issue** « Demande de modification » : page concernée, modification souhaitée, pièces jointes, date de mise en ligne. Son texte d'aide explique le circuit « @claude » → recette → lien de relecture dans l'issue.

---

## 12. Fonctions annexes

| Besoin           | Solution                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Adhésion, dons   | Liens PayAsso existants (`payasso.fr/cdps/cotisations`, `payasso.fr/CDPS/DONS`)                                  |
| Contact          | `mailto:comite-ca@amis-letanglaville.org`. Formulaire optionnel via Tally (Vercel n'a pas de formulaires natifs) |
| Carte des arbres | Intégration de la carte Google My Maps (URL publique à récupérer)                                                |
| Recherche        | Pagefind (index généré au build), optionnel                                                                      |
| Statistiques     | Vercel Web Analytics (sans cookie), optionnel. Pas de bandeau cookies nécessaire si aucun traceur                |
| Newsletter       | Hors périmètre initial (les e-mails de la vice-présidente). À étudier (Brevo)                                    |

---

## 13. Qualité

- `npm run build` doit passer : il valide les schémas de contenu.
- Prettier pour le formatage (`.astro`, `.md`, `.yml`).
- Contrôle des liens cassés (internes et PDF) en CI, à ajouter après la migration des médias.
- Accessibilité : objectif WCAG AA, vérifié avec Lighthouse ou axe sur les gabarits principaux.
- SEO : `sitemap.xml`, `robots.txt`, balises `title`/`description`/Open Graph, redirections 301.

---

## 14. Migration du contenu (`_import/` → `src/content/`)

> Réalisée le 17/10/2026 (étapes 1 à 7). Les noms de médias contenant des accents, des espaces ou « ° » ont été translittérés (`Séguie-Charles_Le_Brun.jpg` → `Seguie-Charles_Le_Brun.jpg`). Les PDF lourds ont été recompressés avec Ghostscript, et les marges de scan de 24 cartes postales rognées. Les couvertures de bulletins sont tirées de la première page des PDF. Les actualités 2019-2023 viennent des bilans annuels (`A3-Archives-*.pdf`) et du compte rendu de l'AG 2023.

Source : `_import/` (export WordPress du 17/10/2026 : 21 pages, menu, 308 médias). Voir `_import/README.md` pour les anomalies relevées.

1. **Pages** : copier `_import/content/pages/*.md` dans `src/content/pages/`, en adaptant le front matter (`modified` devient `updated`, `type` et `slug` sont supprimés car le slug vient du nom de fichier, `wp_id` est conservé).
2. **Bulletins** : transformer les listes de `bulletins.md` et `bulletins-1-et-2.md` en un fichier par bulletin dans `src/content/bulletins/`. Les pages d'origine sont remplacées par la page générée. Corriger le lien du bulletin 82 (il pointe vers le PDF du 85).
3. **Cartes postales** : convertir `cartes-postales-historiques.md` en `src/content/galeries/cartes-postales.yml`.
4. **Menu** : `_import/data/menu.yml` devient `src/data/menu.yml`.
5. **Médias** : `scripts/download-medias.mjs` lit `_import/data/medias.txt`, télécharge chaque fichier dans `public/medias/AAAA/MM/` en conservant le nom, puis remplace dans tout `src/content` le préfixe `https://amis-letanglaville.org/wp-content/uploads/` par `/medias/`. Le script ne doit pas réécraser un fichier existant et doit produire un rapport des échecs.
6. **Blog** : l'article « Lorem ipsum » n'est pas repris.
7. **Contrôles** : build OK, aucun lien vers `amis-letanglaville.org/wp-content` restant, comparaison visuelle page par page avec l'ancien site.
8. Supprimer `_import/` une fois la migration validée.

---

## 15. Initialisation dans VS Code (pas à pas)

```bash
cd ~/dev/amis-etanglaville
git init -b main

# 1. Astro (dans le dossier courant ; partir du starter minimal)
npm create astro@latest . -- --template minimal --typescript strict --git false

# 2. Tailwind v4 + typographie + sitemap
npx astro add tailwind
npm i -D @tailwindcss/typography prettier prettier-plugin-astro
npx astro add sitemap

# 3. Premier commit et dépôt GitHub privé
git add . && git commit -m "Initialisation Astro + Tailwind"
gh repo create amis-etanglaville --private --source . --push

# 4. Branche de recette
git switch -c recette && git push -u origin recette && git switch main
```

Ensuite :

5. Écrire `src/content.config.ts` (collections du §6), `global.css` (§8), `Base.astro`, `Page.astro` et `[...slug].astro`.
6. Lancer la migration (§14), d'abord les pages, puis les bulletins, la galerie et les médias.
7. `npm run dev` et vérifier sur http://localhost:4321.
8. Vercel : _Add New Project_, importer le dépôt, framework Astro, et désactiver la protection des previews.
9. Pages CMS : app.pagescms.org, connexion GitHub, ajouter le dépôt, ajouter `.pages.yml`, sélectionner la branche `recette`.
10. Claude : `claude` dans le dépôt, puis `/install-github-app`. Ajouter `AGENTS.md`, `CLAUDE.md` et le modèle d'issue.
11. Bascule DNS du domaine vers Vercel, après validation complète sur la recette.

Astuce : chaque étape peut être confiée à Claude Code dans le terminal VS Code, ce document servant de cahier des charges (« Implémente le §6 de ARCHITECTURE.md »).

---

## 16. Décisions ouvertes

- [ ] Charte graphique : couleurs, typographies, logo (le CDPS en a-t-il un ?). En cours dans le canevas Claude
- [ ] Nouvelle structuration des pages et du menu. En cours dans le canevas Claude (les redirections suivront via `npm run redirects`)
- [ ] Contenu de la page d'accueil et chiffres clés à afficher
- [x] Passage du dépôt en public : fait le 25/10/2026 (voir §4)
- [ ] URL du groupe Facebook « Les arbres de l'Étang la Ville » (`src/data/site.yml`) et URL publique de la carte Google My Maps
- [ ] Registrar du domaine et personne qui y a accès
- [ ] Qui, au bureau, valide les PR (accès en écriture GitHub)
- [ ] Liste des bénévoles éditeurs Pages CMS (comptes GitHub)
- [ ] Formulaire de contact (Tally) ou simple e-mail
- [ ] Calendrier et modalités du transfert à l'association (phase 2)
- [ ] Confirmation écrite de Vercel sur l'usage associatif en plan Hobby
