// Mise en forme des dates en français (fuseau de Paris).
const options = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', ...o });

const jourMoisAnnee = options({
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const moisAnnee = options({ month: 'long', year: 'numeric' });
const moisCourt = options({ month: 'short' });
const jour = options({ day: 'numeric' });
const annee = options({ year: 'numeric' });

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 8 octobre 2026 » */
export const dateLongue = (d: Date) => jourMoisAnnee.format(d);

/** « Novembre 2025 » */
export const moisEtAnnee = (d: Date) => majuscule(moisAnnee.format(d));

/** Valeur de l’attribut datetime selon la précision : 2026-11-06, 2026-11 ou 2026. */
export function isoSelon(
  d: Date,
  precision: 'jour' | 'mois' | 'annee' = 'jour',
) {
  const iso = d.toISOString().slice(0, 10);
  return precision === 'jour'
    ? iso
    : precision === 'mois'
      ? iso.slice(0, 7)
      : iso.slice(0, 4);
}

/**
 * Pavé de date des cartes d’actualité : grande ligne et petite ligne.
 * « 6–9 » / « nov. 2026 », « Nov. » / « 2023 », « 2023 » seul.
 */
export function paveDate(
  debut: Date,
  fin: Date | undefined,
  precision: 'jour' | 'mois' | 'annee',
): { grand: string; petit?: string } {
  if (precision === 'annee') return { grand: annee.format(debut) };
  if (precision === 'mois') {
    return {
      grand: majuscule(moisCourt.format(debut)),
      petit: annee.format(debut),
    };
  }
  const memeMois = fin && moisCourt.format(fin) === moisCourt.format(debut);
  const grand = fin
    ? memeMois
      ? `${jour.format(debut)}–${jour.format(fin)}`
      : `${jour.format(debut)} ${moisCourt.format(debut)}–${jour.format(fin)}`
    : jour.format(debut);
  return {
    grand,
    petit: `${moisCourt.format(fin ?? debut)} ${annee.format(debut)}`,
  };
}

/** Date de fin d’un événement (fin du jour, du mois ou de l’année selon la précision). */
export function finEvenement(
  debut: Date,
  fin: Date | undefined,
  precision: 'jour' | 'mois' | 'annee',
) {
  const d = new Date(fin ?? debut);
  if (precision === 'annee') return new Date(d.getUTCFullYear() + 1, 0, 1);
  if (precision === 'mois')
    return new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  return new Date(d.getTime() + 24 * 3600 * 1000);
}

/** « Du 8 au 11 novembre 2019 », « Du 30 juin au 2 juillet 2026 », « Le 25 mars 2023 ». */
export function periode(debut: Date, fin?: Date) {
  if (!fin) return `Le ${dateLongue(debut)}`;
  const memeAnnee = debut.getUTCFullYear() === fin.getUTCFullYear();
  const memeMois = memeAnnee && debut.getUTCMonth() === fin.getUTCMonth();
  const premier = memeMois
    ? jour.format(debut)
    : memeAnnee
      ? options({ day: 'numeric', month: 'long' }).format(debut)
      : dateLongue(debut);
  return `Du ${premier} au ${dateLongue(fin)}`;
}
