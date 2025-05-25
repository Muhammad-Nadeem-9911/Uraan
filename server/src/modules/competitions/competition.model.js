const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// We'll need to import the Participant and PigeonFlight models here to delete their documents
const Participant = require('../participants/participant.model');
const PigeonFlight = require('../pigeonFlights/pigeonFlight.model');
const { deleteImage } = require('../../config/cloudinary'); // Import deleteImage function - Adjust path if necessary

const competitionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Competition name is required'],
      trim: true,
      maxlength: [60, 'Competition name cannot exceed 60 characters'], // Add maxlength validation
    },
    date: {
      type: Date,
      required: [true, 'Competition date is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ONGOING', 'COMPLETED'],
      required: true,
      default: 'UPCOMING',
    },
    startTime: { // Reference start time for the competition
      type: Date,
      required: [true, 'Competition start time is required'],
    },
    coverPhotoUrl: {
      type: String,
      default: '' // It's good practice to provide a default
    },
    coverPhotoPublicId: { // To store Cloudinary's public_id for deletion
      type: String,
      default: ''
    },
    expectedPigeonsPerParticipant: { // Max pigeons a participant can enter
      type: Number,
      min: 1,
    },
    // We will link participants later using a reference
  },
  { timestamps: true }
);

// Mongoose middleware to cascade delete related participants and pigeon flights
// This hook will run BEFORE a 'findOneAndDelete' operation on a Competition document
competitionSchema.pre('findOneAndDelete', async function (next) {
  const competitionId = this.getQuery()['_id']; // Get the ID of the competition being deleted
  try {
    console.log(`Attempting to delete participants and pigeon flights for competition ID: ${competitionId}`);

    // Find participants associated with this competition BEFORE deleting them
    // Select only the picturePublicId to minimize data fetched
    const participantsToDelete = await Participant.find({ competition: competitionId }).select('picturePublicId');

    // Delete pictures from Cloudinary for each participant
    if (participantsToDelete && participantsToDelete.length > 0) {
      console.log(`Found ${participantsToDelete.length} participants to process for picture deletion.`);
      for (const participant of participantsToDelete) {
        if (participant.picturePublicId) {
          try {
            await deleteImage(participant.picturePublicId);
            console.log(`Successfully deleted participant picture ${participant.picturePublicId} from Cloudinary during competition cascade delete.`);
          } catch (deleteError) {
            console.error(`Failed to delete participant picture ${participant.picturePublicId} from Cloudinary during competition cascade delete:`, deleteError);
            // Log error but continue with other deletions
          }
        }
      }
    }

    // Delete all participants associated with this competition
    await Participant.deleteMany({ competition: competitionId });
    await PigeonFlight.deleteMany({ competition: competitionId });
    next();
  } catch (error) {
    console.error(`Error during cascading delete for competition ID ${competitionId}:`, error);
    next(error); // Pass the error to the next middleware or the operation will hang
  }
});

module.exports = mongoose.model('Competition', competitionSchema);