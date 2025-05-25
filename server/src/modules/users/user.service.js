const User = require('./user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Registers a new user.
 * @param {string} email - User's email.
 * @param {string} password - User's plain text password.
 * @returns {Promise<object>} The created user object (excluding passwordHash).
 * @throws {Error} If email already exists or other validation/db errors.
 */
exports.registerUser = async (email, password) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('User with this email already exists');
    err.statusCode = 409; // Conflict
    throw err;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = new User({
    email,
    passwordHash,
    // isAdmin defaults to true as per model
  });

  await newUser.save();

  // Return user data without the password hash
  return { _id: newUser._id, email: newUser.email, isAdmin: newUser.isAdmin, createdAt: newUser.createdAt, updatedAt: newUser.updatedAt };
};

/**
 * Logs in a user.
 * @param {string} email - User's email.
 * @param {string} password - User's plain text password.
 * @returns {Promise<object>} Object containing the JWT token and user details.
 * @throws {Error} If credentials are invalid or other errors.
 */
exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401; // Unauthorized
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  // Create and sign JWT
  const payload = { userId: user._id, isAdmin: user.isAdmin };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

  return {
    token,
    userId: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
};

// getCurrentUser logic is simple enough to remain in controller as it directly uses req.user
// or could be moved here if more complex logic arises for fetching user details.