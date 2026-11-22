// The numbers on the Stats page, worked out from what the app already has:
// the shelf, the books with what was paid for them (Your books on a series
// page), and the server's own totals (worth, what's left to collect). Pure,
// so each figure can be checked on its own. Nothing is guessed: a book with
// no price or no date is counted as that, never filled in
import type { FinishRow } from "@/core/lib/collector";
import type { OwnedBook } from "@/core/lib/books";
import { ownedCount } from "@/core/lib/ownedVolumes";
import type { Manga } from "@/core/lib/types";

export type YearSpend = {
  // "2026", or null for books with a price but no day bought
  year: string | null;
  cents: number;
  books: number;
};

// What they paid, by the year they bought it: only books with a price. The
// newest year first, books with no day last
export function spendByYear(
  books: Pick<OwnedBook, "paidCents" | "boughtOn">[],
): YearSpend[] {
  const byYear = new Map<string | null, YearSpend>();
  for (const book of books) {
    if (book.paidCents == null) continue;
    const year = /^\d{4}/.exec(book.boughtOn ?? "")?.[0] ?? null;
    const row = byYear.get(year) ?? { year, cents: 0, books: 0 };
    row.cents += book.paidCents;
    row.books += 1;
    byYear.set(year, row);
  }
  return [...byYear.values()].sort((a, b) =>
    a.year === null ? 1 : b.year === null ? -1 : b.year.localeCompare(a.year),
  );
}

// how many series under each genre, most first; none for a series with no
// genre set
export function seriesByGenre(manga: Pick<Manga, "genre">[]) {
  const counts = new Map<string, number>();
  for (const m of manga) {
    const genre = m.genre?.trim();
    if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([genre, series]) => ({ genre, series }))
    .sort((a, b) => b.series - a.series || a.genre.localeCompare(b.genre));
}

// the series they own the most volumes of, most first
export function longestRuns(manga: Manga[], most: number) {
  return manga
    .map((m) => ({ id: m.id, name: m.name ?? "", volumes: ownedCount(m) }))
    .filter((row) => row.volumes > 0)
    .sort((a, b) => b.volumes - a.volumes || a.name.localeCompare(b.name))
    .slice(0, most);
}

// How complete the collection is: of every volume out for the series they
// collect, how many are on the shelf. `missing` is the server's own count
// of what's left (its finish rows), so the two always agree with the
// Volumes tab
export function completion(owned: number, finish: FinishRow[]) {
  const missing = finish.reduce((sum, row) => sum + row.missing.length, 0);
  const out = owned + missing;
  return {
    owned,
    missing,
    percent: out ? Math.round((owned / out) * 100) : null,
    // series with nothing left to get, of those they own any of
    mostToGet: [...finish]
      .filter((row) => row.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length)
      .slice(0, 5),
  };
}
