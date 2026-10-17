# Composants du site (piste A « La Gazette du village »)

Référence : [`canevas.html`](canevas.html), canevas validé le 17/10/2026, avec HTML et Tailwind v4. Dans le canevas, chaque composant est encadré par `<!-- Composant: Nom | props: … -->` et `<!-- /Composant: Nom -->`. Les classes et la structure sont à reprendre telles quelles dans `src/components/`.

Ouvrir un gabarit seul : `canevas.html?vue=accueil`, `texte`, `bulletins`, `actualites`, `galerie` ou `erreur`. États : `&etat=menu`, `sous-menu`, `visionneuse`.

Abréviations des gabarits : **A** accueil · **T** page de texte · **B** liste des bulletins · **N** actualités · **G** galerie · **E** page d'erreur 404.

Un astérisque (\*) signale un champ absent des schémas actuels. Il faut l'ajouter dans `src/content.config.ts` ou `src/lib/data.ts`, et aussi dans `.pages.yml`.

## Communs

| Composant       | Props                                                                                    | Alimenté par                                                                                                 | Gabarits    | Fichier prévu                             |
| --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------- |
| Entete          | `variante` (`accueil` \| `interieur`), `actif` (URL de la page courante)                 | `site.yml` (`nom`, `adhesion`, `email`)                                                                      | A T B N G E | `components/Header.astro`                 |
| Menu            | `items`, `actif`                                                                         | `menu.yml` (`title`, `link`, `children`), avec la nouvelle structure ci-dessous                              | A T B N G E | `components/Menu.astro`, `MenuList.astro` |
| Logo            | `taille` (`petit` \| `grand`), couleur via `class`                                       | SVG en dur                                                                                                   | A T B N G E | `components/Logo.astro`                   |
| Bouton          | `variante` (`primaire` \| `secondaire` \| `clair` \| `contour-clair`), `href`, `libelle` | Libellés dans les gabarits, liens dans `site.yml`                                                            | A T B N G E | `components/Bouton.astro`                 |
| PiedDePage      | aucune                                                                                   | `site.yml` (`nom`, `nomCourt`, `adresse`, `email`) ; partenaires en dur (ou `partenaires`\* dans `site.yml`) | A T B N G E | `components/Footer.astro`                 |
| BandeauAdhesion | aucune                                                                                   | `site.yml` (`adhesion`, `don`, `formulaire`\* : bulletin d'adhésion PDF)                                     | A T B N G   | `components/BandeauAdhesion.astro`        |

## Contenus

| Composant      | Props                                                                                  | Alimenté par                                                                                                                       | Gabarits | Fichier prévu                     |
| -------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| CarteBulletin  | `numero`, `date`, `pdf`, `cover`, `disponible`, `dernier`                              | Collection `bulletins` (`dernier` est calculé : numéro le plus élevé). Sans `cover`, la couverture est typographique               | A B      | `components/CarteBulletin.astro`  |
| CarteActualite | `title`, `date`, `dateFin`, `lieu`, `categorie`, `image`, `href`, `resume`, `annule`\* | Collection `actualites`. Le statut (à venir, passé) est calculé au build ; `resume` est un extrait du corps ou un champ `resume`\* | A N      | `components/CarteActualite.astro` |
| CartePostale   | `src`, `legende`, `reference`, `href`                                                  | Collection `galeries` (`images[].src`, `legende`). `reference` vient du nom de fichier (`310-…`) ou d'un champ `reference`\*       | A G E    | `components/CartePostale.astro`   |
| Hero           | `image`, `alt`, `legende`, `surtitre`, `titre`, `texte`                                | `pages/accueil.md` (`title`, `image`, corps) ; `legende`\* et `alt`\* à ajouter                                                    | A        | `components/Hero.astro`           |
| Missions       | `missions[]` (`titre`, `texte`)                                                        | En dur dans `index.astro`, ou `missions`\* dans `accueil.md`                                                                       | A        | bloc de `pages/index.astro`       |
| MemoireVillage | `themes[]` (première image, titre, nombre de cartes)                                   | Collection `galeries` (`cartes-postales` : `sections`)                                                                             | A        | bloc de `pages/index.astro`       |
| ListeSucces    | `succes[]` (`titre`, `texte`), `lien`                                                  | En dur, ou `succes`\* dans `accueil.md` (texte repris de `lassociation.md`)                                                        | A        | bloc de `pages/index.astro`       |

## Pages de texte

| Composant   | Props                                                                                  | Alimenté par                                                                                                                                               | Gabarits | Fichier prévu                  |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| FilAriane   | `items[]` (`titre`, `href`)                                                            | Collection `pages` (`parent`, `title`) ; libellés fixes pour Bulletins et Actualités                                                                       | T B N G  | `components/FilAriane.astro`   |
| EnTetePage  | `surtitre`, `title`, `description`, `updated`                                          | Collection `pages` (`title`, `description`, `updated` ; `surtitre` = titre du `parent`)                                                                    | T B N G  | `components/EnTetePage.astro`  |
| Sommaire    | `headings` (titres `h2`), affiché au-delà de 3 titres                                  | Collection `pages` (`render()` donne `headings`)                                                                                                           | T        | `components/Sommaire.astro`    |
| Contenu     | `body` (Markdown rendu, sans classe)                                                   | Collection `pages` (corps). La typographie est portée par le conteneur (`[&_h2]:…`) ; les images avec légende deviennent des `figure` via un plugin rehype | T        | slot de `layouts/Page.astro`   |
| NavRubrique | `variante` (`liste` \| `precedent-suivant`), `parent`, `pages`, `precedent`, `suivant` | Collection `pages` (`parent`, `order`)                                                                                                                     | T        | `components/NavRubrique.astro` |

## Bulletins, actualités, galerie, recherche

| Composant          | Props                                                   | Alimenté par                                                                                       | Gabarits | Fichier prévu                         |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| NavPeriodes        | `periodes[]` (`libelle`, `ancre`), `actif`              | Collection `bulletins` (regroupement par `date`)                                                   | B        | bloc de `pages/bulletins/index.astro` |
| PastillesBulletins | `numeros[]` (`numero`, `pdf`, `disponible`)             | Collection `bulletins` (numéros anciens ; `disponible: false` donne une pastille en pointillés)    | B        | bloc de `pages/bulletins/index.astro` |
| FiltresCategories  | `categories`, `actif`                                   | Collection `actualites` (`categorie` : `salon`, `portes-ouvertes`, `ag`, `environnement`, `autre`) | N        | `pages/actualites/[...page].astro`    |
| Pagination         | `page`, `total`                                         | Collection `actualites` (`paginate()` d'Astro)                                                     | N        | `components/Pagination.astro`         |
| NavThemes          | `sections[]` (`titre`, nombre d'images, ancre), `actif` | Collection `galeries` (`sections`)                                                                 | G        | `components/Galerie.astro`            |
| Galerie            | `section` (`titre`, `images[]`)                         | Collection `galeries` (`cartes-postales.yml`)                                                      | G        | `components/Galerie.astro`            |
| Visionneuse        | `images` (liens `[data-visionneuse-lien]`), `index`     | Collection `galeries` ; `<dialog>` natif avec un petit script (Échap, flèches)                     | G        | dans `components/Galerie.astro`       |
| Recherche          | `action`, `exemple`                                     | Pagefind (index généré au build, option du §12 d'ARCHITECTURE.md)                                  | E        | `components/Recherche.astro`          |

## Menu proposé (`menu.yml`)

- Accueil
- L'Association : Qui sommes-nous ? · Activités · Statuts · Adhésion et contact
- Notre village : Présentation · Un peu d'histoire · Édifices historiques · Les peintres · Les restaurants du temps passé · Les trains et le tram 13
- Bulletins
- Actualités
- Documentation : Présentation · Cartes postales historiques · La forêt et les arbres · Les arbres dans la ville · Archives
- Infos pratiques : Pyrale du buis, maladie de Lyme · Les produits

## Captures (`captures/`)

Générées depuis `canevas.html` avec Chromium, avec les polices Newsreader et Public Sans. Les images de l'ancien site n'étaient pas accessibles lors de la génération : elles apparaissent en aplat sépia, l'état de chargement prévu par le design.

| Gabarit                    | Mobile (375 px)               | Ordinateur (1280 px)                   |
| -------------------------- | ----------------------------- | -------------------------------------- |
| Accueil                    | `accueil-mobile.png`          | `accueil-ordinateur.png`               |
| Page de texte              | `texte-mobile.png`            | `texte-ordinateur.png`                 |
| Liste des bulletins        | `bulletins-mobile.png`        | `bulletins-ordinateur.png`             |
| Actualités                 | `actualites-mobile.png`       | `actualites-ordinateur.png`            |
| Galerie                    | `galerie-mobile.png`          | `galerie-ordinateur.png`               |
| Page d'erreur 404          | `erreur-mobile.png`           | `erreur-ordinateur.png`                |
| État : menu ouvert         | `etat-menu-ouvert-mobile.png` | `etat-sous-menu-ouvert-ordinateur.png` |
| État : visionneuse ouverte | `etat-visionneuse-mobile.png` | `etat-visionneuse-ordinateur.png`      |

Les captures de gabarit sont en pleine page, à une densité de 1. Les captures d'état reproduisent l'écran visible (812 px de haut en mobile, 560 ou 800 px en ordinateur).
