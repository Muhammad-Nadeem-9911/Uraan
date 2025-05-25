const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Import competitionService to trigger results recalculation
const competitionService = require('../competitions/competition.service');
const pigeonFlightSchema = new Schema(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: 'Participant', // Reference to the Participant model
      required: true,
    },
    competition: { // Denormalizing competition ID here for easier access to competition's startTime
      type: Schema.Types.ObjectId,
      ref: 'Competition', // Reference to the Competition model
      required: true,
    },
    pigeonNumber: { // e.g., Pigeon 1, Pigeon 2 for this participant
      type: Number,
      required: true,
      min: 1,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    // flightDurationInSeconds: { // This will be calculated: arrivalTime - competition.startTime
    //   type: Number,
    // },
  },
  { timestamps: true }
);

// Ensure a participant cannot have duplicate pigeon numbers in the same competition
pigeonFlightSchema.index({ participant: 1, pigeonNumber: 1, competition: 1 }, { unique: true });


// Mongoose middleware to trigger results update AFTER a pigeon flight is deleted
pigeonFlightSchema.post('findOneAndDelete', async function(doc, next) {
  // `doc` is the document that was deleted.
  if (doc && doc.competition) {
    const competitionId = doc.competition.toString(); // Ensure it's a string
    try {
      console.log(`[POST-DELETE PIGEONFLIGHT] PigeonFlight ${doc._id} deleted for competition ${competitionId}. Triggering results update.`);
      await competitionService.calculateCompetitionResults(competitionId);
    } catch (error) {
      console.error(`[POST-DELETE PIGEONFLIGHT] Error triggering results update for competition ${competitionId} after deleting PigeonFlight ${doc._id}:`, error);
      // Log error, but don't fail the overall flow as the delete itself was successful.
    }
  }
  next();
});

module.exports = mongoose.model('PigeonFlight', pigeonFlightSchema);