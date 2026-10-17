@AGENTS.md

## Spécificités Claude

- **Documentation à jour** : consulter context7 (Astro, Tailwind CSS v4, Zod) avant d'utiliser une API dont tu n'es pas sûr. Pour Pages CMS : https://pagescms.org/docs/.
- **Vérification visuelle** : lancer `npx astro dev --background`, puis capturer les pages modifiées avec Playwright (http://localhost:4321) en largeur bureau et mobile (≈ 390 px). Arrêter avec `npx astro dev stop`.
- **PR** : `gh pr create` avec un titre et une description en français. Indiquer les pages concernées pour faciliter la relecture sur la préproduction.
- **Design** : quand le canevas de design est fourni (lien claude.ai), le lire avec l'outil Artifact. Traduire ses choix dans les tokens `@theme` de `src/styles/global.css` et dans les composants, jamais dans le contenu.
- Ne jamais demander ni écrire de secret (jetons, clés) dans le dépôt.
