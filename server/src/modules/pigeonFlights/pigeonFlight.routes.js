const express = require('express');
const pigeonFlightController = require('./pigeonFlight.controller');
const { protect } = require('../../common/middleware/auth.middleware');

const router = express.Router({ mergeParams: true }); // mergeParams might be useful if nested under participant or competition routes

// POST /api/pigeonflights/record - Record a pigeon's arrival time
// We'll expect participantId, competitionId, pigeonNumber, and arrivalTime in the body.
router.post('/record', protect, pigeonFlightController.recordArrivalTime);

// GET /api/pigeonflights?participantId=<participant_id> - Get all flight records for a specific participant
router.get('/', pigeonFlightController.getFlightsByParticipant);

// We can add more specific GET routes later, e.g., for a specific pigeon of a participant,
// or all flights for a competition (which would be part of the results calculation).

// DELETE /api/pigeonflights/:flightId - Delete a specific pigeon flight record
router.delete('/:flightId', protect, pigeonFlightController.deletePigeonFlight);

module.exports = router;