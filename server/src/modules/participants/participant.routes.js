const express = require('express');
const participantController = require('./participant.controller');
const { protect } = require('../../common/middleware/auth.middleware');
const upload = require('../../common/middleware/multer'); // Adjusted path to multer middleware

// We can use mergeParams: true if we want to access :competitionId from a parent router
// For now, we'll assume competitionId might be passed in the body or as a query param for some routes,
// or handled by specific controller logic.
const router = express.Router({ mergeParams: true }); // Enable mergeParams if routes are nested

// POST /api/participants (or /api/competitions/:competitionId/participants) - Add a participant to a competition
// The actual URL will depend on how we mount this router in app.js or a competition router.
// For simplicity now, let's assume a general /api/participants endpoint and competitionId is in the body.
router.post('/', protect, upload.single('picture'), participantController.addParticipant);

// GET /api/participants?competitionId=<competition_id> - Get all participants for a specific competition
router.get('/', participantController.getParticipantsByCompetition);

// GET /api/participants/:id - Get a single participant by their ID
router.get('/:id', participantController.getParticipantById);

// PUT /api/participants/:id - Update a participant's details
router.put('/:id', protect, upload.single('picture'), participantController.updateParticipant);

// DELETE /api/participants/:id - Remove a participant
router.delete('/:id', protect, participantController.deleteParticipant);

module.exports = router;