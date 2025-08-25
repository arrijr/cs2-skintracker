import prisma from "../prisma/prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash }
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
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, isPremium: user.isPremium },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user without passwordHash
    const { passwordHash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ error: "Account deletion failed" });
  }
};

// GET USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        emailAlerts: true,
        pushAlerts: true,
        createdAt: true
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password too short" });
    }
    
    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
      return res.status(401).json({ error: "Current password incorrect" });
    }
    
    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ 
      where: { id: userId }, 
      data: { passwordHash: hash } 
    });
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
};
