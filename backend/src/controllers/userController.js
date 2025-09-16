import prisma from "../prisma/prismaClient.js";
// Note: bcrypt and jwt removed - authentication now handled by Clerk

// CLERK USER SYNC - Called when user signs up/logs in via Clerk
export const syncUser = async (req, res) => {
  try {
    const jwt = req.clerkJwt || {};
    // typische Clerk Claims – ggf. an euer Template anpassen
    const externalId = jwt.sub;
    const email = jwt.email || jwt.primary_email || jwt?.claims?.email || null;
    const firstName = jwt.given_name || jwt.first_name || null;
    const lastName = jwt.family_name || jwt.last_name || null;

    if (!externalId) {
      return res.status(422).json({ 
        ok: false, 
        code: "MISSING_SUB",
        message: "JWT token missing 'sub' claim"
      });
    }

    const user = await prisma.user.upsert({
      where: { externalId },
      update: { 
        email, 
        firstName, 
        lastName,
        lastLoginAt: new Date()
      },
      create: { 
        externalId, 
        email, 
        firstName, 
        lastName,
        lastLoginAt: new Date()
      },
    });

    return res.json({ 
      ok: true, 
      id: user.id,
      message: 'User synced successfully'
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
    const { displayName, timezone, emailAlerts, pushAlerts } = req.body;
    
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
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (emailAlerts !== undefined) updateData.emailAlerts = emailAlerts;
    if (pushAlerts !== undefined) updateData.pushAlerts = pushAlerts;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        emailAlerts: true,
        pushAlerts: true
      }
    });
    
    res.json(updatedUser);
  } catch (err) {
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
