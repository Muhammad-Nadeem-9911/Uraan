const userService = require('./user.service');

// Register a new user (primarily for admin setup)
exports.registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      const err = new Error('Please provide email and password');
      err.statusCode = 400;
      return next(err);
    }

    const userResponse = await userService.registerUser(email, password);

    res.status(201).json({ success: true, data: userResponse, message: 'User registered successfully' });
  } catch (error) {
    if (error.name === 'ValidationError' && !error.statusCode) { // Mongoose validation
        error.statusCode = 400;
    }
    next(error); // Pass to global error handler
  }
};

// Login a user
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Please provide email and password');
      err.statusCode = 400;
      return next(err);
    }

    const loginData = await userService.loginUser(email, password);

    res.status(200).json({ success: true, ...loginData });
  } catch (error) {
    // Ensure statusCode is set for errors coming from the service if not already set
    if (!error.statusCode) error.statusCode = 500; // Default if not set
    next(error);
  }
};

// Get current logged-in user
exports.getCurrentUser = async (req, res, next) => {
  try {
    // req.user is populated by the 'protect' middleware
    if (!req.user) {
      const err = new Error('User not found or not authenticated');
      err.statusCode = 404; // Or 401 if preferred for this case
      return next(err);
    }
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};
