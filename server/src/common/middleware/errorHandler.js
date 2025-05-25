const config = require('../../config');
const multer = require('multer'); // Import multer to check for MulterError instance

/**
 * Global error handling middleware.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  console.error('ERROR STACK:', err.stack); // Log the error stack for debugging

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Optional: Handle Multer errors specifically for more tailored responses
  if (err instanceof multer.MulterError) {
    statusCode = 400; // Bad Request for file upload issues
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Please upload a smaller file.';
    } // Add more Multer error codes as needed (e.g., LIMIT_UNEXPECTED_FILE)
    // message = err.message; // Or just use Multer's default message
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Optionally include stack trace in development
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;