// /backend/scripts/mapCasesToMarketCSGO.js — [Backend]
// {/* Map our database cases to Market.CSGO API item IDs */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mapCasesToMarketCSGO() {
  console.log("🔗 Mapping our cases to Market.CSGO API item IDs...");
  
  try {
    // Get all cases from our database
    const ourCases = await prisma.case.findMany({
      select: {
        id: true,
        name: true,
        releaseDate: true,
        isDiscontinued: true
      }
    });
    
    console.log(`📊 Found ${ourCases.length} cases in our database`);
    
    // Get all cases from Market.CSGO API
    const allItemsResponse = await fetch('https://market.csgo.com/api/v2/full-history/all.json');
    if (!allItemsResponse.ok) {
      throw new Error(`API Error: ${allItemsResponse.status} ${allItemsResponse.statusText}`);
    }
    
    const allItemsData = await allItemsResponse.json();
    const marketItems = Object.entries(allItemsData.history).map(([marketName, itemId]) => ({
      market_name: marketName,
      item_id: itemId
    }));
    
    // Filter for cases/containers
    const marketCases = marketItems.filter(item => 
      item.market_name && (
        item.market_name.toLowerCase().includes('case') ||
        item.market_name.toLowerCase().includes('container') ||
        item.market_name.toLowerCase().includes('weapon case')
      )
    );
    
    console.log(`🎲 Found ${marketCases.length} cases in Market.CSGO API`);
    
    // Create mapping
    const mappings = [];
    const unmatchedCases = [];
    
    for (const ourCase of ourCases) {
      console.log(`\n🔍 Mapping: ${ourCase.name}`);
      
      // Try different matching strategies
      let matched = false;
      let bestMatch = null;
      let bestScore = 0;
      
      for (const marketCase of marketCases) {
        const score = calculateMatchScore(ourCase.name, marketCase.market_name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = marketCase;
        }
      }
      
      if (bestMatch && bestScore > 0.6) { // 60% similarity threshold
        mappings.push({
          ourCase: ourCase,
          marketCase: bestMatch,
          score: bestScore
        });
        console.log(`  ✅ Matched: "${bestMatch.market_name}" (ID: ${bestMatch.item_id}, Score: ${bestScore.toFixed(2)})`);
        matched = true;
      }
      
      if (!matched) {
        unmatchedCases.push(ourCase);
        console.log(`  ❌ No match found`);
      }
    }
    
    console.log(`\n📊 Mapping Results:`);
    console.log(`  ✅ Matched: ${mappings.length} cases`);
    console.log(`  ❌ Unmatched: ${unmatchedCases.length} cases`);
    
    // Show unmatched cases for manual review
    if (unmatchedCases.length > 0) {
      console.log(`\n🔍 Unmatched cases (need manual review):`);
      unmatchedCases.forEach(caseItem => {
        console.log(`  - ${caseItem.name}`);
      });
    }
    
    // Show some sample matches
    console.log(`\n📋 Sample matches:`);
    mappings.slice(0, 10).forEach(mapping => {
      console.log(`  ${mapping.ourCase.name} → ${mapping.marketCase.market_name} (${mapping.marketCase.item_id})`);
    });
    
    // Save mappings to a file for reference
    const mappingData = {
      timestamp: new Date().toISOString(),
      totalMappings: mappings.length,
      totalUnmatched: unmatchedCases.length,
      mappings: mappings.map(m => ({
        ourCaseId: m.ourCase.id,
        ourCaseName: m.ourCase.name,
        marketItemId: m.marketCase.item_id,
        marketItemName: m.marketCase.market_name,
        matchScore: m.score
      })),
      unmatched: unmatchedCases.map(c => ({
        ourCaseId: c.id,
        ourCaseName: c.name
      }))
    };
    
    const fs = await import('fs');
    fs.writeFileSync('scripts/case-mapping.json', JSON.stringify(mappingData, null, 2));
    console.log(`\n💾 Mappings saved to backend/scripts/case-mapping.json`);
    
    return mappings;
    
  } catch (error) {
    console.error("❌ Error mapping cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateMatchScore(ourName, marketName) {
  const our = ourName.toLowerCase();
  const market = marketName.toLowerCase();
  
  // Exact match
  if (our === market) return 1.0;
  
  // Contains match
  if (our.includes(market) || market.includes(our)) return 0.9;
  
  // Word-based matching
  const ourWords = our.split(/\s+/);
  const marketWords = market.split(/\s+/);
  
  let commonWords = 0;
  for (const ourWord of ourWords) {
    if (ourWord.length > 2) { // Skip short words
      for (const marketWord of marketWords) {
        if (ourWord === marketWord || 
            ourWord.includes(marketWord) || 
            marketWord.includes(ourWord)) {
          commonWords++;
          break;
        }
      }
    }
  }
  
  let wordScore = commonWords / Math.max(ourWords.length, marketWords.length);
  
  // Special case patterns
  if (our.includes('operation') && market.includes('operation')) wordScore += 0.2;
  if (our.includes('chroma') && market.includes('chroma')) wordScore += 0.2;
  if (our.includes('weapon') && market.includes('weapon')) wordScore += 0.2;
  if (our.includes('case') && market.includes('case')) wordScore += 0.1;
  
  return Math.min(wordScore, 1.0);
}

mapCasesToMarketCSGO();
