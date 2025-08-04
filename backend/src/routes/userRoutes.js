const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require("../middleware/auth");

router.post('/register', userController.register);
router.post('/login', userController.login);
router.delete("/me", authMiddleware, userController.deleteAccount);
router.patch("/me/password", authMiddleware, userController.changePassword);


module.exports = router;
