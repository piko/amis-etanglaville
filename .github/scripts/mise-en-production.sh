#!/usr/bin/env bash
# Tient à jour la PR « Mise en production » (recette → main) et resynchronise la recette après
# chaque arrivée sur main (appelé par .github/workflows/mise-en-production.yml).
#
# Variables attendues : REF (branche poussée), SHA (commit poussé), PREPROD, GH_TOKEN, GH_REPO.
#
# 1. Sur main : resynchronise recette avec main (avance rapide si possible, sinon merge commit), et
#    signale dans la PR une fusion recette → main faite en « squash » (elle ferait diverger les branches).
# 2. Ouvre, met à jour ou ferme la PR recette → main selon qu'il reste des modifications à publier, et
#    lance la CI sur recette pour que la PR porte une vérification.
#
# Jeton : GITHUB_TOKEN. La PR ouverte (ou mise à jour par un push du GITHUB_TOKEN) crée des exécutions
# « pull_request » de la CI en attente d'approbation, sans job
# (https://docs.github.com/en/actions/concepts/security/github_token). Elles sont supprimées à l'étape 3 :
# la vérification de la PR est celle lancée explicitement sur recette.
set -euo pipefail

BASE=main
RECETTE=recette

# 1. Resynchronisation de la recette après une arrivée sur main
if [ "$REF" = "$BASE" ]; then
  pr_fusionnee=$(gh api "repos/$GH_REPO/commits/$SHA/pulls" \
    --jq ".[] | select(.head.ref == \"$RECETTE\" and .base.ref == \"$BASE\") | .number")
  parents=$(gh api "repos/$GH_REPO/commits/$SHA" --jq '.parents | length')
  if [ -n "$pr_fusionnee" ] && [ "$parents" = 1 ]; then
    gh pr comment "$pr_fusionnee" --body "⚠️ Cette mise en production a été fusionnée en « Squash » au lieu de « Create a merge commit ». Le site est bien à jour, mais l'historique de la recette diverge de main. La recette vient d'être resynchronisée ; la prochaine fois, choisir **Create a merge commit**." >/dev/null
  fi

  etat=$(gh api "repos/$GH_REPO/compare/$RECETTE...$BASE" --jq .status)
  case "$etat" in
    (ahead) # recette est un ancêtre de main : simple avance rapide
      gh api -X PATCH "repos/$GH_REPO/git/refs/heads/$RECETTE" -f sha="$SHA" -F force=false >/dev/null
      echo "Recette avancée sur main ($SHA)." ;;
    (diverged)
      erreur=$(mktemp)
      if ! gh api -X POST "repos/$GH_REPO/merges" -f base="$RECETTE" -f head="$BASE" \
        -f commit_message="Resynchronisation de recette avec main" >/dev/null 2>"$erreur"; then
        cat "$erreur" >&2
        echo "::error::Resynchronisation de recette impossible (conflit avec main ?) : à faire à la main (git switch recette && git pull && git merge main && git push)."
        exit 1
      fi
      echo "Main fusionnée dans recette." ;;
    (*) echo "Recette déjà à jour avec main ($etat)." ;;
  esac
  # Le push fait avec le GITHUB_TOKEN ne déclenche pas le déploiement de secours de la recette.
  case "$etat" in
    (ahead | diverged)
      gh workflow run deploiement-secours.yml --ref "$RECETTE" ||
        echo "::warning::Déploiement de secours de la recette non lancé." ;;
  esac
fi

# 2. PR « Mise en production »
nb_fichiers=$(gh api "repos/$GH_REPO/compare/$BASE...$RECETTE" --jq '.files | length')
pr=$(gh pr list --base "$BASE" --head "$RECETTE" --state open --json number --jq '.[0].number // empty')

if [ "$nb_fichiers" = 0 ]; then
  if [ -n "$pr" ]; then
    gh pr close "$pr" --comment "Plus rien à mettre en production : la recette est identique au site en ligne." >/dev/null
    echo "PR #$pr fermée : rien à publier."
  else
    echo "Rien à publier."
  fi
  exit 0
fi

pages=$(bash "$(dirname "$0")/pages-concernees.sh" "$BASE" "$RECETTE" "$PREPROD")
# Origine des modifications : commits « … (#n° issue) » (fusions de vers-recette.sh) et « … (via Pages
# CMS) » de la recette, retenus seulement si un de leurs fichiers reste à publier (une demande ajoutée
# puis retirée n'apparaît donc pas).
a_publier=$(gh api "repos/$GH_REPO/compare/$BASE...$RECETTE" --jq '.files[].filename')
demandes=""
pages_cms=0
while read -r sha sujet; do
  case "$sujet" in (*"(#"[0-9]*")" | *"(via Pages CMS)") ;; (*) continue ;; esac
  fichiers=$(gh api "repos/$GH_REPO/commits/$sha" --jq '.files[].filename')
  grep -qxF -f <(echo "$a_publier") <<<"$fichiers" || continue
  case "$sujet" in
    (*"(via Pages CMS)") pages_cms=$((pages_cms + 1)) ;;
    (*) n=${sujet##*"(#"}; demandes="$demandes #${n%)}" ;;
  esac
done < <(gh api "repos/$GH_REPO/compare/$BASE...$RECETTE" --jq '.commits[] | "\(.sha) \(.commit.message | split("\n")[0])"')
demandes=$(tr ' ' '\n' <<<"$demandes" | grep . | sort -u -t'#' -k2n | paste -sd' ' - || true)

corps=$(
  cat <<EOF
## Ce qui partira en production

À relire sur la préproduction de la recette ($PREPROD) :

${pages:-- (aucune page identifiée automatiquement)}

$([ -n "$demandes" ] && echo "Demandes à l'origine : $demandes.")
$([ "$pages_cms" -gt 0 ] && echo "Modifications faites dans Pages CMS : $pages_cms.")

## Pour mettre en production

1. Relire chaque page ci-dessus sur la préproduction.
2. En bas de cette page, choisir **Create a merge commit** (et non « Squash and merge »), puis cliquer sur **Merge pull request**.

Le site en ligne est mis à jour en quelques minutes, et la recette est resynchronisée automatiquement.

---
_PR tenue à jour automatiquement à chaque modification de la recette (\`.github/workflows/mise-en-production.yml\`)._
EOF
)

if [ -z "$pr" ]; then
  url=$(gh pr create --base "$BASE" --head "$RECETTE" --title "Mise en production" --body "$corps")
  pr=${url##*/}
  echo "PR #$pr ouverte."
else
  gh pr edit "$pr" --body "$corps" >/dev/null
  echo "PR #$pr mise à jour."
fi

# 3. Vérification de la PR : CI lancée explicitement sur recette (son résultat porte sur le commit de
# tête de la PR), puis suppression des exécutions « pull_request » en attente d'approbation (voir l'en-tête).
gh workflow run ci.yml --ref "$RECETTE" || echo "::warning::CI non lancée sur $RECETTE."
sleep 10
for id in $(gh run list --workflow ci.yml --branch "$RECETTE" --event pull_request --limit 50 \
  --json databaseId,status,conclusion \
  --jq '.[] | select(.status == "action_required" or .conclusion == "action_required") | .databaseId'); do
  gh api -X DELETE "repos/$GH_REPO/actions/runs/$id" >/dev/null ||
    echo "::warning::Exécution $id de la CI non supprimée."
done
