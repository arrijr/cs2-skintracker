import { Router } from 'express';
import {
  getSkinBySlug,
  listSkinsByWeapon,
  listSkinSlugs,
  getSkinById,
  getSkinPrices,
  getSkinVariants,
  getCaseBySlug,
  getSkinPresets,
} from '../controllers/skinDetailController.js';

const router = Router();

// Separate router for /cases endpoints — exported below + mounted in app.js.
export const caseRouter = Router();
caseRouter.get('/:slug', (req, res) => getCaseBySlug(req, res));

// Public — these power SEO landing pages, no auth required.
// IMPORTANT: order matters — `/by-id/:id`, `/slugs`, `/:slug/prices` MUST
// come before `/:slug`, otherwise Express matches them as a slug.
//
// Numeric-slug fall-through: this router is mounted BEFORE the legacy
// `skinRoutes` (which uses `/api/v1/skins/:skinId` for integer IDs). When a
// caller hits e.g. `/api/v1/skins/123/price-history`, Express tries this
// router first. The `next()` calls below let those numeric requests fall
// through to the legacy router instead of being intercepted as slugs.
router.get('/by-id/:id/variants', (req, res) => getSkinVariants(req, res));
router.get('/by-id/:id',          (req, res) => getSkinById(req, res));
router.get('/slugs',              (req, res) => listSkinSlugs(req, res));
router.get('/presets',            (req, res) => getSkinPresets(req, res));

router.get('/:slug/prices', (req, res, next) => {
  if (/^\d+$/.test(req.params.slug)) return next();
  return getSkinPrices(req, res);
});

router.get('/:slug', (req, res, next) => {
  if (/^\d+$/.test(req.params.slug)) return next();
  return getSkinBySlug(req, res);
});

// No `/:slug/*` catch-all — Express auto-falls-through to the next router
// (legacy skinRoutes) when none of the above match, which handles all
// integer-id sub-paths like `/123/price-history`, `/123/related`, etc.
// (Express 5 / path-to-regexp 6 doesn't support unnamed wildcards anyway.)

router.get('/', (req, res) => listSkinsByWeapon(req, res));

export default router;
