import { Router } from 'express';
import {
  getSkinBySlug,
  listSkinsByWeapon,
  listSkinSlugs,
  getSkinById,
  getSkinPrices,
  getSkinVariants,
} from '../controllers/skinDetailController.js';

const router = Router();

// Public — these power SEO landing pages, no auth required.
// IMPORTANT: order matters — `/by-id/:id`, `/slugs`, `/:slug/prices` MUST
// come before `/:slug`, otherwise Express matches them as a slug.
router.get('/by-id/:id/variants', (req, res) => getSkinVariants(req, res));
router.get('/by-id/:id',          (req, res) => getSkinById(req, res));
router.get('/slugs',              (req, res) => listSkinSlugs(req, res));
router.get('/:slug/prices',       (req, res) => getSkinPrices(req, res));
router.get('/:slug',              (req, res) => getSkinBySlug(req, res));
router.get('/',                   (req, res) => listSkinsByWeapon(req, res));

export default router;
