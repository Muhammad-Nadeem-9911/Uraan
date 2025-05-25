const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// We'll need to import the PigeonFlight model here to delete its documents
const PigeonFlight = require('../pigeonFlights/pigeonFlight.model');
const competitionService = require('../competitions/competition.service'); // Import competitionService
const { getIo } = require('../../common/utils/socketManager'); // For potential direct event

const participantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
    },
    pictureUrl: {
      type: String, // URL to the participant's picture
      default: ''
    },
    picturePublicId: { // To store Cloudinary's public_id for deletion
      type: String,
      default: ''
    },
    competition: {
      type: Schema.Types.ObjectId,
      ref: 'Competition', // Reference to the Competition model
      required: true,
    },
    // We will link pigeon flights later using a reference array
    // totalCalculatedTimeInSeconds: { // This could be calculated on-the-fly or stored
    //   type: Number,
    //   default: 0,
    // },
  },
  { timestamps: true }
);

// Mongoose middleware to cascade delete related pigeon flights
// This hook will run BEFORE a 'findOneAndDelete' operation on a Participant document
participantSchema.pre('findOneAndDelete', async function(next) {
  // `this` refers to the query object.
  const participantDoc = await this.model.findOne(this.getQuery());
  if (!participantDoc) {
    console.log('Participant not found in pre-hook, skipping pigeon flight deletion.');
    return next();
  }

  const participantId = participantDoc._id;
  const competitionId = participantDoc.competition; // Get the competition ID from the participant
  try {
    console.log(`Attempting to delete pigeon flights for participant ID: ${participantId}`);
    // Delete all pigeon flights associated with this participant
    // Since a Participant document is tied to one competition, this effectively
    // deletes their flights for the competition they were part of.
    await PigeonFlight.deleteMany({ participant: participantId });
    console.log(`[PRE-DELETE PARTICIPANT] Deleted pigeon flights for participant ID: ${participantId}`);
    next();
  } catch (error) {
    console.error(`[PRE-DELETE PARTICIPANT] Error deleting pigeon flights for participant ID ${participantId}:`, error);
    next(error); // Pass the error to the next middleware or the operation will hang
  }
});

// Mongoose middleware to trigger results update AFTER a participant is deleted
// This hook will run AFTER a 'findOneAndDelete' operation on a Participant document
participantSchema.post('findOneAndDelete', async function(doc, next) {
  // `doc` is the document that was deleted.
  if (doc) {
    const competitionId = doc.competition;
    try {
      console.log(`[POST-DELETE PARTICIPANT] Participant ${doc._id} deleted from competition ${competitionId}. Triggering results update.`);
      await competitionService.calculateCompetitionResults(competitionId);
    } catch (error) {
      console.error(`[POST-DELETE PARTICIPANT] Error triggering results update for competition ${competitionId} after deleting participant ${doc._id}:`, error);
      // We don't call next(error) here as the delete operation itself was successful.
      // This error is about a subsequent action. Log it for monitoring.
    }
  }
  next();
});

module.exports = mongoose.model('Participant', participantSchema);