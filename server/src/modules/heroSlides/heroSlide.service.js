const HeroSlide = require('./heroSlide.model');

exports.createSlide = async (slideData) => {
  const slide = new HeroSlide(slideData);
  return await slide.save();
};

exports.getAllSlides = async (onlyActive = true) => {
  const query = onlyActive ? { isActive: true } : {};
  return await HeroSlide.find(query).sort({ order: 1, createdAt: -1 }); // Sort by order, then by creation date
};

exports.getSlideById = async (id) => {
  return await HeroSlide.findById(id);
};

exports.updateSlide = async (id, updateData) => {
  // Ensure order is a number if provided
  if (updateData.order !== undefined) {
    updateData.order = Number(updateData.order);
  }
  return await HeroSlide.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

exports.deleteSlide = async (id) => {
  return await HeroSlide.findByIdAndDelete(id);
};

// Optional: A service function to update the order of multiple slides
exports.updateSlidesOrder = async (slidesOrderArray) => {
  const operations = slidesOrderArray.map(item => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } }
    }
  }));
  if (operations.length > 0) {
    return await HeroSlide.bulkWrite(operations);
  }
  return { message: "No slides to update." };
};