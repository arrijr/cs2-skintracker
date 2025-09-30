// API Contract Tests
// Diese Tests stellen sicher, dass API Responses dem erwarteten Format entsprechen

import request from 'supertest';
import app from '../src/app.js';

describe('API Contract Tests', () => {
  describe('GET /api/v1/skins', () => {
    it('should return correct response format', async () => {
      const response = await request(app)
        .get('/api/v1/skins?page=1&pageSize=5')
        .expect(200);

      // Prüfe, dass die Response das erwartete Format hat
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('hasNextPage');
      expect(response.body).toHaveProperty('hasPrevPage');

      // Prüfe, dass items ein Array ist
      expect(Array.isArray(response.body.items)).toBe(true);

      // Prüfe Skin-Objekt Struktur (wenn items vorhanden)
      if (response.body.items.length > 0) {
        const skin = response.body.items[0];
        expect(skin).toHaveProperty('id');
        expect(skin).toHaveProperty('name');
        expect(skin).toHaveProperty('marketHashName');
        expect(skin).toHaveProperty('imageUrl');
        expect(skin).toHaveProperty('weaponType');
        expect(skin).toHaveProperty('collection');
        expect(skin).toHaveProperty('wear');
        expect(skin).toHaveProperty('rarity');
        expect(skin).toHaveProperty('quality');
        expect(skin).toHaveProperty('isStattrak');
        expect(skin).toHaveProperty('isStar');
        expect(skin).toHaveProperty('itemType');
        expect(skin).toHaveProperty('itemName');
        expect(skin).toHaveProperty('itemGroup');
        expect(skin).toHaveProperty('priceLatest');
        expect(skin).toHaveProperty('priceMedian');
        expect(skin).toHaveProperty('priceAvg');
        expect(skin).toHaveProperty('priceMin');
        expect(skin).toHaveProperty('priceMax');
        expect(skin).toHaveProperty('sold24h');
        expect(skin).toHaveProperty('sold7d');
        expect(skin).toHaveProperty('sold30d');
        expect(skin).toHaveProperty('priceUpdatedAt');
        expect(skin).toHaveProperty('unstable');
        expect(skin).toHaveProperty('unstableReason');
      }
    });

    it('should not return old format (skins property)', async () => {
      const response = await request(app)
        .get('/api/v1/skins?page=1&pageSize=5')
        .expect(200);

      // Stelle sicher, dass das alte Format NICHT zurückgegeben wird
      expect(response.body).not.toHaveProperty('skins');
      expect(response.body).not.toHaveProperty('pagination');
    });
  });
});
