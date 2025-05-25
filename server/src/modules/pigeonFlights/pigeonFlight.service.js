const PigeonFlight = require('./pigeonFlight.model');
const Participant = require('../participants/participant.model');
const Competition = require('../competitions/competition.model');
const mongoose = require('mongoose');
const competitionService = require('../competitions/competition.service'); // Import competitionService
const { getIo } = require('../../common/utils/socketManager'); // Import the getter

/**
 * Records the arrival time of a pigeon.
 * @param {string} participantId - The ID of the participant.
 * @param {string} competitionId - The ID of the competition.
 * @param {number} pigeonNumber - The number of the pigeon.
 * @param {Date} arrivalTime - The arrival time of the pigeon.
 * @returns {Promise<PigeonFlight>} The created or updated pigeon flight document.
 * @throws {Error} If validation fails or entities are not found.
 */
exports.recordArrivalTime = async (participantId, competitionId, pigeonNumber, arrivalTime) => {
  if (!mongoose.Types.ObjectId.isValid(participantId) || !mongoose.Types.ObjectId.isValid(competitionId)) {
    const err = new Error('Invalid Participant or Competition ID format');
    err.statusCode = 400;
    throw err;
  }

  const participant = await Participant.findById(participantId);
  if (!participant) {
    const err = new Error('Participant not found');
    err.statusCode = 404;
    throw err;
  }

  // Ensure the participant belongs to the provided competitionId
  if (participant.competition.toString() !== competitionId) {
    const err = new Error('Participant does not belong to the specified competition');
    err.statusCode = 400;
    throw err;
  }

  const competition = await Competition.findById(competitionId);
  if (!competition) {
    const err = new Error('Competition not found');
    err.statusCode = 404;
    throw err;
  }

  if (new Date(arrivalTime) < new Date(competition.startTime)) {
    const err = new Error('Arrival time cannot be before the competition start time');
    err.statusCode = 400;
    throw err;
  }

  if (competition.status === 'COMPLETED') {
    const err = new Error('Cannot record arrival time for a completed competition');
    err.statusCode = 400;
    throw err;
  }

  // Check against expectedPigeonsPerParticipant
  if (competition.expectedPigeonsPerParticipant && pigeonNumber > competition.expectedPigeonsPerParticipant) {
    const err = new Error(`Pigeon number ${pigeonNumber} exceeds the maximum allowed (${competition.expectedPigeonsPerParticipant}) for this competition.`);
    err.statusCode = 400;
    throw err;
  }

  // Upsert logic: find if a record exists, if so update, else create.
  const flightData = {
    participant: participantId,
    competition: competitionId,
    pigeonNumber,
    arrivalTime,
  };

  const updatedFlight = await PigeonFlight.findOneAndUpdate(
    { participant: participantId, pigeonNumber: pigeonNumber, competition: competitionId },
    flightData,
    { new: true, upsert: true, runValidators: true }
  );

  // Emit an event after successful recording
  const io = getIo();
  if (io && updatedFlight) {
    // Emit to a room specific to the competition
    const competitionRoom = `competition-${competitionId}`;
    // We can send the updated flight, or a signal to refetch results, or the full new results.
    // This event can be used by admin panel if it wants to highlight the specific changed row.
    io.to(competitionRoom).emit('pigeonArrivalUpdate', { participantId, competitionId, flight: updatedFlight });
    console.log(`Emitted pigeonArrivalUpdate to room ${competitionRoom}`);
    // Now, trigger recalculation and emission of full results
    // This will ensure CompetitionDetailPage gets the 'competitionResultsUpdate' event
    await competitionService.calculateCompetitionResults(competitionId);
}

  return updatedFlight;
};

/**
 * Deletes a specific pigeon flight record by its ID.
 * @param {string} flightId - The ID of the pigeon flight to delete.
 * @returns {Promise<PigeonFlight|null>} The deleted pigeon flight document or null if not found.
 */
exports.deletePigeonFlightById = async (flightId) => {
  if (!mongoose.Types.ObjectId.isValid(flightId)) {
    const err = new Error('Invalid PigeonFlight ID format');
    err.statusCode = 400;
    throw err;
  }
  const deletedFlight = await PigeonFlight.findByIdAndDelete(flightId);
  // The post('findOneAndDelete') hook on the PigeonFlight model will trigger results recalculation.
  return deletedFlight;
};

/**
 * Retrieves all flight records for a specific participant.
 * @param {string} participantId - The ID of the participant.
 * @returns {Promise<PigeonFlight[]>} A list of flight records for the participant.
 * @throws {Error} If participantId is invalid.
 */
exports.getFlightsByParticipant = async (participantId) => {
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    const err = new Error('Invalid Participant ID format');
    err.statusCode = 400;
    throw err;
  }
  return await PigeonFlight.find({ participant: participantId })
    .populate('competition', 'name startTime') // Populate some competition details
    .sort({ pigeonNumber: 'asc' }); // Sort by pigeon number
};