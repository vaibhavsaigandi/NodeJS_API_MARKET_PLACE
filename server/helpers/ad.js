import Ad from "../models/ad.js";
export const incrementViewCount = async (adId) => {
  try {
    await Ad.findByIdAndUpdate(adId, { $inc: { views: 1 } });
  } catch (error) {
    console.error("Error incrementing view count:", error);
  }
};
// use in read()
// controllers/ad
import { incrementViewCount } from "../helpers/ad.js";
// Increment view count asynchronously
incrementViewCount(ad._id);
// res.json({ ad, related: relatedWithPopulatedPostedBy });
