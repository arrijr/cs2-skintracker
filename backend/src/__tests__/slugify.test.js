import { describe, it, expect } from '@jest/globals';
import { slugify, weaponSlugFor } from '../utils/slugify.js';

describe('slugify', () => {
  it('lowercases + replaces pipes/parens/spaces with hyphens', () => {
    expect(slugify('AK-47 | Redline (Field-Tested)')).toBe('ak-47-redline-field-tested');
  });

  it('keeps existing hyphens in weapon names', () => {
    expect(slugify('AWP | Asiimov (Battle-Scarred)')).toBe('awp-asiimov-battle-scarred');
  });

  it('handles StatTrak and Souvenir prefixes', () => {
    expect(slugify('StatTrak™ AK-47 | Redline (Field-Tested)')).toBe('stattrak-ak-47-redline-field-tested');
    expect(slugify('Souvenir AWP | Dragon Lore (Factory New)')).toBe('souvenir-awp-dragon-lore-factory-new');
  });

  it('strips diacritics and non-ASCII', () => {
    expect(slugify('★ Karambit | Fade (Factory New)')).toBe('karambit-fade-factory-new');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('M4A4 |   Asiimov')).toBe('m4a4-asiimov');
  });

  it('trims leading + trailing hyphens', () => {
    expect(slugify('-AK-47-')).toBe('ak-47');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('weaponSlugFor', () => {
  it('extracts weapon from "WEAPON | Skin (Wear)" format', () => {
    expect(weaponSlugFor('AK-47 | Redline (Field-Tested)')).toBe('ak-47');
    expect(weaponSlugFor('AWP | Asiimov (Factory New)')).toBe('awp');
  });

  it('handles StatTrak prefix', () => {
    expect(weaponSlugFor('StatTrak™ AK-47 | Redline (Field-Tested)')).toBe('ak-47');
  });

  it('handles Souvenir prefix', () => {
    expect(weaponSlugFor('Souvenir AWP | Dragon Lore (Factory New)')).toBe('awp');
  });

  it('handles knife star prefix', () => {
    expect(weaponSlugFor('★ Karambit | Fade (Factory New)')).toBe('karambit');
    expect(weaponSlugFor('★ StatTrak™ Karambit | Fade (Factory New)')).toBe('karambit');
  });

  it('returns "unknown" when no pipe present', () => {
    expect(weaponSlugFor('Operation Hydra Case')).toBe('unknown');
  });
});
