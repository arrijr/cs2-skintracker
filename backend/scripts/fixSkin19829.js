import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const STEAMWEBAPI_KEY = process.env.STEAMWEBAPI_KEY;

if (!STEAMWEBAPI_KEY) {
    console.error('STEAMWEBAPI_KEY is not set in environment variables.');
    process.exit(1);
}

const getSteamMarketPrice = async (marketHashName) => {
    const url = `https://api.steamwebapi.com/steam/api/item?key=${STEAMWEBAPI_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`SteamWebAPI request failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data; // Contains price, volume, etc.
    } catch (error) {
        console.error(`Error fetching data for ${marketHashName}:`, error.message);
        return null;
    }
};

const fixSkin19829 = async () => {
    const skinId = 19829;
    console.log(`🔧 Fixing skin ${skinId} with REAL SteamWebAPI data...`);

    try {
        // Get current skin data
        const skin = await prisma.skin.findUnique({
            where: { id: skinId },
            select: {
                id: true,
                name: true,
                marketHashName: true,
                priceLatest: true,
                offerVolume: true,
                sold7d: true,
                priceUpdatedAt: true
            }
        });

        if (!skin) {
            console.log(`❌ Skin ${skinId} not found`);
            return;
        }

        console.log(`📊 Current data for "${skin.name}":`);
        console.log(`  Market Hash: ${skin.marketHashName}`);
        console.log(`  Current Price: $${skin.priceLatest}`);
        console.log(`  Offer Volume: ${skin.offerVolume}`);
        console.log(`  Sold 7d: ${skin.sold7d}`);
        console.log(`  Last Updated: ${skin.priceUpdatedAt}`);

        // Get REAL data from SteamWebAPI
        console.log(`\n🔗 Fetching REAL data from SteamWebAPI...`);
        const marketData = await getSteamMarketPrice(skin.marketHashName);

        if (marketData && marketData.success) {
            const priceLatest = marketData.price || 0;
            const offerVolume = marketData.volume || 0;
            const sold7d = marketData.sold_7d || 0;
            const sold30d = marketData.sold_30d || 0;
            const sold90d = marketData.sold_90d || 0;
            const buyOrderPrice = marketData.buy_order_price || 0;
            const buyOrderVolume = marketData.buy_order_volume || 0;

            console.log(`✅ REAL SteamWebAPI data:`);
            console.log(`  Price: $${priceLatest}`);
            console.log(`  Volume: ${offerVolume}`);
            console.log(`  Sold 7d: ${sold7d}`);
            console.log(`  Sold 30d: ${sold30d}`);
            console.log(`  Buy Order Price: $${buyOrderPrice}`);
            console.log(`  Buy Order Volume: ${buyOrderVolume}`);

            // Update database with REAL data
            await prisma.skin.update({
                where: { id: skinId },
                data: {
                    priceLatest: priceLatest,
                    priceMedian: marketData.median_price || priceLatest,
                    offerVolume: offerVolume,
                    sold7d: sold7d,
                    sold30d: sold30d,
                    sold90d: sold90d,
                    buyOrderPrice: buyOrderPrice,
                    buyOrderVolume: buyOrderVolume,
                    priceUpdatedAt: new Date(),
                    unstable: false,
                    unstableReason: null
                }
            });

            console.log(`\n🎉 Skin ${skinId} updated with REAL SteamWebAPI data!`);
            console.log(`💰 New price: $${priceLatest} (was $${skin.priceLatest})`);
            console.log(`📦 New volume: ${offerVolume} (was ${skin.offerVolume})`);

        } else {
            console.log(`❌ Failed to get market data from SteamWebAPI`);
            console.log(`Response:`, marketData);
        }

    } catch (error) {
        console.error(`❌ Error fixing skin ${skinId}:`, error);
    } finally {
        await prisma.$disconnect();
    }
};

fixSkin19829();
