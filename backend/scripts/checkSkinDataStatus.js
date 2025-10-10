import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSkinDataStatus() {
  try {
    console.log('📊 Checking skin data status across the platform...\n');
    
    // Get total counts
    const totalSkins = await prisma.skin.count();
    
    // Check market data completeness
    const skinsWithPriceLatest = await prisma.skin.count({
      where: { priceLatest: { not: null } }
    });
    
    const skinsWithOfferVolume = await prisma.skin.count({
      where: { offerVolume: { not: null } }
    });
    
    const skinsWithSold7d = await prisma.skin.count({
      where: { sold7d: { not: null } }
    });
    
    const skinsWithBuyOrderPrice = await prisma.skin.count({
      where: { buyOrderPrice: { not: null } }
    });
    
    // Check history data
    const skinsWithPriceHistory = await prisma.priceHistory.groupBy({
      by: ['skinId'],
      _count: { skinId: true }
    });
    
    const skinsWithQuantityHistory = await prisma.skinQuantityHistory.groupBy({
      by: ['skinId'],
      _count: { skinId: true }
    });
    
    // Recent updates
    const recentUpdates = await prisma.skin.count({
      where: {
        priceUpdatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    console.log('🎯 SKIN DATA STATUS REPORT:');
    console.log('================================');
    console.log(`📊 Total Skins: ${totalSkins.toLocaleString()}`);
    console.log('');
    
    console.log('💰 MARKET DATA COMPLETENESS:');
    console.log(`   • Price Latest: ${skinsWithPriceLatest.toLocaleString()} / ${totalSkins.toLocaleString()} (${Math.round(skinsWithPriceLatest / totalSkins * 100)}%)`);
    console.log(`   • Offer Volume: ${skinsWithOfferVolume.toLocaleString()} / ${totalSkins.toLocaleString()} (${Math.round(skinsWithOfferVolume / totalSkins * 100)}%)`);
    console.log(`   • Sold 7d: ${skinsWithSold7d.toLocaleString()} / ${totalSkins.toLocaleString()} (${Math.round(skinsWithSold7d / totalSkins * 100)}%)`);
    console.log(`   • Buy Order Price: ${skinsWithBuyOrderPrice.toLocaleString()} / ${totalSkins.toLocaleString()} (${Math.round(skinsWithBuyOrderPrice / totalSkins * 100)}%)`);
    console.log('');
    
    console.log('📈 HISTORY DATA:');
    console.log(`   • Price History: ${skinsWithPriceHistory.length.toLocaleString()} skins`);
    console.log(`   • Quantity History: ${skinsWithQuantityHistory.length.toLocaleString()} skins`);
    console.log('');
    
    console.log('🔄 RECENT ACTIVITY:');
    console.log(`   • Updated in last 24h: ${recentUpdates.toLocaleString()} skins`);
    console.log('');
    
    // Calculate overall completeness
    const overallCompleteness = Math.round(
      (skinsWithPriceLatest + skinsWithOfferVolume + skinsWithSold7d + skinsWithBuyOrderPrice) / (totalSkins * 4) * 100
    );
    
    console.log('✨ OVERALL STATUS:');
    console.log(`   • Data Completeness: ${overallCompleteness}%`);
    
    if (overallCompleteness >= 95) {
      console.log('   🎉 EXCELLENT! Almost all skins have complete data!');
    } else if (overallCompleteness >= 80) {
      console.log('   ✅ GOOD! Most skins have market data!');
    } else if (overallCompleteness >= 50) {
      console.log('   ⚠️  PARTIAL: About half the skins have data!');
    } else {
      console.log('   ❌ LOW: Many skins still need data!');
    }
    
    console.log('\n🔍 Sample of recent skins with data:');
    const recentSkins = await prisma.skin.findMany({
      where: {
        priceLatest: { not: null },
        offerVolume: { not: null }
      },
      select: {
        id: true,
        name: true,
        priceLatest: true,
        offerVolume: true,
        sold7d: true
      },
      orderBy: { priceUpdatedAt: 'desc' },
      take: 5
    });
    
    recentSkins.forEach(skin => {
      console.log(`   • Skin ${skin.id}: ${skin.name} - $${skin.priceLatest} (vol: ${skin.offerVolume}, sold 7d: ${skin.sold7d})`);
    });

  } catch (error) {
    console.error('❌ Error checking skin data status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSkinDataStatus();
