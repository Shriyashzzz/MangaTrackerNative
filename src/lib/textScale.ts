// How far the reader's text size may grow the app's dense pieces: rows,
// tiles, chips and bars where words share a line with numbers and buttons.
// Sentences and paragraphs grow with the reader's setting all the way; these
// stop at one and a half times, so at the largest accessibility sizes they
// stay whole instead of being cut to a few letters
export const DENSE = 1.5;
