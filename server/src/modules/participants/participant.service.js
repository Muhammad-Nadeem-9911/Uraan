const Participant = require('./participant.model');
const Competition = require('../competitions/competition.model'); // To validate competitionId
const mongoose = require('mongoose');
const competitionService = require('../competitions/competition.service'); // Import competitionService
const { getIo } = require('../../common/utils/socketManager'); // For potential direct event

/**
 * Adds a new participant to a competition.
 * @param {object} participantData - Object containing participant details.
 * @param {string} participantData.name - Participant's name.
 * @param {string} participantData.competitionId - The ID of the competition.
 * @param {string} [participantData.pictureUrl] - URL to participant's picture.
 * @param {string} [participantData.picturePublicId] - Public ID for Cloudinary image.
 * @returns {Promise<Participant>} The created participant document.
 * @throws {Error} If competition not found or validation fails.
 */
exports.addParticipant = async (participantData) => {
  const { name, competitionId, pictureUrl, picturePublicId } = participantData;
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

  const newParticipant = new Participant({
    name,
    pictureUrl,
    picturePublicId,
    competition: competitionId,
  });
const savedParticipant = await newParticipant.save();

  // After adding a participant, trigger results recalculation for the competition
  // This will emit 'competitionResultsUpdate' which CompetitionDetailPage listens to.
  if (savedParticipant) {
    await competitionService.calculateCompetitionResults(competitionId);
    // Optionally, emit a more specific event if needed by other parts of the app
    // const io = getIo();
    // if (io) {
    //   io.to(`competition-${competitionId}`).emit('participantListUpdated', { action: 'add', participant: savedParticipant });
    // }
  }
  return savedParticipant;};

/**
 * Retrieves all participants for a given competition.
 * @param {string} competitionId - The ID of the competition.
 * @returns {Promise<Participant[]>} A list of participants for the competition.
 * @throws {Error} If competitionId is invalid.
 */
exports.getParticipantsByCompetition = async (competitionId) => {
  if (!mongoose.Types.ObjectId.isValid(competitionId)) {
    const err = new Error('Invalid Competition ID format');
    err.statusCode = 400;
    throw err;
  }
  return await Participant.find({ competition: competitionId }).populate('competition', 'name date');
};

/**
 * Retrieves a single participant by their ID.
 * @param {string} participantId - The ID of the participant.
 * @returns {Promise<Participant|null>} The participant document or null if not found.
 */
exports.getParticipantById = async (participantId) => {
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    const err = new Error('Invalid Participant ID format');
    err.statusCode = 400;
    throw err;
  }
  return await Participant.findById(participantId).populate('competition', 'name date');

};

/**
 * Updates an existing participant's details.
 * @param {string} participantId - The ID of the participant to update.
 * @param {object} updateData - The data to update (e.g., name, pictureUrl).
 * @returns {Promise<Participant|null>} The updated participant document or null if not found.
 */
exports.updateParticipant = async (participantId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    const err = new Error('Invalid Participant ID format');
    err.statusCode = 400;
    throw err;
  }
  // Prevent changing the competition via this update method for simplicity
  const { competition, ...allowedUpdates } = updateData;
  const updatedParticipant = await Participant.findByIdAndUpdate(participantId, allowedUpdates, { new: true, runValidators: true });

  if (updatedParticipant) {
    // After updating a participant, trigger results recalculation for their competition
    // This will emit 'competitionResultsUpdate' which CompetitionDetailPage listens to.
    await competitionService.calculateCompetitionResults(updatedParticipant.competition.toString());
  }

  return updatedParticipant;
};

/**
 * Deletes a participant.
 * @param {string} participantId - The ID of the participant to delete.
 * @returns {Promise<Participant|null>} The deleted participant document or null if not found.
 * @throws {Error} If participantId is invalid.
 */
exports.deleteParticipant = async (participantId) => {
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    const err = new Error('Invalid Participant ID format');
    err.statusCode = 400;
    throw err;
  }
  // TODO: Consider deleting related PigeonFlight records if necessary, or handle via schema pre-hooks.
  return await Participant.findByIdAndDelete(participantId);
};