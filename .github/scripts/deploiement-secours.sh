#!/usr/bin/env bash
# Déploiement de secours de main ou de recette (appelé par .github/workflows/deploiement-secours.yml).
# Vercel refuse de déployer un commit dont l'auteur GitHub n'est pas membre de l'équipe Vercel (par
# exemple une PR « Mise en production » fusionnée par un membre du bureau sans compte Vercel). Le
# statut de commit « Vercel » passe alors en échec (« Deployment was blocked ») : on déclenche le
# Deploy Hook de la branche, qui déploie sa tête quel que soit l'auteur.
#
# Variables attendues : REF, SHA, HOOK_MAIN, HOOK_RECETTE, GH_TOKEN, GH_REPO.
set -euo pipefail

case "$REF" in
  (main) hook=$HOOK_MAIN secret=VERCEL_DEPLOY_HOOK ;;
  (recette) hook=$HOOK_RECETTE secret=VERCEL_DEPLOY_HOOK_RECETTE ;;
  (*) echo "Branche $REF sans Deploy Hook : rien à faire."; exit 0 ;;
esac

# Statut le plus récent de Vercel sur le commit. Il arrive en quelques secondes ; 3 minutes au plus.
etat="" description=""
for _ in $(seq 1 18); do
  statut=$(gh api "repos/$GH_REPO/commits/$SHA/statuses" \
    --jq '[.[] | select(.context == "Vercel")][0] // empty | "\(.state)\t\(.description)"')
  if [ -n "$statut" ]; then
    IFS=$'\t' read -r etat description <<<"$statut"
    break
  fi
  sleep 10
done

case "$etat" in
  (success | pending)
    echo "Vercel déploie normalement $SHA ($description)."
    exit 0 ;;
  (failure | error)
    case "$description" in
      (*blocked* | *"must have access"*) echo "Déploiement bloqué par Vercel : $description" ;;
      (*)
        # Échec du build : le Deploy Hook échouerait de la même façon.
        echo "::warning::Déploiement Vercel en échec ($description) : à regarder sur Vercel."
        exit 0 ;;
    esac ;;
  (*) echo "Aucun statut Vercel sur $SHA après 3 minutes : déploiement par le Deploy Hook." ;;
esac

if [ -z "$hook" ]; then
  echo "::error::Secret $secret absent : $REF n'est pas déployée. Créer le Deploy Hook de $REF sur Vercel (Settings > Git > Deploy Hooks) et enregistrer son URL dans ce secret."
  exit 1
fi
curl -fsS -X POST "$hook" >/dev/null
echo "Deploy Hook de $REF déclenché."
