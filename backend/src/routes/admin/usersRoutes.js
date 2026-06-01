// backend/src/routes/admin/usersRoutes.js
// Admin user management (ADM-13). Read endpoints + two gated mutations
// (email-alerts toggle, tier override). All behind clerkAdminAuth.
//
// Route order matters: literal /users/statistics and /users/search MUST be
// registered before /users/:userId or the param route swallows them.
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getUsers,
  getUserStatistics,
  searchUsers,
  getUserDetails,
  getUserActivity,
  updateUserEmailAlerts,
  updateUserTier,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/users', getUsers);
router.get('/users/statistics', getUserStatistics);
router.get('/users/search', searchUsers);
router.get('/users/:userId', getUserDetails);
router.get('/users/:userId/activity', getUserActivity);
router.patch('/users/:userId/email-alerts', updateUserEmailAlerts);
router.patch('/users/:userId/tier', updateUserTier);

export default router;
