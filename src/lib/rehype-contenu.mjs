// Mise en forme du Markdown rendu, sans rien exiger des rédacteurs :
// - une image seule dans son paragraphe devient une <figure> ; la ligne en italique
//   qui la suit immédiatement (sans ligne vide) devient sa <figcaption> ;
// - plusieurs figures consécutives sont regroupées dans <div data-galerie> (grille) ;
// - les images locales reçoivent dimensions, srcset, chargement différé ;
// - typographie française : espace insécable avant « : », espace fine insécable avant ; ! ? » et après «.
import { infosImage } from './medias.mjs';

const estBlanc = (n) => n.type === 'text' && !n.value.trim();
const estElement = (n, tag) => n?.type === 'element' && n.tagName === tag;
const imageSeule = (n) =>
  estElement(n, 'img') ||
  (estElement(n, 'a') &&
    n.children.filter((c) => !estBlanc(c)).length === 1 &&
    n.children.some((c) => estElement(c, 'img')));

/** Une image sans lien ouvre l'original en grand. */
function avecLien(n) {
  if (!estElement(n, 'img')) return n;
  const alt = String(n.properties.alt ?? '');
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      href: n.properties.src,
      ...(alt ? {} : { ariaLabel: 'Voir l’image en grand' }),
    },
    children: [n],
  };
}

/** <p><img> [<br>] <em>légende</em></p> → <figure><img><figcaption>légende</figcaption></figure> */
function enFigure(p) {
  const enfants = p.children.filter(
    (c) => !estBlanc(c) && !estElement(c, 'br'),
  );
  if (!enfants.length || !imageSeule(enfants[0])) return null;
  enfants[0] = avecLien(enfants[0]);
  if (enfants.length === 1)
    return {
      type: 'element',
      tagName: 'figure',
      properties: {},
      children: [enfants[0]],
    };
  if (enfants.length === 2 && estElement(enfants[1], 'em')) {
    return {
      type: 'element',
      tagName: 'figure',
      properties: {},
      children: [
        enfants[0],
        {
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: enfants[1].children,
        },
      ],
    };
  }
  return null;
}

function transformerBlocs(parent) {
  // Ne pas redescendre dans une figure ou une grille déjà constituée.
  if (
    !parent.children ||
    estElement(parent, 'figure') ||
    'dataGalerie' in (parent.properties ?? {})
  )
    return;
  parent.children = parent.children.map((n) =>
    estElement(n, 'p') ? (enFigure(n) ?? n) : n,
  );
  // Regroupe les figures consécutives (séparées seulement par des blancs).
  const resultat = [];
  let groupe = [];
  const vider = () => {
    if (groupe.length > 1) {
      resultat.push({
        type: 'element',
        tagName: 'div',
        properties: { dataGalerie: String(groupe.length) },
        // Blancs entre figures : la recherche (Pagefind) ne colle pas les légendes.
        children: groupe.flatMap((f, i) =>
          i ? [{ type: 'text', value: '\n' }, f] : [f],
        ),
      });
    } else resultat.push(...groupe);
    groupe = [];
  };
  for (const n of parent.children) {
    if (estElement(n, 'figure')) groupe.push(n);
    else if (estBlanc(n) && groupe.length) continue;
    else {
      vider();
      resultat.push(n);
    }
  }
  vider();
  parent.children = resultat;
  for (const n of parent.children)
    if (n.type === 'element' && n.tagName !== 'pre') transformerBlocs(n);
}

function parcourir(n, rappel, parent) {
  rappel(n, parent);
  if (n.children) for (const c of n.children) parcourir(c, rappel, n);
}

const ESPACE_FINE = '\u202f';
const ESPACE_INSECABLE = '\u00a0';
function typographie(texte) {
  return texte
    .replace(/(\p{L})'/gu, '$1’')
    .replace(/ :/g, `${ESPACE_INSECABLE}:`)
    .replace(/ ([;!?»])/g, `${ESPACE_FINE}$1`)
    .replace(/« /g, `«${ESPACE_FINE}`);
}

export default function rehypeContenu() {
  return async (arbre) => {
    transformerBlocs(arbre);
    const images = [];
    parcourir(arbre, (n, parent) => {
      if (estElement(n, 'img')) images.push({ n, dansGalerie: false });
      if (
        n.type === 'text' &&
        !['code', 'pre', 'script', 'style'].includes(parent?.tagName)
      ) {
        n.value = typographie(n.value);
      }
      if (estElement(n, 'div') && 'dataGalerie' in n.properties) {
        parcourir(n, (m) => {
          if (estElement(m, 'img')) m.properties.dataDansGalerie = '';
        });
      }
    });
    await Promise.all(
      images.map(async ({ n }) => {
        const p = n.properties;
        p.loading = 'lazy';
        p.decoding = 'async';
        p.alt ??= '';
        const infos = await infosImage(String(p.src));
        if (!infos) return;
        p.width = infos.width;
        p.height = infos.height;
        if (infos.srcset) {
          p.srcSet = infos.srcset;
          p.sizes =
            'dataDansGalerie' in p
              ? '(min-width: 768px) 15rem, 50vw'
              : '(min-width: 768px) 46rem, 100vw';
        }
        delete p.dataDansGalerie;
      }),
    );
  };
}
