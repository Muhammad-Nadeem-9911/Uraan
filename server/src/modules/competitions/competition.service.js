const Competition = require('./competition.model');
const Participant = require('../participants/participant.model');
const PigeonFlight = require('../pigeonFlights/pigeonFlight.model');
const mongoose = require('mongoose');
const { getIo } = require('../../common/utils/socketManager'); // Import the getter

/**
 * Creates a new competition.
 * @param {object} competitionData - The data for the new competition.
 * @returns {Promise<Competition>} The created competition document.
 */
exports.createCompetition = async (competitionData) => {
  const newCompetition = new Competition(competitionData);
const savedCompetition = await newCompetition.save();

  const io = getIo();
  if (io) {
    // Emit to a general room or broadcast that the list of competitions has changed
    io.emit('competitionsListUpdated', { action: 'create', competition: savedCompetition });
    console.log('Emitted competitionsListUpdated (create)');
  }

  return savedCompetition;
};

/**
 * Retrieves all competitions, sorted by date descending.
 * @returns {Promise<Competition[]>} A list of all competitions.
 */
exports.getAllCompetitions = async () => {
  return await Competition.find().sort({ date: -1 });
};

/**
 * Retrieves a single competition by its ID.
 * @param {string} competitionId - The ID of the competition.
 * @returns {Promise<Competition|null>} The competition document or null if not found.
 */
exports.getCompetitionById = async (competitionId) => {
  return await Competition.findById(competitionId);
};

/**
 * Updates an existing competition by its ID.
 * @param {string} competitionId - The ID of the competition to update.
 * @param {object} updateData - The data to update the competition with.
 * @returns {Promise<Competition|null>} The updated competition document or null if not found.
 */
exports.updateCompetition = async (competitionId, updateData) => {
  const updatedCompetition = await Competition.findByIdAndUpdate(competitionId, updateData, {
    new: true, // Return the modified document rather than the original
    runValidators: true, // Ensure schema validations are run on update
  });

  const io = getIo();
  console.log('[SERVICE UPDATE] IO instance for updateCompetition:', !!io); // Log IO instance availability

  if (io && updatedCompetition) {
    // Emit to a general room that the list of competitions might have changed (e.g. status update)
    io.emit('competitionsListUpdated', { action: 'update', competition: updatedCompetition });
    console.log('[SERVICE UPDATE] Emitted competitionsListUpdated (update)');

    // Emit to the specific competition room for detail page updates
    const competitionRoom = `competition-${competitionId}`;
    io.to(competitionRoom).emit('competitionDetailsUpdate', updatedCompetition);
    console.log(`[SERVICE UPDATE] Emitted competitionDetailsUpdate to room ${competitionRoom} with data:`, updatedCompetition);

    // await exports.calculateCompetitionResults(competitionId); // Consider if this is needed here
  }
  return updatedCompetition;
};

/**
 * Deletes a competition by its ID.
 * @param {string} competitionId - The ID of the competition to delete.
 * @returns {Promise<Competition|null>} The deleted competition document or null if not found.
 */
exports.deleteCompetition = async (competitionId) => {
const deletedCompetition = await Competition.findByIdAndDelete(competitionId);
  const io = getIo();
  console.log('[SERVICE DELETE] IO instance for deleteCompetition:', !!io);

  if (io && deletedCompetition) {
    // Emit to a general room that the list of competitions has changed
    io.emit('competitionsListUpdated', { action: 'delete', competitionId: competitionId });
    console.log('[SERVICE DELETE] Emitted competitionsListUpdated (delete)');
  }
  return deletedCompetition;
};

/**
 * Calculates and retrieves the results for a given competition.
 * @param {string} competitionId - The ID of the competition.
 * @returns {Promise<object>} An object containing the ranked results.
 * @throws {Error} If competition not found or other issues.
 */
exports.calculateCompetitionResults = async (competitionId) => {
  if (!mongoose.Types.ObjectId.isValid(competitionId)) {
    const err = new Error('Invalid Competition ID format');
    err.statusCode = 400;
    throw err;
  }

  const competition = await Competition.findById(competitionId);
  if (!competition) {
    const err = new Error('Competition not found');
    err.statusCode = 404;
    throw err;
  }

  const competitionStartTime = new Date(competition.startTime).getTime();

  // Fetch all participants for this competition
  const participants = await Participant.find({ competition: competitionId }).lean(); // .lean() for plain JS objects

  const results = [];

  for (const participant of participants) {
    // Fetch all pigeon flights for this participant in this competition
    const flights = await PigeonFlight.find({
      participant: participant._id,
      competition: competitionId,
    }).sort({ pigeonNumber: 'asc' }); // Ensure flights are ordered

    let totalFlightDurationSeconds = 0;
    const participantFlightsDetails = [];
    let allPigeonsRecorded = competition.expectedPigeonsPerParticipant ? flights.length >= competition.expectedPigeonsPerParticipant : true;

    for (const flight of flights) {
      const arrivalTime = new Date(flight.arrivalTime).getTime();
      let flightDurationSeconds = 0;
      if (arrivalTime > competitionStartTime) {
        flightDurationSeconds = Math.round((arrivalTime - competitionStartTime) / 1000);
      }
      totalFlightDurationSeconds += flightDurationSeconds;
      participantFlightsDetails.push({
        pigeonNumber: flight.pigeonNumber,
        arrivalTime: flight.arrivalTime,
        flightDurationSeconds,
      });
    }
    
    // If expectedPigeonsPerParticipant is set, and not all are recorded, mark as incomplete or handle as per rules
    // For now, we'll just note it. Ranking might penalize incomplete sets or exclude them.
    // Your rule: "the total time will be 2 hr 10 min + 2 hr 20 min and the total for that person will be 4 hr 30 mins"
    // This implies summing valid flight durations.

    results.push({
      participantId: participant._id,
      participantName: participant.name,
      participantPictureUrl: participant.pictureUrl,
      flights: participantFlightsDetails,
      totalFlightDurationSeconds,
      isComplete: allPigeonsRecorded, // Indicates if all expected pigeons have recorded times
      numberOfPigeonsRecorded: flights.length,
    });
  }

  // Sort results: highest totalFlightDurationSeconds first.
  // Participants with incomplete sets might be ranked lower or handled differently based on rules.
  // For now, just sort by time. To sort by highest time first:
  results.sort((a, b) => b.totalFlightDurationSeconds - a.totalFlightDurationSeconds);

  // Add rank
  const rankedResults = results.map((result, index) => ({ ...result, rank: index + 1 }));

  // Calculate total pigeons overall for the competition
  const totalPigeonsOverall = competition.expectedPigeonsPerParticipant * participants.length;

  const finalResultsPayload = {
    _id: competition._id.toString(), // Add competition ID to the payload, ensure it's a string
    competitionName: competition.name,
    competitionDate: competition.date,
    location: competition.location, 
    competitionStartTime: competition.startTime,
    coverImage: competition.coverPhotoUrl, 
    status: competition.status, // Add competition status
    // weather: competition.weather, // Removed as it's not in the model and fetched live on frontend
    expectedPigeonsPerParticipant: competition.expectedPigeonsPerParticipant,
    results: rankedResults,
    firstPlace: rankedResults.length > 0 ? rankedResults[0] : null,
    lastPlace: rankedResults.length > 0 ? rankedResults[rankedResults.length - 1] : null,
    totalPigeonsOverall: totalPigeonsOverall, // Add calculated total pigeons
  };

  // Emit an event with the updated results
  const io = getIo();
  console.log('[SERVICE CALC_RESULTS] IO instance for calculateCompetitionResults:', !!io);

  if (io) {
    const competitionRoom = `competition-${competitionId}`;
    io.to(competitionRoom).emit('competitionResultsUpdate', finalResultsPayload);
    console.log(`[SERVICE CALC_RESULTS] Emitted competitionResultsUpdate to room ${competitionRoom}`);
  }

  return finalResultsPayload;
};
