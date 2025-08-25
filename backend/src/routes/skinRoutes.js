import express from "express";
import prisma from "../prisma/prismaClient.js";
import { getPriceHistory } from "../controllers/skinController.js";
import { fetchSkinPrice } from "../services/steamService.js";

const router = express.Router();

// Get skins with enhanced filters, sort & pagination
router.get("/", async (req, res) => {
  try {
    const {
      q, min, max, rarity, wear, quality, stattrak, special, category,
      sort = "name_asc", page = 1, pageSize = 24,
    } = req.query;

    const take = Math.min(Math.max(Number(pageSize) || 24, 1), 60);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      ...(q ? { 
        OR: [
          { name: { contains: String(q), mode: "insensitive" } },
          { marketHashName: { contains: String(q), mode: "insensitive" } },
          { itemName: { contains: String(q), mode: "insensitive" } },
        ]
      } : {}),
      ...(rarity ? { rarity: String(rarity) } : {}),
      ...(wear ? { wear: String(wear) } : {}),
      ...(quality ? { quality: String(quality) } : {}),
      ...(stattrak !== undefined ? { isStattrak: String(stattrak) === "true" } : {}),
      ...(special !== undefined ? { isStar: String(special) === "true" } : {}),
      ...((min || max) ? {
        OR: [
          { priceAvg: {
            ...(min ? { gte: Number(min) } : {}),
            ...(max ? { lte: Number(max) } : {}),
          }},
          { priceMedian: {
            ...(min ? { gte: Number(min) } : {}),
            ...(max ? { lte: Number(max) } : {}),
          }}
        ]
      } : {}),
    };

    // Category filter - map to weapon types
    if (category) {
      const categoryKeywords = {
        knives: {
          // Only items that start with ★ (star)
          patterns: ["★ "],
          // Specific knife names
          names: ["Bayonet", "Karambit", "M9 Bayonet", "Talon Knife", "Huntsman Knife", "Falchion Knife", "Navaja Knife", "Ursus Knife", "Paracord Knife", "Skeleton Knife", "Classic Knife", "Flip Knife", "Gut Knife", "Bowie Knife", "Stiletto Knife", "Shadow Daggers", "Nomad Knife"]
        },
        gloves: {
          patterns: ["Gloves", "Hand Wraps"],
          names: ["Moto Gloves", "Specialist Gloves", "Sport Gloves", "Driver Gloves", "Bloodhound Gloves"]
        },
        pistols: {
          patterns: ["Glock", "USP", "P250", "Desert Eagle", "Tec-9", "CZ75", "Revolver", "Dual", "R8", "P2000", "Five-SeveN"],
          names: ["Glock", "USP", "P250", "Desert Eagle", "Tec-9", "CZ75", "Revolver", "Dual", "R8", "P2000", "Five-SeveN"]
        },
        smgs: {
          patterns: ["MP5", "MP7", "UMP", "P90", "MAC-10", "PP-Bizon", "MP9"],
          names: ["MP5", "MP7", "UMP", "P90", "MAC-10", "PP-Bizon", "MP9"]
        },
        rifles: {
          patterns: ["AK", "M4", "AWP", "AUG", "SG", "FAMAS", "Galil", "SCAR", "G3SG1", "SSG 08"],
          names: ["AK", "M4", "AWP", "AUG", "SG", "FAMAS", "Galil", "SCAR", "G3SG1", "SSG 08"]
        },
        shotguns: {
          patterns: ["Nova", "XM1014", "MAG-7", "Sawed-Off"],
          names: ["Nova", "XM1014", "MAG-7", "Sawed-Off"]
        },
        machineGuns: {
          patterns: ["M249", "Negev"],
          names: ["M249", "Negev"]
        },
        stickers: {
          patterns: ["Sticker", "Decal"],
          names: ["Sticker", "Decal", "2018", "2019", "2017", "2016", "2015", "2014", "2020", "2021", "2022", "2023", "2024", "2025"]
        },
        agents: {
          patterns: ["Agent", "Character"],
          names: ["SWAT", "FBI", "SAS", "KSK", "NSWC", "SEAL", "TACP", "Phoenix", "Sabre", "Elite", "Freaky", "Blitz", "Gendarmerie", "Professionals", "Guerrilla", "Brazilian", "NZSAS", "Humanity", "Hundredth", "RAD", "Roam", "Mord", "Midnight", "New Beat", "BBNO", "Damjan", "Awolnation", "Verkkars", "Twerl", "Ekko", "Sidetrack", "Cavalry", "Frogman"]
        },
        cases: {
          patterns: ["Case", "Container", "Package", "Capsule", "Box", "Pack"],
          names: ["Case", "Container", "Package", "Capsule", "Box", "Pack"]
        },
        charms: {
          patterns: ["Charm", "Keychain", "Pin"],
          names: ["Charm", "Keychain", "Pin"]
        }
      };

      const categoryConfig = categoryKeywords[category];
      if (categoryConfig) {
        // Build OR condition for this category
        const categoryConditions = [];
        
        // Pattern matching (most specific) - items that start with these patterns
        if (categoryConfig.patterns.length > 0) {
          categoryConditions.push({
            OR: categoryConfig.patterns.map(pattern => ({
              name: { startsWith: pattern, mode: 'insensitive' }
            }))
          });
        }
        
        // Name matching - items that contain these names
        if (categoryConfig.names.length > 0) {
          categoryConditions.push({
            OR: categoryConfig.names.map(name => ({
              name: { contains: name, mode: 'insensitive' }
            }))
          });
        }

        // Add category conditions to main where clause
        where.OR = where.OR || [];
        where.OR.push({
          OR: categoryConditions
        });
      }
    }

    console.log("[DEBUG] Final where clause:", JSON.stringify(where, null, 2));

    const orderByMap = {
      name_asc:  [{ name: "asc" }],
      name_desc: [{ name: "desc" }],
      price_asc: [{ priceAvg: "asc", nulls: "last" }, { priceMedian: "asc", nulls: "last" }, { name: "asc" }],
      price_desc:[{ priceAvg: "desc", nulls: "last" }, { priceMedian: "desc", nulls: "last" }, { name: "asc" }],
      newest:    [{ id: "desc" }],
      popularity_desc: [
        { sold24h: "desc", nulls: "last" }, 
        { offerVolume: "desc", nulls: "last" }, 
        { name: "asc" }
      ],
      wear_asc: [
        { 
          wear: {
            sort: "asc",
            nulls: "last",
            // Custom wear order: fn, mw, ft, ww, bs
            custom: ["fn", "mw", "ft", "ww", "bs"]
          }
        }, 
        { name: "asc" }
      ],
      wear_desc: [
        { 
          wear: {
            sort: "desc",
            nulls: "last",
            // Custom wear order: bs, ww, ft, mw, fn
            custom: ["bs", "ww", "ft", "mw", "fn"]
          }
        }, 
        { name: "asc" }
      ],
    };
    
    // Handle custom wear sorting since Prisma doesn't support custom order
    let orderBy = orderByMap[sort] || [{ name: "asc" }];
    
    // Special handling for wear sorting
    if (sort === "wear_asc" || sort === "wear_desc") {
      // Use simple wear sorting for now, we'll sort in memory if needed
      orderBy = sort === "wear_asc" 
        ? [{ wear: "asc", nulls: "last" }, { name: "asc" }]
        : [{ wear: "desc", nulls: "last" }, { name: "asc" }];
    }

    const [items, total] = await Promise.all([
      prisma.skin.findMany({ 
        where, 
        orderBy, 
        take, 
        skip,
        select: {
          id: true,
          name: true,
          marketHashName: true,
          imageUrl: true,
          weaponType: true,
          wear: true,
          rarity: true,
          quality: true,
          isStattrak: true,
          isStar: true,
          priceAvg: true,
          priceMedian: true,
          offerVolume: true,
          sold24h: true
        }
      }),
      prisma.skin.count({ where }),
    ]);

    console.log(`[DEBUG] Found ${items.length} skins for category: ${category}`);

    res.json({ 
      items, 
      total, 
      page: Number(page) || 1, 
      pageSize: take 
    });
  } catch (error) {
    console.error("[DEBUG] Error in skins route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const skins = await prisma.skin.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            marketHashName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 20,
    });
    res.json(skins);
  } catch (e) {
    res.status(500).json({ message: "Search failed." });
  }
});

// {/* Get filter options for UI */}
router.get("/filters", async (req, res) => {
  try {
    const [weaponTypes, wears, rarities, qualities] = await Promise.all([
      prisma.skin.findMany({
        select: { weaponType: true },
        where: { weaponType: { not: null } },
        distinct: ['weaponType'],
      }),
      prisma.skin.findMany({
        select: { wear: true },
        where: { wear: { not: null } },
        distinct: ['wear'],
      }),
      prisma.skin.findMany({
        select: { rarity: true },
        where: { rarity: { not: null } },
        distinct: ['rarity'],
      }),
      prisma.skin.findMany({
        select: { quality: true },
        where: { quality: { not: null } },
        distinct: ['quality'],
      }),
    ]);

    const result = {
      weaponTypes: weaponTypes.map(w => w.weaponType).filter(Boolean),
      wears: wears.map(w => w.wear).filter(Boolean),
      rarities: rarities.map(r => r.rarity).filter(Boolean),
      qualities: qualities.map(q => q.quality).filter(Boolean),
    };
    
    console.log('[DEBUG] Filter options:', result);
    res.json(result);
  } catch (e) {
    console.error("Get filters error:", e);
    res.status(500).json({ message: "Failed to fetch filter options." });
  }
});

// Get skin categories (like skinbid.com)
router.get("/categories", async (_req, res) => {
  try {
    const categories = {
      knives: ["★", "knife", "bayonet", "karambit", "m9", "talon", "huntsman", "falchion", "navaja", "ursus", "paracord", "skeleton", "classic", "flip", "gut", "bowie", "stiletto", "shadow", "nomad"],
      gloves: ["gloves", "hand wraps", "moto", "specialist", "sport", "driver", "wraps"],
      pistols: ["pistol", "glock", "usp", "p250", "deagle", "tec-9", "cz75", "revolver", "dual", "r8", "p2000", "five-seven"],
      smgs: ["smg", "mp5", "mp7", "ump", "p90", "mac-10", "pp-bizon", "mp9"],
      rifles: ["rifle", "ak", "m4", "awp", "aug", "sg", "famas", "galil", "scar", "g3sg1", "ssg08"],
      shotguns: ["shotgun", "nova", "xm1014", "mag7", "sawed-off", "m249"],
      machineGuns: ["machine gun", "m249", "negev"],
      stickers: ["sticker", "decal"],
      agents: ["agent", "character"],
      cases: ["case", "container", "package"],
      charms: ["charm", "keychain"]
    };

    // Get all unique weapon types from database
    const weaponTypes = await prisma.skin.findMany({
      select: { weaponType: true },
      where: { weaponType: { not: null } },
      distinct: ['weaponType']
    });

    const uniqueWeaponTypes = weaponTypes.map(wt => wt.weaponType).filter(Boolean);

    // Count skins per category
    const categoryCounts = {};
    for (const [category, keywords] of Object.entries(categories)) {
      const matchingTypes = uniqueWeaponTypes.filter(type => 
        keywords.some(keyword => 
          type.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // Count total skins for this category
      const count = await prisma.skin.count({
        where: {
          weaponType: { in: matchingTypes }
        }
      });
      
      categoryCounts[category] = {
        count,
        weaponTypes: matchingTypes
      };
    }

    res.json({
      ok: true,
      categories: categoryCounts,
      totalSkins: await prisma.skin.count()
    });
  } catch (error) {
    console.error("[/categories] error:", error);
    res.status(500).json({ ok: false, error: "categories-error" });
  }
});

router.get("/:skinId", async (req, res) => {
  const skinId = parseInt(req.params.skinId, 10);
  if (isNaN(skinId)) {
    return res.status(400).json({ message: "Invalid skinId" });
  }
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
    });
    if (!skin) {
      return res.status(404).json({ message: "Skin not found" });
    }

    console.log(`[DEBUG] Fetching skin ${skinId}: ${skin.marketHashName}`);
    console.log(`[DEBUG] Raw skin object:`, JSON.stringify(skin, null, 2));

    // Read latest price from DB
    let marketPrice = null;
    const latest = await prisma.priceHistory.findFirst({
      where: { skinId },
      orderBy: { date: "desc" },
      select: { price: true },
    });
    console.log(`[DEBUG] Latest DB price:`, latest);
    
    if (latest?.price != null) {
      marketPrice = latest.price;
      console.log(`[DEBUG] Using DB price: ${marketPrice}`);
    } else {
      // Try to use existing price fields from skin object
      console.log(`[DEBUG] Checking skin object prices: priceMedian=${skin.priceMedian}, priceAvg=${skin.priceAvg}`);
      
      if (skin.priceMedian || skin.priceAvg) {
        marketPrice = skin.priceMedian || skin.priceAvg;
        console.log(`[DEBUG] Using skin object price: ${marketPrice}`);
      } else {
        console.log(`[DEBUG] No skin object prices, trying live Steam fetch...`);
        // Fallback: live fetch from Steam
        try {
          const priceData = await fetchSkinPrice(skin.marketHashName);
          console.log(`[DEBUG] Steam API response:`, JSON.stringify(priceData, null, 2));
          
          const raw = priceData?.lowest_price || priceData?.median_price || null;
          console.log(`[DEBUG] Raw price from Steam:`, raw);
          
          if (raw) {
            const numeric = parseFloat(String(raw).replace(/[^\d.,-]/g, "").replace(",", "."));
            marketPrice = Number.isFinite(numeric) ? numeric : null;
            console.log(`[DEBUG] Parsed numeric price:`, numeric, `→ marketPrice:`, marketPrice);
          } else {
            console.log(`[DEBUG] No valid price found in Steam response`);
          }
        } catch (e) {
          console.error(`[DEBUG] Steam fetch error:`, e.message);
        }
      }
    }

    const response = { ...skin, marketPrice };
    console.log(`[DEBUG] Final response:`, JSON.stringify(response, null, 2));
    console.log(`[DEBUG] marketPrice in response:`, response.marketPrice, `(type: ${typeof response.marketPrice})`);
    
    res.json(response);
  } catch (e) {
    console.error(`[DEBUG] Route error:`, e);
    res.status(500).json({ message: "Error fetching skin" });
  }
});

// Price history for skin
router.get("/:skinId/history", getPriceHistory);

export default router;
