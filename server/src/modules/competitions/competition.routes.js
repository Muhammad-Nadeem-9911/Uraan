const express = require('express');
const router = express.Router();
const competitionController = require('./competition.controller');

const { protect } = require('../../common/middleware/auth.middleware'); // Import the auth middleware
const upload = require('../../common/middleware/multer'); // Corrected path to multer.js

// POST /api/competitions - Create a new competition
// Only authenticated users can create
router.post('/', protect, upload.single('coverPhoto'), competitionController.createCompetition);

// GET /api/competitions - Get all competitions
router.get('/', competitionController.getAllCompetitions);

// GET /api/competitions/:id - Get a single competition by ID
router.get('/:id', competitionController.getCompetitionById);

// PUT /api/competitions/:id - Update a competition by ID
router.put('/:id', protect, upload.single('coverPhoto'), competitionController.updateCompetition);

// DELETE /api/competitions/:id - Delete a competition by ID
router.delete('/:id', protect, competitionController.deleteCompetition);

// GET /api/competitions/:id/results - Get calculated results for a competition
router.get('/:id/results', competitionController.getCompetitionResults); // This can be public or protected

module.exports = router;