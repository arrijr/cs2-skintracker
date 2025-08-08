import prisma from "../prisma/prismaClient.js";
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Prüfen, ob User schon existiert
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

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // JWT generieren
    const token = jwt.sign(
      { userId: user.id, isPremium: user.isPremium },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Gebe den User mit aus (ohne PasswortHash!)
    const { passwordHash, ...safeUser } = user;

    res.json({ token, user: safeUser }); // <--- HIER: Userobjekt mitschicken!
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ error: "Account deletion failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
};