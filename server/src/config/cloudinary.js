const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Ensures URLs are HTTPS
});

/**
 * Uploads an image to Cloudinary.
 * @param {string} fileBuffer - The file buffer or base64 string.
 * @param {string} folder - The folder in Cloudinary to upload to.
 * @param {string} public_id - Optional public_id for the image.
 * @returns {Promise<object>} - The Cloudinary upload response.
 */
const uploadImage = (fileBuffer, folder, public_id = undefined) => {
  return new Promise((resolve, reject) => {
    const options = { folder };
    if (public_id) {
      options.public_id = public_id;
      options.overwrite = true;
    }

    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(fileBuffer);
  });
};

/**
 * Deletes an image from Cloudinary.
 * @param {string} public_id - The public_id of the image to delete.
 * @returns {Promise<object>} - The Cloudinary deletion response.
 */
const deleteImage = (public_id) => {
  return cloudinary.uploader.destroy(public_id);
};

module.exports = { uploadImage, deleteImage, cloudinary };