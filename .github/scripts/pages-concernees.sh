#!/usr/bin/env bash
# Liste, en Markdown, les pages du site touchées entre deux branches, avec leur lien sur la
# préproduction. Utilisé par vers-recette.sh (issue @claude) et mise-en-production.sh (PR recette → main).
#
# Usage : pages-concernees.sh BASE TETE PREPROD   (variables attendues : GH_TOKEN, GH_REPO)
# Une page supprimée est listée sans lien. Rien n'est affiché s'il n'y a aucune différence.
set -euo pipefail

base=$1
tete=$2
preprod=$3

page() { # page STATUT CHEMIN LIBELLÉ
  if [ "$1" = removed ]; then echo "- Supprimée : $2"; else echo "- [${3:-$2}]($preprod$2)"; fi
}

gh api "repos/$GH_REPO/compare/$base...$tete" --jq '.files[] | "\(.status) \(.filename)"' |
  while read -r statut f; do
    case "$f" in
      (src/content/pages/*.md) s=${f#src/content/pages/}; page "$statut" "/${s%.md}/" ;;
      (src/content/actualites/*.md) s=${f#src/content/actualites/}; page "$statut" "/actualites/${s%.md}/" ;;
      (src/content/bulletins/*) page modified /bulletins/ ;;
      (src/content/galeries/*) page modified /cartes-postales-historiques/ ;;
      (src/data/accueil.yml) page modified / Accueil ;;
      (src/data/menu.yml | src/data/site.yml) echo "- Menu ou pied de page (toutes les pages) : [accueil]($preprod/)" ;;
      (public/medias/*) ;; # images : visibles dans les pages ci-dessus
      (*) echo "- Fichier technique : \`$f\`" ;;
    esac
  done | sort -u
