const participantService = require('./participant.service');
const { uploadImage, deleteImage } = require('../../config/cloudinary'); // Adjusted path
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Add a participant to a competition
exports.addParticipant = async (req, res, next) => {
  try {
    const { name, competitionId } = req.body; // pictureUrl will come from file upload
    const participantData = { name, competitionId };

    if (!name || !competitionId) {
      const err = new Error('Name and Competition ID are required');
      err.statusCode = 400;
      return next(err);
    }

    // Validate if competitionId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      const err = new Error('Invalid Competition ID format provided.');
      err.statusCode = 400; // Bad Request
      return next(err);
    }

    if (req.file) {
      try {
        // Determine folder based on competitionId for better organization in Cloudinary
        const folder = `competitions/${competitionId}/participants`;
        const result = await uploadImage(req.file.buffer, folder);
        participantData.pictureUrl = result.secure_url;
        participantData.picturePublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload failed for participant picture:', uploadError);
        const err = new Error('Participant picture upload failed. Please try again.');
        err.statusCode = 500;
        return next(err);
      }
    }

    // Pass all data (including name, competitionId, and potentially pictureUrl/picturePublicId)
    // The service method should be adapted to handle this object.
    const newParticipant = await participantService.addParticipant(participantData);
    res.status(201).json({ success: true, data: newParticipant, message: 'Participant added successfully' });

  } catch (error) {
    if (error.name === 'ValidationError' && !error.statusCode) {
      error.statusCode = 400;
    }
    next(error);
  }
};

// Get all participants for a specific competition
exports.getParticipantsByCompetition = async (req, res, next) => {
  try {
    const { competitionId } = req.query; // Assuming competitionId is passed as a query parameter
    if (!competitionId) {
      const err = new Error('Competition ID is required as a query parameter');
      err.statusCode = 400;
      return next(err);
    }
    const participants = await participantService.getParticipantsByCompetition(competitionId);
    res.status(200).json({ success: true, count: participants.length, data: participants });
  } catch (error) {
    next(error);
  }
};

// Get a single participant by ID
exports.getParticipantById = async (req, res, next) => {
  try {   
    const participant = await participantService.getParticipantById(req.params.id);
    if (!participant) {
      const err = new Error('Participant not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, data: participant });
  } catch (error) {
    next(error);
  }
};

// Update a participant's details
exports.updateParticipant = async (req, res, next) => {
  try {
    const participantId = req.params.id;
    const updateData = { ...req.body }; // name, etc.
    let oldPicturePublicId = null; // To store the public_id of the image to be deleted

    const existingParticipant = await participantService.getParticipantById(participantId);
    if (!existingParticipant) {
      const err = new Error('Participant not found for update');
      err.statusCode = 404;
      return next(err);
    }

    oldPicturePublicId = existingParticipant.picturePublicId; // Store before potential update

    if (req.file) { // If a new picture is uploaded
      // The old image will be deleted after successful DB update
      // if a new image is uploaded and successfully saved.
      try {
        const folder = `competitions/${existingParticipant.competition.toString()}/participants`; // Use existing competition ID
        const result = await uploadImage(req.file.buffer, folder);
        updateData.pictureUrl = result.secure_url;
        updateData.picturePublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload failed for participant picture update:', uploadError);
        const err = new Error('Participant picture upload failed during update. Please try again.');
        err.statusCode = 500;
        return next(err);
      }
    }
    // Add logic here if you want to allow removing an image without uploading a new one

    const updatedParticipant = await participantService.updateParticipant(participantId, updateData);

    // If the DB update was successful AND a new image was uploaded (implying replacement)
    // AND there was an old image different from the new one, then delete the old image from Cloudinary.
    if (updatedParticipant && req.file && oldPicturePublicId && oldPicturePublicId !== updatedParticipant.picturePublicId) {
      try {
        await deleteImage(oldPicturePublicId);
        console.log(`Successfully deleted old participant picture ${oldPicturePublicId} from Cloudinary.`);
      } catch (deleteError) {
        console.error(`Failed to delete old participant picture ${oldPicturePublicId} from Cloudinary after DB update:`, deleteError);
        // Log this error. The main operation (DB update) was successful.
      }
    }
    res.status(200).json({ success: true, data: updatedParticipant, message: 'Participant updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError' && !error.statusCode) {
      error.statusCode = 400;
    }
    next(error);
  }
};

// Remove a participant
exports.deleteParticipant = async (req, res, next) => {
  try {
    const participantId = req.params.id;
    const participantToDelete = await participantService.getParticipantById(participantId); // Fetch to get public_id

    if (!participantToDelete) {
      const err = new Error('Participant not found for deletion');
      err.statusCode = 404;
      return next(err);
    }

    if (participantToDelete.picturePublicId) {
      try {
        await deleteImage(participantToDelete.picturePublicId);
        console.log(`Successfully deleted participant picture ${participantToDelete.picturePublicId} from Cloudinary during participant deletion.`);
      } catch (deleteError) {
        console.error('Failed to delete participant picture from Cloudinary during participant deletion:', deleteError);
        // Log error but proceed with deleting the participant from DB
      }
    }

    await participantService.deleteParticipant(participantId);
    res.status(200).json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    next(error);
  }
};