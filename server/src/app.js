const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const competitionRoutes = require('./modules/competitions/competition.routes');
const userRoutes = require('./modules/users/user.routes');
const participantRoutes = require('./modules/participants/participant.routes');
const pigeonFlightRoutes = require('./modules/pigeonFlights/pigeonFlight.routes');
const errorHandler = require('./common/middleware/errorHandler');
const heroSlideRoutes = require('./modules/heroSlides/heroSlide.routes'); // New
const pdfRoutes = require('./routes/pdfRoutes'); // Import the PDF routes

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl, // Allow requests from your frontend
  credentials: true, // If you need to handle cookies or authorization headers
}));
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Basic Route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Mount routes
app.use('/api/competitions', competitionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/participants', participantRoutes); // General participant routes
app.use('/api/pigeonflights', pigeonFlightRoutes);
app.use('/api/hero-slides', heroSlideRoutes); // Add this line for the new carousel slides
app.use('/api/pdf', pdfRoutes); // Mount the PDF generation routes

// Global error handler - should be the last middleware
app.use(errorHandler);

module.exports = app;