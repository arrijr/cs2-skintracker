/**
 * Sprint 1 — Skin + Case Seeder
 * Seeds 55 realistic CS2 skins and 12 cases into Prisma DB.
 *
 * Usage: node scripts/seed-skins.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ── Skins ────────────────────────────────────────────────────────────────────
// Fields mapped to schema: name, marketHashName, rarity, wear, priceAvg,
// priceLatest, priceMedian, priceSafe, imageUrl, weaponType, collection,
// isStattrak, isStar, itemType, itemName, itemGroup
const SKINS = [
  // Exotic / Covert — high value
  { name: 'AWP | Dragon Lore', marketHashName: 'AWP | Dragon Lore (Field-Tested)', rarity: 'Covert', wear: 'Field-Tested', priceAvg: 1450.00, priceLatest: 1480.00, priceMedian: 1455.00, priceSafe: 1382.00, weaponType: 'AWP', collection: 'Cobblestone Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/dragon_lore' },
  { name: 'AWP | Medusa', marketHashName: 'AWP | Medusa (Field-Tested)', rarity: 'Covert', wear: 'Field-Tested', priceAvg: 620.00, priceLatest: 635.00, priceMedian: 622.00, priceSafe: 591.00, weaponType: 'AWP', collection: 'Gods and Monsters Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/medusa' },
  { name: 'AK-47 | Wild Lotus', marketHashName: 'AK-47 | Wild Lotus (Field-Tested)', rarity: 'Covert', wear: 'Field-Tested', priceAvg: 1750.00, priceLatest: 1800.00, priceMedian: 1760.00, priceSafe: 1672.00, weaponType: 'AK-47', collection: 'St. Marc Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/wild_lotus' },
  { name: 'AK-47 | Gold Arabesque', marketHashName: 'AK-47 | Gold Arabesque (Field-Tested)', rarity: 'Covert', wear: 'Field-Tested', priceAvg: 1200.00, priceLatest: 1230.00, priceMedian: 1210.00, priceSafe: 1149.00, weaponType: 'AK-47', collection: 'Canals Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/gold_arabesque' },
  { name: 'M4A4 | Howl', marketHashName: 'M4A4 | Howl (Factory New)', rarity: 'Contraband', wear: 'Factory New', priceAvg: 4200.00, priceLatest: 4350.00, priceMedian: 4220.00, priceSafe: 4009.00, weaponType: 'M4A4', collection: 'Huntsman Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/howl' },

  // Classified — mid-high value
  { name: 'AK-47 | Fire Serpent', marketHashName: 'AK-47 | Fire Serpent (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 280.00, priceLatest: 290.00, priceMedian: 282.00, priceSafe: 267.00, weaponType: 'AK-47', collection: 'Bravo Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/fire_serpent' },
  { name: 'AK-47 | Neon Rider', marketHashName: 'AK-47 | Neon Rider (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 38.00, priceLatest: 39.50, priceMedian: 38.20, priceSafe: 36.29, weaponType: 'AK-47', collection: 'Horizon Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/neon_rider' },
  { name: 'AWP | Asiimov', marketHashName: 'AWP | Asiimov (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 95.00, priceLatest: 97.00, priceMedian: 95.50, priceSafe: 90.72, weaponType: 'AWP', collection: 'Phoenix Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/asiimov_awp' },
  { name: 'AWP | Lightning Strike', marketHashName: 'AWP | Lightning Strike (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 320.00, priceLatest: 330.00, priceMedian: 322.00, priceSafe: 305.90, weaponType: 'AWP', collection: 'eSports 2013', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/lightning_strike' },
  { name: 'M4A1-S | Hyper Beast', marketHashName: 'M4A1-S | Hyper Beast (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 28.00, priceLatest: 29.00, priceMedian: 28.20, priceSafe: 26.79, weaponType: 'M4A1-S', collection: 'Falchion Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/hyper_beast_m4' },
  { name: 'M4A4 | Asiimov', marketHashName: 'M4A4 | Asiimov (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 42.00, priceLatest: 43.50, priceMedian: 42.30, priceSafe: 40.18, weaponType: 'M4A4', collection: 'Phoenix Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/asiimov_m4a4' },
  { name: 'Desert Eagle | Blaze', marketHashName: 'Desert Eagle | Blaze (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 185.00, priceLatest: 190.00, priceMedian: 186.00, priceSafe: 176.70, weaponType: 'Desert Eagle', collection: 'Train Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/blaze' },
  { name: 'Desert Eagle | Printstream', marketHashName: 'Desert Eagle | Printstream (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 88.00, priceLatest: 90.00, priceMedian: 88.50, priceSafe: 83.82, weaponType: 'Desert Eagle', collection: 'Operation Riptide Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/printstream_deagle' },
  { name: 'Glock-18 | Fade', marketHashName: 'Glock-18 | Fade (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 320.00, priceLatest: 330.00, priceMedian: 322.00, priceSafe: 305.90, weaponType: 'Glock-18', collection: 'Dust Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/fade_glock' },
  { name: 'USP-S | Kill Confirmed', marketHashName: 'USP-S | Kill Confirmed (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 24.00, priceLatest: 25.00, priceMedian: 24.20, priceSafe: 22.99, weaponType: 'USP-S', collection: 'Spectrum Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/kill_confirmed' },

  // Restricted — mid value
  { name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 12.50, priceLatest: 13.00, priceMedian: 12.60, priceSafe: 11.97, weaponType: 'AK-47', collection: 'Phoenix Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/redline' },
  { name: 'AK-47 | Vulcan', marketHashName: 'AK-47 | Vulcan (Factory New)', rarity: 'Restricted', wear: 'Factory New', priceAvg: 85.00, priceLatest: 87.00, priceMedian: 85.50, priceSafe: 81.22, weaponType: 'AK-47', collection: 'Operation Bravo Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/vulcan' },
  { name: 'AK-47 | Asiimov', marketHashName: 'AK-47 | Asiimov (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 18.50, priceLatest: 19.00, priceMedian: 18.60, priceSafe: 17.67, weaponType: 'AK-47', collection: 'Breakout Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/asiimov_ak' },
  { name: 'M4A4 | Desolate Space', marketHashName: 'M4A4 | Desolate Space (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 14.00, priceLatest: 14.50, priceMedian: 14.10, priceSafe: 13.39, weaponType: 'M4A4', collection: 'Horizon Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/desolate_space' },
  { name: 'AWP | Mortis', marketHashName: 'AWP | Mortis (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 22.00, priceLatest: 22.80, priceMedian: 22.10, priceSafe: 20.99, weaponType: 'AWP', collection: 'Spectrum Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/mortis' },
  { name: 'AWP | BOOM', marketHashName: 'AWP | BOOM (Factory New)', rarity: 'Restricted', wear: 'Factory New', priceAvg: 9.80, priceLatest: 10.10, priceMedian: 9.90, priceSafe: 9.31, weaponType: 'AWP', collection: 'Operation Hydra Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/boom' },
  { name: 'SG 553 | Integrale', marketHashName: 'SG 553 | Integrale (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 11.00, priceLatest: 11.30, priceMedian: 11.10, priceSafe: 10.49, weaponType: 'SG 553', collection: 'CS20 Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/integrale' },
  { name: 'Glock-18 | Water Elemental', marketHashName: 'Glock-18 | Water Elemental (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 7.50, priceLatest: 7.70, priceMedian: 7.55, priceSafe: 7.15, weaponType: 'Glock-18', collection: 'Breakout Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/water_elemental' },
  { name: 'USP-S | Cortex', marketHashName: 'USP-S | Cortex (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 5.50, priceLatest: 5.70, priceMedian: 5.55, priceSafe: 5.22, weaponType: 'USP-S', collection: 'Spectrum 2 Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/cortex' },
  { name: 'P250 | Asiimov', marketHashName: 'P250 | Asiimov (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 4.80, priceLatest: 5.00, priceMedian: 4.85, priceSafe: 4.56, weaponType: 'P250', collection: 'Chroma 2 Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/asiimov_p250' },

  // Mil-Spec — lower value, high volume
  { name: 'AK-47 | Aquamarine Revenge', marketHashName: 'AK-47 | Aquamarine Revenge (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 6.20, priceLatest: 6.40, priceMedian: 6.25, priceSafe: 5.94, weaponType: 'AK-47', collection: 'Falchion Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/aquamarine_revenge' },
  { name: 'AK-47 | Phantom Disruptor', marketHashName: 'AK-47 | Phantom Disruptor (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.90, priceLatest: 0.95, priceMedian: 0.91, priceSafe: 0.86, weaponType: 'AK-47', collection: 'Gamma Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/phantom_disruptor' },
  { name: 'AK-47 | Elite Build', marketHashName: 'AK-47 | Elite Build (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 3.40, priceLatest: 3.50, priceMedian: 3.42, priceSafe: 3.24, weaponType: 'AK-47', collection: 'Spectrum Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/elite_build' },
  { name: 'M4A4 | Evil Daimyo', marketHashName: 'M4A4 | Evil Daimyo (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 1.20, priceLatest: 1.25, priceMedian: 1.21, priceSafe: 1.15, weaponType: 'M4A4', collection: 'Chroma Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/evil_daimyo' },
  { name: 'M4A1-S | Leaded Glass', marketHashName: 'M4A1-S | Leaded Glass (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 2.80, priceLatest: 2.90, priceMedian: 2.82, priceSafe: 2.68, weaponType: 'M4A1-S', collection: 'Prisma 2 Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/leaded_glass' },
  { name: 'AWP | Worm God', marketHashName: 'AWP | Worm God (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 1.50, priceLatest: 1.55, priceMedian: 1.51, priceSafe: 1.43, weaponType: 'AWP', collection: 'Chroma 3 Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/worm_god' },
  { name: 'Glock-18 | Vogue', marketHashName: 'Glock-18 | Vogue (Factory New)', rarity: 'Mil-Spec', wear: 'Factory New', priceAvg: 0.85, priceLatest: 0.88, priceMedian: 0.86, priceSafe: 0.81, weaponType: 'Glock-18', collection: 'Chroma 2 Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/vogue' },
  { name: 'USP-S | Guardian', marketHashName: 'USP-S | Guardian (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 1.80, priceLatest: 1.85, priceMedian: 1.81, priceSafe: 1.72, weaponType: 'USP-S', collection: 'Cache Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/guardian' },
  { name: 'Tec-9 | Re-Entry', marketHashName: 'Tec-9 | Re-Entry (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.55, priceLatest: 0.57, priceMedian: 0.56, priceSafe: 0.53, weaponType: 'Tec-9', collection: 'Chroma Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/re_entry' },
  { name: 'Five-SeveN | Fowl Play', marketHashName: 'Five-SeveN | Fowl Play (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.42, priceLatest: 0.44, priceMedian: 0.43, priceSafe: 0.40, weaponType: 'Five-SeveN', collection: 'Gamma 2 Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/fowl_play' },

  // StatTrak — premium versions
  { name: 'AK-47 | Redline', marketHashName: 'StatTrak™ AK-47 | Redline (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 32.00, priceLatest: 33.00, priceMedian: 32.20, priceSafe: 30.59, weaponType: 'AK-47', collection: 'Phoenix Collection', itemGroup: 'rifle', isStattrak: true, imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/stattrak_redline' },
  { name: 'AWP | Asiimov', marketHashName: 'StatTrak™ AWP | Asiimov (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 250.00, priceLatest: 258.00, priceMedian: 252.00, priceSafe: 238.40, weaponType: 'AWP', collection: 'Phoenix Collection', itemGroup: 'sniper rifle', isStattrak: true, imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/stattrak_asiimov_awp' },
  { name: 'M4A4 | Asiimov', marketHashName: 'StatTrak™ M4A4 | Asiimov (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 110.00, priceLatest: 113.00, priceMedian: 110.50, priceSafe: 104.97, weaponType: 'M4A4', collection: 'Phoenix Collection', itemGroup: 'rifle', isStattrak: true, imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/stattrak_asiimov_m4a4' },

  // Additional Restricted/Classified to hit 55+
  { name: 'AK-47 | Panthera onca', marketHashName: 'AK-47 | Panthera onca (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 55.00, priceLatest: 57.00, priceMedian: 55.50, priceSafe: 52.72, weaponType: 'AK-47', collection: 'Dreams & Nightmares Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/panthera_onca' },
  { name: 'M4A1-S | Printstream', marketHashName: 'M4A1-S | Printstream (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 62.00, priceLatest: 64.00, priceMedian: 62.50, priceSafe: 59.37, weaponType: 'M4A1-S', collection: 'Operation Riptide Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/printstream_m4a1s' },
  { name: 'USP-S | Printstream', marketHashName: 'USP-S | Printstream (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 45.00, priceLatest: 46.50, priceMedian: 45.30, priceSafe: 43.03, weaponType: 'USP-S', collection: 'Operation Riptide Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/printstream_usp' },
  { name: 'Glock-18 | Gamma Doppler', marketHashName: 'Glock-18 | Gamma Doppler (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 18.00, priceLatest: 18.50, priceMedian: 18.10, priceSafe: 17.19, weaponType: 'Glock-18', collection: 'Gamma Collection', itemGroup: 'pistol', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/gamma_doppler_glock' },
  { name: 'AWP | Neo-Noir', marketHashName: 'AWP | Neo-Noir (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 55.00, priceLatest: 57.00, priceMedian: 55.50, priceSafe: 52.72, weaponType: 'AWP', collection: 'Danger Zone Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/neo_noir_awp' },
  { name: 'AK-47 | The Empress', marketHashName: 'AK-47 | The Empress (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 32.00, priceLatest: 33.00, priceMedian: 32.20, priceSafe: 30.59, weaponType: 'AK-47', collection: 'Spectrum 2 Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/the_empress' },
  { name: 'M4A4 | Neo-Noir', marketHashName: 'M4A4 | Neo-Noir (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 28.00, priceLatest: 29.00, priceMedian: 28.20, priceSafe: 26.79, weaponType: 'M4A4', collection: 'Danger Zone Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/neo_noir_m4a4' },
  { name: 'FAMAS | Eye of Athena', marketHashName: 'FAMAS | Eye of Athena (Factory New)', rarity: 'Classified', wear: 'Factory New', priceAvg: 3.80, priceLatest: 3.90, priceMedian: 3.82, priceSafe: 3.63, weaponType: 'FAMAS', collection: 'Clutch Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/eye_of_athena' },
  { name: 'SG 553 | Aerial', marketHashName: 'SG 553 | Aerial (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 0.95, priceLatest: 0.98, priceMedian: 0.96, priceSafe: 0.91, weaponType: 'SG 553', collection: 'Chroma 3 Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/aerial' },
  { name: 'FAMAS | Meltdown', marketHashName: 'FAMAS | Meltdown (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 1.10, priceLatest: 1.14, priceMedian: 1.11, priceSafe: 1.05, weaponType: 'FAMAS', collection: 'Cobblestone Collection', itemGroup: 'rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/meltdown' },
  { name: 'MP9 | Hypnotic', marketHashName: 'MP9 | Hypnotic (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 3.20, priceLatest: 3.30, priceMedian: 3.22, priceSafe: 3.04, weaponType: 'MP9', collection: 'Cobblestone Collection', itemGroup: 'smg', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/hypnotic' },
  { name: 'MAC-10 | Neon Rider', marketHashName: 'MAC-10 | Neon Rider (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 2.50, priceLatest: 2.60, priceMedian: 2.52, priceSafe: 2.39, weaponType: 'MAC-10', collection: 'Horizon Collection', itemGroup: 'smg', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/neon_rider_mac10' },
  { name: 'P90 | Chopper', marketHashName: 'P90 | Chopper (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 1.80, priceLatest: 1.85, priceMedian: 1.81, priceSafe: 1.72, weaponType: 'P90', collection: 'Clutch Collection', itemGroup: 'smg', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/chopper' },
  { name: 'MP7 | Akoben', marketHashName: 'MP7 | Akoben (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.65, priceLatest: 0.67, priceMedian: 0.66, priceSafe: 0.62, weaponType: 'MP7', collection: 'Prisma Collection', itemGroup: 'smg', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/akoben' },
  { name: 'Nova | Gila', marketHashName: 'Nova | Gila (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.48, priceLatest: 0.50, priceMedian: 0.49, priceSafe: 0.46, weaponType: 'Nova', collection: 'Canals Collection', itemGroup: 'shotgun', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/gila' },
  { name: 'XM1014 | Zombie Offensive', marketHashName: 'XM1014 | Zombie Offensive (Field-Tested)', rarity: 'Mil-Spec', wear: 'Field-Tested', priceAvg: 0.38, priceLatest: 0.39, priceMedian: 0.38, priceSafe: 0.36, weaponType: 'XM1014', collection: 'Gamma 2 Collection', itemGroup: 'shotgun', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/zombie_offensive' },
  { name: 'SSG 08 | Blood in the Water', marketHashName: 'SSG 08 | Blood in the Water (Field-Tested)', rarity: 'Classified', wear: 'Field-Tested', priceAvg: 16.00, priceLatest: 16.50, priceMedian: 16.10, priceSafe: 15.29, weaponType: 'SSG 08', collection: 'Recoil Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/blood_in_the_water' },
  { name: 'AWP | Chromatic Aberration', marketHashName: 'AWP | Chromatic Aberration (Field-Tested)', rarity: 'Restricted', wear: 'Field-Tested', priceAvg: 4.20, priceLatest: 4.35, priceMedian: 4.22, priceSafe: 4.01, weaponType: 'AWP', collection: 'Prisma Collection', itemGroup: 'sniper rifle', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/chromatic_aberration' },
];

// ── Cases ────────────────────────────────────────────────────────────────────
const CASES = [
  { name: 'Kilowatt Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/kilowatt_case', price: 1.85, remaining: 8500000, dropped: 22000000, unboxed: 3200000, priceChange24h: 0.54, priceChange7d: -1.08, isDiscontinued: false, releaseDate: new Date('2024-02-06') },
  { name: 'Revolution Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/revolution_case', price: 0.72, remaining: 12000000, dropped: 38000000, unboxed: 14500000, priceChange24h: -0.28, priceChange7d: 1.39, isDiscontinued: false, releaseDate: new Date('2023-02-09') },
  { name: 'Recoil Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/recoil_case', price: 0.44, remaining: 9000000, dropped: 45000000, unboxed: 18000000, priceChange24h: 0.00, priceChange7d: -0.45, isDiscontinued: false, releaseDate: new Date('2022-07-01') },
  { name: 'Dreams & Nightmares Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/dreams_nightmares_case', price: 0.58, remaining: 7200000, dropped: 29000000, unboxed: 11000000, priceChange24h: 1.75, priceChange7d: 3.57, isDiscontinued: false, releaseDate: new Date('2022-01-21') },
  { name: 'Snakebite Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/snakebite_case', price: 0.36, remaining: 5400000, dropped: 52000000, unboxed: 24000000, priceChange24h: 0.00, priceChange7d: 0.00, isDiscontinued: false, releaseDate: new Date('2021-05-03') },
  { name: 'Fracture Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/fracture_case', price: 0.52, remaining: 6100000, dropped: 48000000, unboxed: 22000000, priceChange24h: -0.96, priceChange7d: 1.96, isDiscontinued: false, releaseDate: new Date('2020-09-02') },
  { name: 'Prisma 2 Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/prisma2_case', price: 0.41, remaining: 4800000, dropped: 58000000, unboxed: 27000000, priceChange24h: 0.49, priceChange7d: -0.97, isDiscontinued: false, releaseDate: new Date('2020-03-31') },
  { name: 'Clutch Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/clutch_case', price: 0.38, remaining: 3900000, dropped: 62000000, unboxed: 29000000, priceChange24h: 0.00, priceChange7d: -2.56, isDiscontinued: false, releaseDate: new Date('2018-02-15') },
  { name: 'Gamma 2 Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/gamma2_case', price: 1.20, remaining: 2200000, dropped: 38000000, unboxed: 16000000, priceChange24h: 0.84, priceChange7d: 0.84, isDiscontinued: false, releaseDate: new Date('2016-09-29') },
  { name: 'Spectrum 2 Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/spectrum2_case', price: 0.95, remaining: 2800000, dropped: 41000000, unboxed: 18500000, priceChange24h: -0.52, priceChange7d: 2.15, isDiscontinued: false, releaseDate: new Date('2017-09-14') },
  { name: 'Falchion Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/falchion_case', price: 2.80, remaining: 950000, dropped: 28000000, unboxed: 13500000, priceChange24h: 0.36, priceChange7d: 1.44, isDiscontinued: false, releaseDate: new Date('2015-05-26') },
  { name: 'Shadow Case', imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/class/730/shadow_case', price: 3.20, remaining: 820000, dropped: 25000000, unboxed: 12000000, priceChange24h: -0.62, priceChange7d: 3.23, isDiscontinued: false, releaseDate: new Date('2015-09-17') },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎮  Seeding CS2 skins and cases...\n');

  // Skins
  let skinCount = 0;
  for (const skin of SKINS) {
    await prisma.skin.upsert({
      where: { marketHashName: skin.marketHashName },
      update: {
        priceAvg: skin.priceAvg,
        priceLatest: skin.priceLatest,
        priceMedian: skin.priceMedian,
        priceSafe: skin.priceSafe,
        priceUpdatedAt: new Date(),
      },
      create: {
        name: skin.name,
        marketHashName: skin.marketHashName,
        rarity: skin.rarity,
        wear: skin.wear,
        priceAvg: skin.priceAvg,
        priceLatest: skin.priceLatest,
        priceMedian: skin.priceMedian,
        priceSafe: skin.priceSafe,
        priceMin: skin.priceAvg * 0.85,
        priceMax: skin.priceAvg * 1.20,
        weaponType: skin.weaponType,
        collection: skin.collection,
        imageUrl: skin.imageUrl,
        itemGroup: skin.itemGroup,
        isStattrak: skin.isStattrak ?? false,
        isStar: false,
        itemType: 'Skin',
        itemName: skin.name,
        priceUpdatedAt: new Date(),
        sold30d: Math.floor(Math.random() * 5000) + 100,
        sold7d: Math.floor(Math.random() * 1500) + 20,
        sold24h: Math.floor(Math.random() * 300) + 5,
        offerVolume: Math.floor(Math.random() * 2000) + 50,
      }
    });
    skinCount++;
  }
  console.log(`✅  Seeded ${skinCount} skins`);

  // Cases
  let caseCount = 0;
  for (const c of CASES) {
    await prisma.case.upsert({
      where: { name: c.name },
      update: {
        price: c.price,
        priceChange24h: c.priceChange24h,
        priceChange7d: c.priceChange7d,
        lastUpdated: new Date(),
      },
      create: {
        name: c.name,
        imageUrl: c.imageUrl,
        price: c.price,
        remaining: c.remaining,
        dropped: c.dropped,
        unboxed: c.unboxed,
        priceChange24h: c.priceChange24h,
        priceChange7d: c.priceChange7d,
        isDiscontinued: c.isDiscontinued,
        releaseDate: c.releaseDate,
        marketCap: c.price * c.remaining,
        timeToExtinction: c.remaining / ((c.dropped - c.unboxed) / 365),
        lastUpdated: new Date(),
      }
    });
    caseCount++;
  }
  console.log(`✅  Seeded ${caseCount} cases`);

  const totalSkins = await prisma.skin.count();
  const totalCases = await prisma.case.count();
  console.log(`\n📊  DB totals: ${totalSkins} skins, ${totalCases} cases`);
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
