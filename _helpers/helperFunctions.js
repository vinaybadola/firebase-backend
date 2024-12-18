const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../models/userModel");

/**
 * Generate a unique slug for a user with retry logic.
 * @param {Object} data - Object containing user details (first_name, last_name).
 * @param {number} maxAttempts - Maximum number of attempts to generate a unique slug.
 * @returns {Promise<string>} - A unique slug or throws an error after max retries.
 */
const generateUniqueSlug = async (data, maxAttempts = 3) => {
  let attempt = 0;
  let slug;

  while (attempt < maxAttempts) {
    slug = slugify(`${data.first_name}-${data.last_name}-${uuidv4()}`, { lower: true });

    const slugExist = await userModel.findOne({ slug });
    if (!slugExist) {
      return slug; // Unique slug found, return it
    }

    attempt++;
  }

  // If no unique slug is found after maxAttempts
  throw new Error("Could not generate a unique slug. Please choose a different name.");
};

module.exports = generateUniqueSlug;
