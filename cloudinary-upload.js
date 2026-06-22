// cloudinary-upload.js — Cloudinary helper (no more HTML hidden inputs!)
const CLOUD_NAME = 'dpxhcifjq';
const UPLOAD_PRESET = 'car_listings';

export { CLOUD_NAME, UPLOAD_PRESET };

/**
 * Upload an image file to Cloudinary.
 * @param {File} file - The image file
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export async function uploadToCloudinary(file) {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    let message = 'Upload failed';
    try {
      const error = await response.json();
      message = error.error?.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await response.json();
  return data.secure_url;
}
