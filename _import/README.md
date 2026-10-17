# Contenu du site amis-letanglaville.org en Markdown

Extraction du site WordPress (thème Shapely + Elementor), le 17 octobre 2026, via l'API REST de WordPress.

## Structure

```
content/
  pages/   21 pages publiées, une par fichier (le nom du fichier est le slug WordPress)
  posts/   1 article (« Blog », texte de remplissage, marqué draft)
data/
  menu.yml     arborescence du menu principal
  medias.txt   308 fichiers référencés (268 images, 40 PDF), URL d'origine
```

Chaque fichier commence par un front matter : `title`, `type`, `slug`, `wp_id`, `parent` (si besoin), `date`, `modified`. Il est compatible avec les content collections d'Astro et avec Pages CMS.

## Conventions

- Les liens internes pointent vers les fichiers voisins (`./bulletins.md`). Les anciennes URL `?page_id=N` correspondent au champ `wp_id`, à reprendre pour les redirections.
- Les images et PDF pointent encore vers `https://amis-letanglaville.org/wp-content/uploads/…`. Il faut les télécharger (liste dans `data/medias.txt`) puis remplacer ce préfixe par `/medias/` avant de fermer l'ancien site.
- Les URL redimensionnées (`-300x200.jpg`) et le CDN Jetpack (`i0.wp.com`) ont été ramenés au fichier original.
- Les commentaires `<!-- … -->` signalent les points à vérifier.

## Points relevés sur le site d'origine

- **Bulletins** : le lien « Bulletin 82 » ouvre le PDF du bulletin 85 ; 7 emplacements « En attente » sont vides. La liste 2020-2026 a été remise dans l'ordre des numéros.
- **Documentation** : le lien « Les bulletins » pointe vers une page inexistante (`?page_id=587`). Il est corrigé vers `bulletins.md`.
- **Les arbres dans la ville** : les liens `mailto` affichent comite-ca@ mais envoyaient vers une adresse Gmail personnelle. Ils sont corrigés vers comite-ca@. L'URL de la carte Google My Maps (lien d'édition) est à reprendre à la main.
- **Accueil** : seul le texte d'accroche est dans la page. L'image (le tableau de Vuillard) est portée par le thème.
- **Adhésion** : paiements en ligne via PayAsso (liens conservés). Il n'y a pas de formulaire sur le site.
- **Blog** : le seul article est un « Lorem ipsum ».
- **Cartes postales** : 184 images. Les légendes manquantes ont été déduites du nom de fichier.
