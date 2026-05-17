// Cloudinary image URL helpers for on-the-fly transformation.
// Cloudinary supports inserting transformation directives into the URL path,
// which lets us serve appropriately sized images without re-uploading.
//
// Format: https://res.cloudinary.com/<cloud>/image/upload/<transforms>/<public_id>
// We inject after `/upload/` if it's a Cloudinary URL, otherwise return as-is.

/**
 * Returns a Cloudinary URL with auto format, auto quality, and width limit.
 * Falls back to original URL for non-Cloudinary sources or empty values.
 *
 * @param {string} url Original image URL
 * @param {number} width Max width in pixels
 * @returns {string}
 */
export function cloudinaryThumb(url, width = 400) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url; // not a Cloudinary URL
  if (url.includes("/upload/f_") || url.includes("/upload/w_")) return url; // already transformed
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

/**
 * Smaller variant for product cards / list items.
 */
export function cloudinaryThumbSmall(url) {
  return cloudinaryThumb(url, 200);
}

/**
 * Larger variant for detail pages / receipts.
 */
export function cloudinaryThumbLarge(url) {
  return cloudinaryThumb(url, 800);
}
