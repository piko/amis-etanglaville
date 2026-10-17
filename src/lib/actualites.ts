import { getCollection, type CollectionEntry } from 'astro:content';
import { finEvenement } from './dates';

export type Categorie = CollectionEntry<'actualites'>['data']['categorie'];

/** Libellés des catégories (cartes et filtres). */
export const categories: Record<Categorie, string> = {
  salon: 'Salon',
  'portes-ouvertes': 'Portes ouvertes',
  ag: 'Assemblée générale',
  environnement: 'Environnement',
  autre: 'Vie de l’association',
};

/** Libellés des filtres (au pluriel quand il le faut). */
export const filtres: { slug: Categorie; libelle: string }[] = [
  { slug: 'salon', libelle: 'Salons' },
  { slug: 'portes-ouvertes', libelle: 'Portes ouvertes' },
  { slug: 'ag', libelle: 'Assemblée générale' },
  { slug: 'environnement', libelle: 'Environnement' },
  { slug: 'autre', libelle: 'Vie de l’association' },
];

/** Nombre d’événements passés par page. */
export const PAR_PAGE = 9;

/**
 * Actualités publiées, réparties en « à venir » (du plus proche au plus lointain)
 * et « passées » (de la plus récente à la plus ancienne). Le statut est calculé au build.
 */
export async function actualites(categorie?: Categorie) {
  const toutes = await getCollection(
    'actualites',
    ({ data }) => !data.draft && (!categorie || data.categorie === categorie),
  );
  const maintenant = new Date();
  const estAVenir = (a: CollectionEntry<'actualites'>) =>
    finEvenement(a.data.date, a.data.dateFin, a.data.datePrecision) >
    maintenant;
  const aVenir = toutes
    .filter(estAVenir)
    .sort(
      (a, b) =>
        Number(a.data.annule) - Number(b.data.annule) ||
        a.data.date.getTime() - b.data.date.getTime(),
    );
  const passees = toutes
    .filter((a) => !estAVenir(a))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return { aVenir, passees };
}
