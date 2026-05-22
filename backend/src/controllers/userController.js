import prisma from "../prisma/prismaClient.js";
import { isValidCurrency, isValidTheme } from "../config/currency.js";
import { createClerkClient } from "@clerk/backend";
// Note: bcrypt and jwt removed - authentication now handled by Clerk

// Lazy Clerk client (only used in deleteAccount). Avoids crashing the
// process at import time if CLERK_SECRET_KEY happens to be unset locally.
let _clerk = null;
function getClerk() {
  if (!_clerk && process.env.CLERK_SECRET_KEY) {
    _clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }
  return _clerk;
}

// CLERK USER SYNC - Called when user signs up/logs in via Clerk
export const syncUser = async (req, res) => {
  try {
    // Check if user is authenticated
    const userId = req.userId || req.auth?.userId;
    const clerkJwt = req.clerkJwt;
    
    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        code: "AUTH_REQUIRED",
        message: "Authentication required to sync user"
      });
    }

    // Extract user info from JWT
    const clerkUserId = clerkJwt?.sub;
    const email = clerkJwt?.email;
    
    console.log("[USERS/SYNC] Syncing user:", { userId, clerkUserId, email });

    // Check if user already exists in database
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Create new user in database
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email || `user_${userId}@example.com`,
          clerkId: clerkUserId,
          displayName: email?.split('@')[0] || `User ${userId}`,
          timezone: 'UTC',
          emailAlerts: true,
          pushAlerts: false,
          isPremium: false,
          role: 'user'
        }
      });
      console.log("[USERS/SYNC] Created new user:", user.id);
    } else {
      // Update existing user with latest Clerk info
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          email: email || user.email,
          clerkId: clerkUserId || user.clerkId,
          displayName: email?.split('@')[0] || user.displayName
        }
      });
      console.log("[USERS/SYNC] Updated existing user:", user.id);
    }

    return res.json({ 
      ok: true, 
      id: userId,
      clerkId: clerkUserId,
      email: user.email,
      message: 'User sync successful'
    });
  } catch (e) {
    console.error("[USERS/SYNC] error", e);
    return res.status(500).json({ 
      ok: false, 
      code: "SYNC_ERROR",
      message: "User sync failed"
    });
  }
};

// REGISTER / LOGIN are legacy stubs from the pre-Clerk era. They are still
// mounted in userRoutes.js because some E2E tests reference them, but they
// must NEVER be reachable in production because:
//   - register() creates a User row with a synthetic clerkUserId, bypassing
//     Clerk's signup flow entirely.
//   - login() did not validate the password (the comment said "Clerk handles
//     it" but no Clerk verification actually ran). It also contained a
//     hardcoded admin backdoor: `email === 'test@test.de' || user.id === 1`
//     would inflate the response payload to `role: 'admin'`. While the
//     response role doesn't directly grant DB privileges (the real admin
//     gate is `req.user.role` from clerkAdminAuth → DB lookup), any caller
//     who naively trusted this response (or used it to populate a client
//     "isAdmin" flag) would be misled.
// Both handlers are now hard-disabled outside of NODE_ENV=test.
export const register = async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(410).json({ error: 'Endpoint removed. Sign up via Clerk.' });
  }
  const { email } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    await prisma.user.create({
      data: { email, clerkUserId: 'temp_' + Date.now() }
    });
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(410).json({ error: 'Endpoint removed. Sign in via Clerk.' });
  }
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const { passwordHash, ...safeUser } = user;
    res.json({ token: 'clerk_handled', user: { ...safeUser, role: user.role || 'user' } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware

    // Look up clerkId BEFORE deleting so we can clean up the Clerk side too.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, clerkId: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // DB delete — cascades to Watchlist/Portfolio/Alert/etc.
    // (Migration 20260518120000_user_delete_cascade added ON DELETE CASCADE.)
    await prisma.user.delete({ where: { id: userId } });

    // Best-effort Clerk-side deletion. 404 (already gone) and any other error
    // is logged but does not roll back the DB delete — the GDPR-relevant
    // record is already removed locally.
    const clerk = getClerk();
    if (clerk && user.clerkId) {
      try {
        await clerk.users.deleteUser(user.clerkId);
      } catch (err) {
        console.warn("[deleteAccount] Clerk delete failed (DB already deleted):", err?.message);
      }
    }

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("[deleteAccount] error:", err);
    res.status(500).json({ error: "Account deletion failed" });
  }
};

// GET USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const user = await prisma.user.findUnique({
      where: { id: userId },
      // {/* Include role (and isPremium) in profile response */}
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        emailAlerts: true,
        pushAlerts: true,
        preferredCurrency: true,
        themePreference: true,
        onboardingCompletedAt: true, // null = onboarding not done yet
        createdAt: true,
        role: true,        // <-- hinzugefügt
        isPremium: true    // <-- optional hilfreich fürs FE
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const {
      displayName,
      timezone,
      emailAlerts,
      pushAlerts,
      preferredCurrency,
      themePreference,
    } = req.body;

    // Validate timezone if provided
    if (timezone && !Intl.supportedValuesOf('timeZone').includes(timezone)) {
      return res.status(400).json({ error: "Invalid timezone" });
    }

    // Validate boolean flags
    if (emailAlerts !== undefined && typeof emailAlerts !== 'boolean') {
      return res.status(400).json({ error: "emailAlerts must be boolean" });
    }
    if (pushAlerts !== undefined && typeof pushAlerts !== 'boolean') {
      return res.status(400).json({ error: "pushAlerts must be boolean" });
    }

    // Validate currency + theme against allowlists
    if (preferredCurrency !== undefined && !isValidCurrency(preferredCurrency)) {
      return res.status(400).json({ error: "Invalid currency" });
    }
    if (themePreference !== undefined && !isValidTheme(themePreference)) {
      return res.status(400).json({ error: "Invalid theme" });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (emailAlerts !== undefined) updateData.emailAlerts = emailAlerts;
    if (pushAlerts !== undefined) updateData.pushAlerts = pushAlerts;
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;
    if (themePreference !== undefined) updateData.themePreference = themePreference;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        emailAlerts: true,
        pushAlerts: true,
        preferredCurrency: true,
        themePreference: true,
        onboardingCompletedAt: true,
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// MARK ONBOARDING COMPLETE
// Stamps `onboardingCompletedAt` with now(). Idempotent — re-calling is a no-op
// (returns the existing timestamp). Used by `/onboarding` final step + skip-all.
export const markOnboarded = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Idempotent: don't overwrite an existing completion timestamp.
    if (user.onboardingCompletedAt) {
      return res.json({ onboardingCompletedAt: user.onboardingCompletedAt });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
      select: { onboardingCompletedAt: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('markOnboarded error:', err);
    res.status(500).json({ error: "Failed to mark onboarding complete" });
  }
};

// CHANGE PASSWORD — removed. Passwords are managed entirely by Clerk.
// The previous handler wrote a literal sentinel string into passwordHash
// (insecure + non-functional). Use Clerk's user portal to change a password.
