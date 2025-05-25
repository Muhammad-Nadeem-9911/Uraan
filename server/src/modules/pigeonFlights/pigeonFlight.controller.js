const pigeonFlightService = require('./pigeonFlight.service');

// Record a pigeon's arrival time
exports.recordArrivalTime = async (req, res, next) => {
  try {
    const { participantId, competitionId, pigeonNumber, arrivalTime } = req.body;

    if (!participantId || !competitionId || !pigeonNumber || !arrivalTime) {
      const err = new Error('Participant ID, Competition ID, Pigeon Number, and Arrival Time are required');
      err.statusCode = 400;
      return next(err);
    }
    if (typeof pigeonNumber !== 'number' || pigeonNumber < 1) {
        const err = new Error('Pigeon Number must be a positive integer');
        err.statusCode = 400;
        return next(err);
    }

    const flightRecord = await pigeonFlightService.recordArrivalTime(participantId, competitionId, pigeonNumber, new Date(arrivalTime));
    res.status(201).json({ success: true, data: flightRecord, message: 'Pigeon arrival recorded/updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError' && !error.statusCode) { // Mongoose validation
        error.statusCode = 400;
    }
    next(error);
  }
};

// Get all flight records for a specific participant
exports.getFlightsByParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.query;
    if (!participantId) {
      const err = new Error('Participant ID is required as a query parameter');
      err.statusCode = 400;
      return next(err);
    }
    const flights = await pigeonFlightService.getFlightsByParticipant(participantId);
    res.status(200).json({ success: true, count: flights.length, data: flights });
  } catch (error) {
    next(error);
  }
};

// Delete a specific pigeon flight record
exports.deletePigeonFlight = async (req, res, next) => {
  try {
    const { flightId } = req.params;
    const deletedFlight = await pigeonFlightService.deletePigeonFlightById(flightId);

    if (!deletedFlight) {
      const err = new Error('Pigeon flight record not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, message: 'Pigeon flight record deleted successfully' });
  } catch (error) {
    next(error);
  }
};