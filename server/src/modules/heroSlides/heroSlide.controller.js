const heroSlideService = require('./heroSlide.service');
const { uploadImage, deleteImage } = require('../../config/cloudinary'); // Adjusted path
const { getIo } = require('../../common/utils/socketManager'); // Adjust path if necessary

exports.createSlide = async (req, res, next) => {
  try {
    const slideData = { ...req.body };
    if (!req.file) {
      const err = new Error('Hero slide image is required.');
      err.statusCode = 400;
      return next(err);
    }

    try {
      const result = await uploadImage(req.file.buffer, 'hero-slides'); // Folder in Cloudinary
      slideData.imageUrl = result.secure_url;
      slideData.imagePublicId = result.public_id;
    } catch (uploadError) {
      console.error('Hero slide image upload failed:', uploadError);
      const err = new Error('Hero slide image upload failed. Please try again.');
      err.statusCode = 500;
      return next(err);
    }

    // Ensure 'order' is a number if provided, or set a default
    slideData.order = slideData.order ? Number(slideData.order) : 0;
    slideData.isActive = slideData.isActive !== undefined ? slideData.isActive : true;

    
    const newSlide = await heroSlideService.createSlide(slideData);
    // Emit event after successful creation
    const io = getIo();
    if (io) {
      io.emit('heroSlidesUpdated'); // General event, client will re-fetch
    }
    res.status(201).json({ success: true, data: newSlide, message: 'Hero slide created successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') error.statusCode = 400;
    next(error);
  }
};

exports.getAllSlides = async (req, res, next) => {
  try {
    // For public view, usually only active slides. Admin might see all.
    const onlyActive = req.query.activeOnly !== 'false'; // Default to true unless 'false' is passed
    const slides = await heroSlideService.getAllSlides(onlyActive);
    res.status(200).json({ success: true, count: slides.length, data: slides });
  } catch (error) {
    next(error);
  }
};

exports.updateSlide = async (req, res, next) => {
  try {
    const slideId = req.params.id;
    const updateData = { ...req.body };
    let oldImagePublicId = null;

    const existingSlide = await heroSlideService.getSlideById(slideId);
    if (!existingSlide) {
      const err = new Error('Hero slide not found');
      err.statusCode = 404;
      return next(err);
    }
    oldImagePublicId = existingSlide.imagePublicId;

    if (req.file) { // If a new image is uploaded
      try {
        const result = await uploadImage(req.file.buffer, 'hero-slides');
        updateData.imageUrl = result.secure_url;
        updateData.imagePublicId = result.public_id;
      } catch (uploadError) {
        const err = new Error('Hero slide image upload failed during update.');
        err.statusCode = 500; return next(err);
      }
    }

    const updatedSlide = await heroSlideService.updateSlide(slideId, updateData);

    if (req.file && oldImagePublicId && oldImagePublicId !== updatedSlide.imagePublicId) {
      try { await deleteImage(oldImagePublicId); }
      catch (e) { console.error("Failed to delete old hero slide image:", e); }
    }
    // Emit event after successful update
    const io = getIo();
    if (io) {
      io.emit('heroSlidesUpdated');
    }
    res.status(200).json({ success: true, data: updatedSlide, message: 'Hero slide updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') error.statusCode = 400;
    next(error);
  }
};

exports.deleteSlide = async (req, res, next) => {
  try {
    const slideId = req.params.id;
    const slideToDelete = await heroSlideService.getSlideById(slideId);

    if (!slideToDelete) {
      const err = new Error('Hero slide not found');
      err.statusCode = 404;
      return next(err);
    }

    if (slideToDelete.imagePublicId) {
      try { await deleteImage(slideToDelete.imagePublicId); }
      catch (e) { console.error("Failed to delete hero slide image from Cloudinary:", e); }
    }

    await heroSlideService.deleteSlide(slideId);
    // Emit event after successful deletion
    const io = getIo();
    if (io) {
      io.emit('heroSlidesUpdated');
    }
    res.status(200).json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    next(error);
  }
};