/**
 * Helper for constructing canonical skin detail URLs.
 *
 * The legacy `/skins/${id}` route was removed in Sprint 2. The canonical URL is
 * now `/skins/${weaponSlug}/${slug}`. Use {@link skinDetailHref} to derive the
 * correct href from any skin-shaped object; consumers should fall back to a
 * disabled link (or omit it entirely) when this returns `null`.
 */
export function skinDetailHref(skin: {
  id?: number;
  slug?: string | null;
  weaponSlug?: string | null;
}): string | null {
  if (skin?.weaponSlug && skin?.slug) {
    return `/skins/${skin.weaponSlug}/${skin.slug}`;
  }
  return null;
}
