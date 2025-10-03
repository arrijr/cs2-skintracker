// /backend/scripts/insertCases.js — [Backend]
// {/* Insert cases directly */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cases = [
  "chroma 2 case",
  "chroma 3 case", 
  "chroma case",
  "clutch case",
  "cs:go weapon case",
  "cs:go weapon case 2",
  "cs:go weapon case 3",
  "cs20 case",
  "danger zone case",
  "dreams & nightmares case",
  "esports 2013 case",
  "esports 2013 winter case",
  "esports 2014 summer case",
  "falchion case",
  "fever case",
  "fracture case",
  "gallery case",
  "gamma 2 case",
  "gamma case",
  "glove case",
  "horizon case",
  "huntsman weapon case",
  "kilowatt case",
  "operation bravo case",
  "operation breakout weapon case",
  "operation broken fang case",
  "operation hydra case",
  "operation phoenix weapon case",
  "operation riptide case",
  "operation vanguard weapon case",
  "operation wildfire case",
  "prisma 2 case",
  "prisma case",
  "recoil case",
  "revolution case",
  "revolver case",
  "shadow case",
  "shattered web case",
  "snakebite case",
  "spectrum 2 case",
  "spectrum case",
  "winter offensive weapon case"
];

async function insertCases() {
  try {
    console.log("🎲 Inserting cases...");

    for (const caseName of cases) {
      try {
        // Check if case already exists
        const existingCase = await prisma.case.findFirst({
          where: { name: caseName }
        });

        if (existingCase) {
          console.log(`⏭️ Skipping existing case: ${caseName}`);
          continue;
        }

        // Determine if case is discontinued
        const isDiscontinued = caseName.toLowerCase().includes('2013') ||
                              caseName.toLowerCase().includes('2014') ||
                              caseName.toLowerCase().includes('2015') ||
                              caseName.toLowerCase().includes('2016') ||
                              caseName.toLowerCase().includes('2017') ||
                              caseName.toLowerCase().includes('2018') ||
                              caseName.toLowerCase().includes('2019') ||
                              caseName.toLowerCase().includes('2020') ||
                              caseName.toLowerCase().includes('2021');

        // Create case data
        const caseData = {
          name: caseName,
          imageUrl: '/images/placeholder-case.png',
          description: `A case containing ${caseName.toLowerCase()} skins`,
          releaseDate: new Date(),
          isDiscontinued: isDiscontinued,
          price: 0,
          marketCap: 0,
          remaining: 0,
          dropped: 0,
          unboxed: 0,
          timeToExtinction: isDiscontinued ? 0 : 999,
          priceChange24h: 0,
          priceChange7d: 0,
          priceChange30d: 0
        };

        // Insert case
        await prisma.case.create({
          data: caseData
        });

        console.log(`✅ Created case: ${caseName} (discontinued: ${isDiscontinued})`);

      } catch (error) {
        console.error(`❌ Error creating case ${caseName}:`, error.message);
        continue;
      }
    }

    console.log("🎉 Case insertion completed!");

  } catch (error) {
    console.error("❌ Error during case insertion:", error);
  } finally {
    await prisma.$disconnect();
  }
}

insertCases();
