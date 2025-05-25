const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const heroSlideSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required for a hero slide.'],
    },
    imagePublicId: { // For Cloudinary deletion
      type: String,
      required: [true, 'Image Public ID is required for Cloudinary management.'],
    },
    linkUrl: { // Optional URL the slide links to
      type: String,
      trim: true,
    },
    order: { // To control the display order of slides
      type: Number,
      default: 0,
    },
    isActive: { // To easily enable/disable slides
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HeroSlide', heroSlideSchema);