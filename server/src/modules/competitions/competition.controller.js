const competitionService = require('./competition.service');
const { uploadImage, deleteImage } = require('../../config/cloudinary'); // Adjusted path

// Create a new competition
exports.createCompetition = async (req, res, next) => {
  try {
    const competitionData = { ...req.body };

    if (req.file) {
      try {
        const result = await uploadImage(req.file.buffer, 'competitions/covers');
        competitionData.coverPhotoUrl = result.secure_url;
        competitionData.coverPhotoPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Decide if you want to proceed without an image or return an error
        // For now, let's pass a specific error to the global error handler
        const err = new Error('Cover photo upload failed. Please try again.');
        err.statusCode = 500; // Internal Server Error or a more specific one
        return next(err);
      }
    }
    const newCompetition = await competitionService.createCompetition(competitionData);
    res.status(201).json({ success: true, data: newCompetition, message: 'Competition created successfully' });
  } catch (error) {
    // Mongoose validation errors often have a 'name' of 'ValidationError'
    if (error.name === 'ValidationError') {
      error.statusCode = 400;
    }
    next(error); // Pass to global error handler
  }
};

// Get all competitions
exports.getAllCompetitions = async (req, res, next) => {
  try {
    const competitions = await competitionService.getAllCompetitions();
    res.status(200).json({ success: true, count: competitions.length, data: competitions });
  } catch (error) {
    next(error);
  }
};

// Get a single competition by ID
exports.getCompetitionById = async (req, res, next) => {
  try {
    const competition = await competitionService.getCompetitionById(req.params.id);
    if (!competition) {
      const err = new Error('Competition not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, data: competition });
  } catch (error) {
    next(error);
  }
};

// Update a competition by ID
exports.updateCompetition = async (req, res, next) => {
  try {
    const competitionId = req.params.id;
    const updateData = { ...req.body };
    let oldCoverPhotoPublicId = null; // To store the public_id of the image to be deleted

    // Fetch existing competition to handle old image deletion if a new one is uploaded
    // or if removal is requested.
    const existingCompetition = await competitionService.getCompetitionById(competitionId);
    if (!existingCompetition) {
      const err = new Error('Competition not found for update');
      err.statusCode = 404;
      return next(err);
    }

    oldCoverPhotoPublicId = existingCompetition.coverPhotoPublicId; // Store before potential update

    if (req.file) { // If a new file is uploaded
      // The old image will be deleted after successful DB update
      // if a new image is uploaded and successfully saved.
      try {
        const result = await uploadImage(req.file.buffer, 'competitions/covers');
        updateData.coverPhotoUrl = result.secure_url;
        updateData.coverPhotoPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload failed for update:', uploadError);
        const err = new Error('Cover photo upload failed during update. Please try again.');
        err.statusCode = 500;
        return next(err);
      }
    }
    // Add logic here if you want to allow removing an image without uploading a new one
    // e.g., if (req.body.removeCoverPhoto === 'true' && existingCompetition.coverPhotoPublicId) { ... deleteImage logic ... updateData.coverPhotoUrl = ''; updateData.coverPhotoPublicId = ''; }

    const updatedCompetition = await competitionService.updateCompetition(competitionId, updateData);

    // If the DB update was successful AND a new image was uploaded (implying replacement)
    // AND there was an old image different from the new one, then delete the old image from Cloudinary.
    if (updatedCompetition && req.file && oldCoverPhotoPublicId && oldCoverPhotoPublicId !== updatedCompetition.coverPhotoPublicId) {
      try {
        await deleteImage(oldCoverPhotoPublicId);
        console.log(`Successfully deleted old cover photo ${oldCoverPhotoPublicId} from Cloudinary.`);
      } catch (deleteError) {
        console.error(`Failed to delete old cover photo ${oldCoverPhotoPublicId} from Cloudinary after DB update:`, deleteError);
        // Log this error. The main operation (DB update) was successful.
      }
    }
    res.status(200).json({ success: true, data: updatedCompetition, message: 'Competition updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 400;
    }
    next(error);
  }
};

// Delete a competition by ID
exports.deleteCompetition = async (req, res, next) => {
  try {
    const competitionId = req.params.id;
    const competitionToDelete = await competitionService.getCompetitionById(competitionId); // Fetch to get public_id
    if (!competitionToDelete) {
      const err = new Error('Competition not found for deletion');
      err.statusCode = 404;
      return next(err);
    }

    if (competitionToDelete.coverPhotoPublicId) {
      try {
        await deleteImage(competitionToDelete.coverPhotoPublicId);
        console.log(`Successfully deleted cover photo ${competitionToDelete.coverPhotoPublicId} from Cloudinary during competition deletion.`);
      } catch (deleteError) {
        console.error(`Failed to delete cover photo ${competitionToDelete.coverPhotoPublicId} from Cloudinary during competition deletion:`, deleteError);
        // Log error, but proceed with DB deletion as primary operation.
      }
    }
    await competitionService.deleteCompetition(competitionId);
    res.status(200).json({ success: true, message: 'Competition deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get calculated results for a competition
exports.getCompetitionResults = async (req, res, next) => {
  try {
    const results = await competitionService.calculateCompetitionResults(req.params.id);
    if (!results) { // Should not happen if service throws specific errors for not found
      const err = new Error('Results could not be calculated or competition not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};