// Direct DB initialization. Reads connection string from DATABASE_URL env var.
// Never hardcode credentials here — they end up in git history forever.
const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('DATABASE_URL env var is required. Set it in backend/.env or your shell.');
  process.exit(1);
}

// For now, just create a report script that shows what would be seeded
const CS2_SKINS = [
  { name: 'AK-47 | Phantom Disruptor', hash: 'AK-47 | Phantom Disruptor', price: 42.50 },
  { name: 'M4A4 | Howl', hash: 'M4A4 | Howl', price: 185.00 },
  { name: 'AWP | Dragon Lore', hash: 'AWP | Dragon Lore', price: 2850.00 },
  { name: 'M9 Bayonet | Crimson Web', hash: 'M9 Bayonet | Crimson Web', price: 1250.00 },
  { name: 'USP-S | Kill Confirmed', hash: 'USP-S | Kill Confirmed', price: 18.50 },
  { name: 'Glock-18 | Weasel', hash: 'Glock-18 | Weasel', price: 12.75 },
  { name: 'Karambit | Doppler', hash: 'Karambit | Doppler', price: 890.00 },
];

console.log('\n=== CS2 Skin Tracker - Database Seeding Report ===\n');
console.log('Database:', connStr.split('@')[1]);
console.log('\nSkins to be seeded:');
CS2_SKINS.forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.name} - $${s.price.toFixed(2)}`);
});

console.log('\nTest User:');
console.log('  Email: test-user@cs2tracker.local');
console.log('  Clerk ID: test-user-clerk-001');
console.log('  Portfolio Items: 7 skins');

console.log('\nPrice History:');
console.log('  30 days of historical data per skin');
console.log('  Total entries: ~210 (7 skins × 30 days)');

console.log('\nTo complete the seeding:');
console.log('1. Run: npm install (on Windows to fix Prisma engines)');
console.log('2. Run: npm run db:seed');
console.log('\nStatus: Seed scripts ready. Ready for live test when DB connection is confirmed.\n');

process.exit(0);
