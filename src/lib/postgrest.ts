// Helpers for building safe PostgREST filter expressions.

// Escape characters with special meaning inside a PostgREST `.or()` filter
// expression so user-supplied search text cannot alter filter logic.
// - `%` and `_` are ilike wildcards (kept escaped so raw input matches literally)
// - `,` separates OR branches
// - `(` and `)` group sub-filters
// - `.` separates column/operator/value tokens
// - `\` is the escape character itself
// - `"` can start quoted identifiers
export function escapePostgrestOrValue(input: string): string {
  return input.replace(/[\\%_,().*"]/g, (ch) => `\\${ch}`);
}

// Convenience: escape then wrap in `%...%` for ilike substring searches
// used inside `.or()` filter strings.
export function escapePostgrestLike(input: string): string {
  return `%${escapePostgrestOrValue(input)}%`;
}