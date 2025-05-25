const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../../common/middleware/auth.middleware');

// POST /api/users/register - Register a new user (admin)
router.post('/register', userController.registerUser);

// POST /api/users/login - Login a user (admin)
router.post('/login', userController.loginUser);

// GET /api/users/me - Get current logged-in user details (protected)
router.get('/me', protect, userController.getCurrentUser);

module.exports = router;