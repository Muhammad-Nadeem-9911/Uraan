const express = require('express');
const router = express.Router();
const heroSlideController = require('./heroSlide.controller');
const { protect } = require('../../common/middleware/auth.middleware'); // Assuming admin protection
const upload = require('../../common/middleware/multer');

// GET /api/hero-slides - Get all hero slides (Public, can be filtered by activeOnly query param)
router.get('/', heroSlideController.getAllSlides);

// POST /api/hero-slides - Create a new hero slide (Admin Protected)
router.post('/', protect, upload.single('heroSlideImage'), heroSlideController.createSlide);

// PUT /api/hero-slides/:id - Update a hero slide (Admin Protected)
router.put('/:id', protect, upload.single('heroSlideImage'), heroSlideController.updateSlide);

// DELETE /api/hero-slides/:id - Delete a hero slide (Admin Protected)
router.delete('/:id', protect, heroSlideController.deleteSlide);

module.exports = router;