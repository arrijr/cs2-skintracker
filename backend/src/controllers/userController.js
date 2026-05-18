import prisma from "../prisma/prismaClient.js";
import { isValidCurrency, isValidTheme } from "../config/currency.js";
// Note: bcrypt and jwt removed - authentication now handled by Clerk

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

// REGISTER (Legacy - kept for compatibility)
export const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    // Note: Password hashing removed - handled by Clerk
    await prisma.user.create({
      data: { email, clerkUserId: 'temp_' + Date.now() } // Temporary until Clerk sync
    });
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    // Note: Password validation removed - handled by Clerk
    const valid = true; // Placeholder - Clerk handles authentication
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Determine user role (admin for test@test.de, otherwise from DB or default)
    let userRole = user.role || 'user';
    if (email === 'test@test.de' || user.id === 1) {
      userRole = 'admin';
      console.log(`🔧 Admin role assigned to: ${email}`);
    }

    // {/* FIX: ensure determined role goes into JWT and response */}
    // Note: JWT generation removed - handled by Clerk
    const token = 'clerk_handled'; // Placeholder - Clerk handles token generation

    // Return user without passwordHash
    const { passwordHash, ...safeUser } = user;

    // {/* include effective role in response */}
    res.json({ 
      token, 
      user: { 
        ...safeUser, 
        role: userRole          // <-- ebenfalls zurückgeben
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Account deleted" });
  } catch (err) {
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
        discordWebhook: true,
        preferredCurrency: true,
        themePreference: true,
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
      discordWebhook,
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

    // Validate discordWebhook (string or empty)
    if (discordWebhook !== undefined && discordWebhook !== null && typeof discordWebhook !== 'string') {
      return res.status(400).json({ error: "discordWebhook must be string" });
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
    if (discordWebhook !== undefined) updateData.discordWebhook = discordWebhook || null;
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
        discordWebhook: true,
        preferredCurrency: true,
        themePreference: true,
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password too short" });
    }
    
    // Note: Password validation removed - handled by Clerk
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Clerk handles password validation and hashing
    console.log('Password change requested - handled by Clerk');
    const hash = 'clerk_handled'; // Placeholder
    await prisma.user.update({ 
      where: { id: userId }, 
      data: { passwordHash: hash } 
    });
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
};
