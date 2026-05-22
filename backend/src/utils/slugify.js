/**
 * Convert a marketHashName to a URL-safe slug.
 *
 *   "AK-47 | Redline (Field-Tested)" → "ak-47-redline-field-tested"
 *   "StatTrak™ AK-47 | Redline (FT)" → "stattrak-ak-47-redline-ft"
 *   "★ Karambit | Fade (FN)"         → "karambit-fade-fn"
 *
 * Pure function, no I/O. Tested in __tests__/slugify.test.js.
 */
export function slugify(input) {
  if (!input) return '';
  return String(input)
    // Strip diacritics + non-ASCII (★, ™, etc.)
    // NFD (not NFKD): keeps ™/½/ﬁ as single codepoints so the next line's ASCII strip removes them as whole units, instead of decomposing ™→TM which would survive.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    // Lowercase
    .toLowerCase()
    // Pipe, parens, slash, colon, ampersand → space
    .replace(/[|()/:&]/g, ' ')
    // Collapse whitespace + any non-alphanumeric (except hyphen) → hyphen
    .replace(/[^a-z0-9-]+/g, '-')
    // Collapse repeated hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Extract the weapon slug from a marketHashName.
 *   "AK-47 | Redline (FT)"           → "ak-47"
 *   "★ StatTrak™ Karambit | Fade"   → "karambit"
 *   "★ Karambit"                     → "karambit"   (vanilla knife, no skin)
 *   "★ Sport Gloves"                 → "sport-gloves"
 *   "Operation Hydra Case"           → "unknown"
 */
export function weaponSlugFor(marketHashName) {
  if (!marketHashName || typeof marketHashName !== 'string') return 'unknown';

  // Knife / glove vanilla items have no '|' — the whole string after ★ is the
  // weapon type. Without this branch they all collapse to 'unknown' and break
  // every knife pillar page.
  const hasStar = marketHashName.startsWith('★');
  if (!marketHashName.includes('|')) {
    if (!hasStar) return 'unknown';
    const head = marketHashName
      .replace(/^★\s*/, '')
      .replace(/^StatTrak™?\s*/i, '')
      .replace(/^Souvenir\s*/i, '')
      .trim();
    return slugify(head) || 'unknown';
  }

  // Take everything before the first pipe
  let head = marketHashName.split('|')[0].trim();
  // Strip ★, StatTrak™, Souvenir prefixes
  head = head
    .replace(/^★\s*/, '')
    .replace(/^StatTrak™?\s*/i, '')
    .replace(/^Souvenir\s*/i, '')
    .trim();
  return slugify(head);
}
