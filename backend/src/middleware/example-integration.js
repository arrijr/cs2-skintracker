// /backend/src/middleware/example-integration.js (Backend)
// Example of how to integrate Clerk middleware with existing routes

import express from 'express';
import { clerkAuth, optionalClerkAuth, requireAdmin, requirePremium } from './clerkAuth.js';

const router = express.Router();

// Example: Public routes (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Example: Protected routes (auth required)
router.get('/portfolio', clerkAuth, (req, res) => {
  // req.user and req.userId are available
  res.json({ 
    message: 'Portfolio data',
    userId: req.userId,
    user: req.user
  });
});

// Example: Admin only routes
router.get('/admin/users', clerkAuth, requireAdmin, (req, res) => {
  res.json({ 
    message: 'Admin users data',
    adminUser: req.user
  });
});

// Example: Premium only routes
router.get('/analytics', clerkAuth, requirePremium, (req, res) => {
  res.json({ 
    message: 'Premium analytics data',
    user: req.user
  });
});

// Example: Optional auth (works with or without token)
router.get('/public-data', optionalClerkAuth, (req, res) => {
  const response = { message: 'Public data' };
  
  if (req.user) {
    response.personalized = `Hello ${req.user.email}`;
  }
  
  res.json(response);
});

export default router;
