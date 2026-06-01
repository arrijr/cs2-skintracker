/**
 * adminRoutes.test.js — proves the Phase-1 admin route modules are actually mounted.
 *
 * The original bug: adminController existed but no router wired it → every path 404'd.
 * We can't prove mounting via 401, because the legacy adminRoutes applies
 * clerkAdminAuth across the whole /api/v1/admin base, so unmounted paths also 401.
 * Instead: pass auth THROUGH and stub prisma, then a *mounted* route reaches its
 * handler (→ 200 or 500, never 404) while an unknown path falls through to 404.
 */
import { jest } from '@jest/globals';
import request from 'supertest';

// Auth passes through with a fake admin user.
await jest.unstable_mockModule('../middleware/clerkAdminAuth.js', () => ({
  default: (req, _res, next) => { req.user = { id: 1, email: 'a@b.c', role: 'admin' }; next(); },
}));

// Permissive prisma stub so handlers run without a real DB (any model.method → Promise).
const makeModel = () => new Proxy({}, { get: () => () => Promise.resolve(null) });
const prismaStub = new Proxy({}, { get: () => makeModel() });
await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({ default: prismaStub }));
await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({ default: prismaStub }));

const { default: app } = await import('../app.js');

describe('admin route modules are mounted (handler reached, not 404)', () => {
  const mountedGet = [
    '/api/v1/admin/overview',
    '/api/v1/admin/logs',
    '/api/v1/admin/metrics-definitions',
    '/api/v1/admin/jobs',
    '/api/v1/admin/jobs/status',
    '/api/v1/admin/coverage/overview',
    '/api/v1/admin/coverage/segments',
    '/api/v1/admin/coverage/missing-skins',
    '/api/v1/admin/users',
    '/api/v1/admin/users/statistics',
    '/api/v1/admin/users/search',
    '/api/v1/admin/users/1',
    '/api/v1/admin/insights',
  ];
  for (const path of mountedGet) {
    it(`GET ${path} is mounted (not 404)`, async () => {
      const res = await request(app).get(path);
      expect(res.status).not.toBe(404);
    });
  }

  const mountedPost = [
    '/api/v1/admin/cache/steam/clear',
    '/api/v1/admin/jobs/skin-prices',
    '/api/v1/admin/jobs/portfolio-snapshots',
    '/api/v1/admin/jobs/alert-check',
  ];
  for (const path of mountedPost) {
    it(`POST ${path} is mounted (not 404)`, async () => {
      const res = await request(app).post(path).send({ dryRun: true });
      expect(res.status).not.toBe(404);
    });
  }

  const mountedPatch = ['/api/v1/admin/users/1/tier', '/api/v1/admin/users/1/email-alerts'];
  for (const path of mountedPatch) {
    it(`PATCH ${path} is mounted (not 404)`, async () => {
      const res = await request(app).patch(path).send({ tier: 'free', emailAlerts: true });
      expect(res.status).not.toBe(404);
    });
  }

  it('unknown admin path falls through to 404 (proves the above are real routes)', async () => {
    const res = await request(app).get('/api/v1/admin/definitely-not-a-route');
    expect(res.status).toBe(404);
  });
});
