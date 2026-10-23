#!/usr/bin/env bash
# Fait arriver le travail de Claude sur la recette (appelé par .github/workflows/claude.yml).
# Ouvre une PR de la branche contenu/… vers recette, lance la CI, fusionne en « merge commit » une
# fois la CI verte, puis donne dans l'issue, en langage simple, le lien direct vers les pages.
#
# Variables attendues : BRANCHE, ISSUE, TITRE_ISSUE, BASE, PREPROD, DETAIL, GH_TOKEN, GH_REPO.
#
# Jeton : GITHUB_TOKEN. Une PR créée avec ce jeton ne déclenche pas la CI (règle GitHub anti-boucle),
# sauf workflow_dispatch : la CI est donc lancée explicitement sur la branche. Son résultat porte sur
# le commit de tête de la PR et vaut donc comme vérification requise.
# GitHub crée tout de même une exécution « pull_request » de la CI, en attente d'approbation et sans
# job ; elle passe en échec à la fusion. Elle est supprimée à l'étape 8 pour ne pas laisser de croix
# rouge sur la PR (https://docs.github.com/en/actions/concepts/security/github_token).
#
# Fusion : le script attend la CI et fusionne lui-même, puis attend le déploiement Vercel de la recette
# avant de donner dans l'issue le lien direct vers les pages concernées.
set -euo pipefail

commenter() { gh issue comment "$ISSUE" --body "$1" >/dev/null; }
pr=""
# Toute erreur imprévue est signalée dans l'issue : la modification ne reste jamais en suspens sans le dire.
signaler_incident() {
  [ "$?" -eq 0 ] && return
  commenter "⚠️ Un incident technique a empêché d'intégrer la modification à la recette${pr:+ (#$pr)}. Rien n'est publié ; un membre du bureau doit regarder (détail technique : $DETAIL)."
}
trap signaler_incident EXIT

# 1. Y a-t-il quelque chose à intégrer ? (l'action supprime la branche si Claude n'a rien modifié)
if [ -z "${BRANCHE:-}" ]; then
  echo "Aucune branche : rien à intégrer."
  exit 0
fi
if ! avance=$(gh api "repos/$GH_REPO/compare/$BASE...$BRANCHE" --jq .ahead_by 2>/dev/null); then
  echo "Branche $BRANCHE absente : Claude n'a rien modifié."
  exit 0
fi
if [ "$avance" = "0" ]; then
  echo "Branche $BRANCHE sans commit : rien à intégrer."
  exit 0
fi

# 2. Pages concernées, avec leur adresse sur la préproduction de la recette
pages=$(gh api "repos/$GH_REPO/compare/$BASE...$BRANCHE" --jq '.files[].filename' |
  while read -r f; do
    case "$f" in
      (src/content/pages/*.md) s=${f#src/content/pages/}; echo "- [/${s%.md}/]($PREPROD/${s%.md}/)" ;;
      (src/content/actualites/*.md) s=${f#src/content/actualites/}; echo "- [/actualites/${s%.md}/]($PREPROD/actualites/${s%.md}/)" ;;
      (src/content/bulletins/*) echo "- [/bulletins/]($PREPROD/bulletins/)" ;;
      (src/content/galeries/*) echo "- [/cartes-postales-historiques/]($PREPROD/cartes-postales-historiques/)" ;;
      (src/data/accueil.yml) echo "- [Accueil]($PREPROD/)" ;;
      (src/data/menu.yml | src/data/site.yml) echo "- Menu ou pied de page (toutes les pages) : [accueil]($PREPROD/)" ;;
      (public/medias/*) ;; # images : visibles dans les pages ci-dessus
      (*) echo "- Fichier technique : \`$f\`" ;;
    esac
  done | sort -u)
medias=$(gh api "repos/$GH_REPO/compare/$BASE...$BRANCHE" --jq '[.files[].filename | select(startswith("public/medias/"))] | length')

# 3. PR vers recette (réutilisée si elle existe déjà)
pr=$(gh pr list --head "$BRANCHE" --base "$BASE" --state open --json number --jq '.[0].number // empty')
if [ -z "$pr" ]; then
  corps=$(
    cat <<EOF
Modification demandée dans l'issue #$ISSUE, réalisée par Claude.

## Pages concernées

À relire sur la préproduction de la recette ($PREPROD), une fois cette PR fusionnée :

${pages:-- (aucune page identifiée automatiquement)}
$([ "$medias" -gt 0 ] && echo "- $medias image(s) ou document(s) ajouté(s) dans \`public/medias/\`")

## Circuit

Cette PR est fusionnée automatiquement dans \`recette\` (merge commit) dès que la CI est verte.
La mise en production passe ensuite, comme d'habitude, par la PR \`recette\` → \`main\` relue par le bureau.
EOF
  )
  url=$(gh pr create --base "$BASE" --head "$BRANCHE" \
    --title "Contenu : ${TITRE_ISSUE#\[Modification\] } (#$ISSUE)" --body "$corps")
  pr=${url##*/}
fi
echo "PR #$pr"

# 4. CI sur la branche (voir l'en-tête : la PR seule ne la déclenche pas)
if ! gh workflow run ci.yml --ref "$BRANCHE"; then
  commenter "⚠️ La modification est prête (#$pr), mais les vérifications automatiques n'ont pas pu être lancées. Elle n'a **pas** été intégrée à la recette ; un membre du bureau doit la reprendre."
  exit 0
fi

# 5. Conflit avec la recette ? (GitHub calcule l'état en différé)
etat=UNKNOWN
for _ in $(seq 1 20); do
  etat=$(gh pr view "$pr" --json mergeable --jq .mergeable)
  [ "$etat" != "UNKNOWN" ] && break
  sleep 3
done
if [ "$etat" = "CONFLICTING" ]; then
  commenter "⚠️ La modification est prête (#$pr), mais elle entre en conflit avec une autre modification faite entre-temps sur la recette. Elle n'a **pas** été intégrée. Un membre du bureau doit la reprendre ; rien n'est publié en attendant."
  exit 0
fi

# 6. Attendre la CI lancée à l'étape 4 (celle du commit de tête, pas d'un essai précédent), puis fusionner
tete=$(gh api "repos/$GH_REPO/commits/$BRANCHE" --jq .sha)
run=""
for _ in $(seq 1 20); do
  run=$(gh run list --workflow ci.yml --branch "$BRANCHE" --commit "$tete" --event workflow_dispatch --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$run" ] && break
  sleep 3
done
if [ -z "$run" ]; then
  commenter "⚠️ La modification est prête (#$pr), mais les vérifications automatiques sont introuvables. Elle n'a **pas** été intégrée à la recette ; un membre du bureau doit la reprendre."
  exit 0
fi
if ! gh run watch "$run" --exit-status --interval 15 >/dev/null; then
  # CI rouge : la PR reste ouverte, et c'est la CI elle-même qui le signale dans l'issue (ci.yml).
  exit 0
fi
gh pr merge "$pr" --merge --delete-branch

# 7. Attendre que Vercel ait déployé la recette, pour ne donner le lien qu'une fois la page réellement
# visible. Vercel le signale par un statut de commit « Vercel » sur le commit de fusion (pas par un
# déploiement GitHub). 10 minutes au plus.
fusion=$(gh pr view "$pr" --json mergeCommit --jq .mergeCommit.oid)
deploye=""
for _ in $(seq 1 40); do
  sleep 15
  etat=$(gh api "repos/$GH_REPO/commits/$fusion/statuses" \
    --jq '[.[] | select(.context == "Vercel")][0].state // empty')
  case "$etat" in
    success) deploye=oui; break ;;
    failure | error) break ;;
  esac
done

# 8. Supprimer l'exécution « pull_request » de la CI restée en attente d'approbation (voir l'en-tête).
# Sans effet sur le résultat : en cas d'échec, elle reste simplement visible sur la PR.
for id in $(gh run list --workflow ci.yml --branch "$BRANCHE" --event pull_request \
  --json databaseId --jq '.[].databaseId'); do
  gh run cancel "$id" >/dev/null 2>&1 || true
  gh api -X DELETE "repos/$GH_REPO/actions/runs/$id" >/dev/null 2>&1 ||
    echo "::warning::Exécution $id de la CI non supprimée."
done

liens=$(grep -v 'Fichier technique' <<<"$pages" || true)
liens=${liens:-"- [Accueil de la préproduction]($PREPROD/)"}
if [ -n "$deploye" ]; then
  commenter "✅ C'est en ligne sur la préproduction. Vous pouvez relire ici :

$liens

Le bureau relira avant toute mise en ligne sur le vrai site. Une correction ? Écrivez-la en commentaire en commençant par « @claude »."
else
  commenter "✅ La modification a été intégrée à la recette (#$pr). Elle sera visible encore d'ici quelques minutes ici :

$liens

Le bureau relira avant toute mise en ligne sur le vrai site. Une correction ? Écrivez-la en commentaire en commençant par « @claude »."
fi
