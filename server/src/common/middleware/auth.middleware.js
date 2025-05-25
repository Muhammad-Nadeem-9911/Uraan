const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../modules/users/user.model'); // To check if user still exists

/**
 * Authentication middleware to protect routes.
 * Verifies JWT from the Authorization header.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Get user from the token and attach to request object
      // We select '-passwordHash' to exclude the hashed password from being attached
      req.user = await User.findById(decoded.userId).select('-passwordHash');

      if (!req.user) {
        const err = new Error('User not found, token may be invalid');
        err.statusCode = 401;
        return next(err);
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      const err = new Error('Not authorized, token failed');
      err.statusCode = 401;
      return next(err);
    }
  }

  if (!token) {
    const err = new Error('Not authorized, no token');
    err.statusCode = 401;
    return next(err);
  }
};

module.exports = { protect };