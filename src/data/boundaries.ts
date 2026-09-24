// Grade boundaries for the Subject Grade Calculator.
// Official boundaries go to schools each session and vary by subject, level,
// session and timezone, so Sevens never bundles them. This default is our own
// rounded estimate (minimum weighted % for grades 2-7), clearly labelled in
// the UI. Students replace it with their teacher's boundaries, saved per
// subject in the URL hash. Room below for per-subject typical boundaries
// if the founders ever approve them (each with a source).

/** Minimum weighted % (out of 100) for grades 2, 3, 4, 5, 6, 7. */
export const DEFAULT_BOUNDARIES = [15, 27, 38, 49, 60, 72];

/** Per-subject typical boundaries, each entry with a source. Empty for now. */
export const BOUNDARY_OVERRIDES: Record<string, { bounds: number[]; source: string }> = {};
