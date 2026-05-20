import { Router } from 'express';
import {
  getSkinBySlug,
  listSkinsByWeapon,
  listSkinSlugs,
} from '../controllers/skinDetailController.js';

const router = Router();

// Public — these power SEO landing pages, no auth required.
router.get('/slugs', (req, res) => listSkinSlugs(req, res));
router.get('/:slug', (req, res) => getSkinBySlug(req, res));
router.get('/',      (req, res) => listSkinsByWeapon(req, res));

export default router;
