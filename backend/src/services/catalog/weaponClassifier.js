// Shared weapon-type extraction + categorization, used by both:
//   - catalog-sync (to populate weaponType / itemType on every upsert)
//   - one-shot backfill script (scripts/backfill-weapon-types.js)
//
// Keep in sync with frontend CS2_CATEGORIES if you add new categories.

const WEAPON_TO_CATEGORY = {
  // Pistols
  'Glock-18': 'pistols', 'USP-S': 'pistols', 'P250': 'pistols', 'P2000': 'pistols',
  'Five-SeveN': 'pistols', 'Dual Berettas': 'pistols', 'Desert Eagle': 'pistols',
  'CZ75-Auto': 'pistols', 'Tec-9': 'pistols', 'R8 Revolver': 'pistols', 'Zeus x27': 'pistols',
  // SMGs
  'MP7': 'smgs', 'MP9': 'smgs', 'MAC-10': 'smgs', 'MP5-SD': 'smgs', 'UMP-45': 'smgs',
  'P90': 'smgs', 'PP-Bizon': 'smgs',
  // Rifles + snipers (grouped under "rifles" per CS2 category UI)
  'AK-47': 'rifles', 'M4A4': 'rifles', 'M4A1-S': 'rifles', 'AUG': 'rifles', 'SG 553': 'rifles',
  'FAMAS': 'rifles', 'Galil AR': 'rifles', 'AWP': 'rifles',
  'SSG 08': 'rifles', 'SCAR-20': 'rifles', 'G3SG1': 'rifles',
  // Shotguns
  'Nova': 'shotguns', 'XM1014': 'shotguns', 'Sawed-Off': 'shotguns', 'MAG-7': 'shotguns',
  // Machine guns
  'M249': 'machine_guns', 'Negev': 'machine_guns',
};

const GLOVE_WEAPONS = new Set([
  '★ Bloodhound Gloves', '★ Broken Fang Gloves', '★ Driver Gloves', '★ Hand Wraps',
  '★ Hydra Gloves', '★ Moto Gloves', '★ Specialist Gloves', '★ Sport Gloves',
]);

const KNIFE_PREFIX = '★ ';

/**
 * Extract weapon-type from a skin name string.
 * "AK-47 | Redline" → "AK-47"
 * "★ Karambit | Doppler" → "★ Karambit"
 * "StatTrak™ AK-47 | Redline" → "AK-47"
 * "★ Bayonet" (no |) → "★ Bayonet"
 */
export function extractWeaponType(name) {
  if (!name) return null;
  const stripped = name.replace(/^StatTrak™\s*/, '').replace(/^Souvenir\s+/, '').trim();
  const idx = stripped.indexOf(' | ');
  return idx >= 0 ? stripped.slice(0, idx).trim() : stripped.trim();
}

/**
 * Map a weapon to its UI category (matches frontend CS2_CATEGORIES).
 */
export function categorizeWeapon(weaponType) {
  if (!weaponType) return null;
  if (GLOVE_WEAPONS.has(weaponType)) return 'gloves';
  if (weaponType.startsWith(KNIFE_PREFIX)) return 'knives';
  return WEAPON_TO_CATEGORY[weaponType] ?? null;
}
