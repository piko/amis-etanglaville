#!/usr/bin/env bash
# Fait arriver le travail de Claude sur la recette (appelé par .github/workflows/claude.yml).
# Lance la CI sur la branche contenu/…, la fusionne dans recette (merge commit) une fois la CI verte,
# puis donne dans l'issue, en langage simple, le lien direct vers les pages une fois en ligne.
#
# Variables attendues : BRANCHE, ISSUE, TITRE_ISSUE, BASE, PREPROD, DETAIL, GH_TOKEN, GH_REPO.
#
# Pas de PR intermédiaire vers recette : personne ne la relirait (la relecture se fait sur la
# préproduction, puis dans la PR recette → main), et une PR ouverte avec le GITHUB_TOKEN crée une
# exécution de la CI en attente d'approbation qui finit en échec à la fusion
# (https://docs.github.com/en/actions/concepts/security/github_token).
#
# Jeton : GITHUB_TOKEN. Il ne peut déclencher que workflow_dispatch : la CI est donc lancée
# explicitement sur la branche. La fusion passe par l'API « merges », qui signale aussi les conflits.
set -euo pipefail

commenter() { gh issue comment "$ISSUE" --body "$1" >/dev/null; }
# Toute erreur imprévue est signalée dans l'issue : la modification ne reste jamais en suspens sans le dire.
signaler_incident() {
  [ "$?" -eq 0 ] && return
  commenter "⚠️ Un incident technique a empêché d'intégrer la modification à la recette. Rien n'est publié ; un membre du bureau doit regarder (détail technique : $DETAIL)."
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
reprendre="un membre du bureau doit la reprendre (elle est conservée sur la branche \`$BRANCHE\`, détail technique : $DETAIL)"

# 3. CI sur la branche, puis attente de son résultat (celle du commit de tête, pas d'un essai précédent)
tete=$(gh api "repos/$GH_REPO/commits/$BRANCHE" --jq .sha)
if ! gh workflow run ci.yml --ref "$BRANCHE"; then
  commenter "⚠️ La modification est prête, mais les vérifications automatiques n'ont pas pu être lancées. Elle n'a **pas** été intégrée à la recette ; $reprendre."
  exit 0
fi
run=""
for _ in $(seq 1 20); do
  run=$(gh run list --workflow ci.yml --branch "$BRANCHE" --commit "$tete" --event workflow_dispatch --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$run" ] && break
  sleep 3
done
if [ -z "$run" ]; then
  commenter "⚠️ La modification est prête, mais les vérifications automatiques sont introuvables. Elle n'a **pas** été intégrée à la recette ; $reprendre."
  exit 0
fi
if ! gh run watch "$run" --exit-status --interval 15 >/dev/null; then
  # CI rouge : la branche est conservée, et c'est la CI elle-même qui le signale dans l'issue (ci.yml).
  exit 0
fi

# 4. Fusion dans recette (merge commit). Le n° d'issue dans le message relie le commit à la demande.
message="Contenu : ${TITRE_ISSUE#\[Modification\] } (#$ISSUE)

Demande de l'issue #$ISSUE, réalisée par Claude sur la branche $BRANCHE et intégrée
automatiquement après la CI."
erreur=$(mktemp)
if ! fusion=$(gh api -X POST "repos/$GH_REPO/merges" -f base="$BASE" -f head="$BRANCHE" \
  -f commit_message="$message" --jq .sha 2>"$erreur"); then
  if grep -q "409" "$erreur"; then
    commenter "⚠️ La modification est prête, mais elle entre en conflit avec une autre modification faite entre-temps sur la recette. Elle n'a **pas** été intégrée et rien n'est publié en attendant ; $reprendre."
    exit 0
  fi
  cat "$erreur" >&2
  exit 1
fi
if [ -z "$fusion" ]; then
  echo "Rien à fusionner : $BRANCHE est déjà dans $BASE."
  exit 0
fi
gh api -X DELETE "repos/$GH_REPO/git/refs/heads/$BRANCHE" >/dev/null ||
  echo "::warning::Branche $BRANCHE non supprimée."

# Le commentaire de Claude contient, ajoutés par l'action (sans option pour les retirer), un lien vers
# la branche, désormais supprimée, et un lien « Create PR ➔ » trompeur pour un bénévole : on les retire.
# shellcheck disable=SC2016 # $ENV et les ` sont pour jq, pas pour le shell
for id in $(gh api "repos/$GH_REPO/issues/$ISSUE/comments" --paginate \
  --jq '.[] | select(.user.login == "claude[bot]" and (.body | contains("/tree/" + $ENV.BRANCHE))) | .id'); do
  corps=$(gh api "repos/$GH_REPO/issues/comments/$id" --jq \
    '.body | gsub(" • \\[`[^`]*`\\]\\([^)]*/tree/[^)]*\\)"; "") | gsub(" • \\[Create PR ➔\\]\\([^\n]*"; "")')
  gh api -X PATCH "repos/$GH_REPO/issues/comments/$id" -f body="$corps" >/dev/null ||
    echo "::warning::Commentaire $id non nettoyé."
done

# 5. Attendre que Vercel ait déployé la recette, pour ne donner le lien qu'une fois la page réellement
# visible. Vercel le signale par un statut de commit « Vercel » sur le commit de fusion (pas par un
# déploiement GitHub). 10 minutes au plus.
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

liens=$(grep -v 'Fichier technique' <<<"$pages" || true)
liens=${liens:-"- [Accueil de la préproduction]($PREPROD/)"}
if [ -n "$deploye" ]; then
  commenter "✅ C'est en ligne sur la préproduction. Vous pouvez relire ici :

$liens

Le bureau relira avant toute mise en ligne sur le vrai site. Une correction ? Écrivez-la en commentaire en commençant par « @claude »."
else
  commenter "✅ La modification a été intégrée à la recette. Elle sera visible encore d'ici quelques minutes ici :

$liens

Le bureau relira avant toute mise en ligne sur le vrai site. Une correction ? Écrivez-la en commentaire en commençant par « @claude »."
fi
