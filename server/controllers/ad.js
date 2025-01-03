import { uploadImageToS3, deleteImageFromS3 } from "../helpers/upload.js"; // Import the function from the helpers file
import { geocodeAddress } from "../helpers/google.js";
import { sendContactEmailToAgent } from "../helpers/email.js";
import User from "../models/user.js";
import Ad from "../models/ad.js";
import { nanoid } from "nanoid";
import slugify from "slugify";
export const uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.length === 0) {
      return res.json({ error: "No files were uploaded" }); // Return an error if no files were uploaded
    }
    //if only one file was uploaded, multer returns it as an object, not a array
    const files = Array.isArray(req.files) ? req.files : [req.files]; //check if the files are in an array or object and convert it to an array
    //upload image to s3
    const results = await uploadImageToS3(files, req.user._id); //call the function to upload the image to s3
    console.log("upload Image results:", results);
    res.json({ images: results }); //return the results
  } catch (err) {
    console.log("upload image error", err);
    res.json({ error: "Something went wrong. Try agian" });
  }
};

// export const removeImage = async (req, res) => {
//   try {
//     const { Key, uploadedBy } = req.body; //get the key and uploadedBy from the request body}
//     //check if the comment user id matches the user id of the user who uploaded the image
//     if (uploadedBy !== req.user._id) {
//       return res
//         .status(401)
//         .json({ error: "You are not authorized to remove this image" }); //return an error if the user is not authorized

//         try {
//           await deleteImageFromS3(Key); //call the function to delete the image from s3
//           res.json({ message: "Image removed successfully" }); //return a success message
//         }
//         catch (err) { //catch any errors that occur when deleting the image from s3 and return an error
//           console.log("delete image error", err);
//           return res.json({
//             error: "Remove image failed, Something went wrong. Try agian",
//           });}
//   } catch (err) {
//     console.log("remove image error", err);
//     res.json({
//       error: " Remove image failed ,Something went wrong. Try agian",
//     });
//   }
// };
export const removeImage = async (req, res) => {
  const { Key, uploadedBy } = req.body;
  // Check if the current user ID matches the uploadedBy ID
  if (req.user._id.toString() !== uploadedBy.toString()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await deleteImageFromS3(Key);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error removing image:", error);
    return res.status(500).json({ error: "Error removing image. Try again." });
  }
};

export const createAd = async (req, res) => {
  try {
    const {
      photos,
      description,
      address,
      propertyType,
      price,
      landsize,
      landsizetype,
      action,
    } = req.body;
    // Helper error message function
    const isRequired = (v) => {
      res.json({ error: `${v} is required` });
      return; // Return to stop further execution
    };
    // Validate required fields
    if (!photos || photos.length === 0) return isRequired("Photo");
    if (!price) return isRequired("Price");
    if (!address) return isRequired("Address");
    if (!propertyType) return isRequired("Property type");
    if (!action) return isRequired("Action");
    if (!description) return isRequired("Description");
    if (propertyType === "Land") {
      if (!landsize) return isRequired("Land size");
      if (!landsizetype) return isRequired("Land size type");
    }
    // Geocode address
    let geo;
    ``;
    try {
      geo = await geocodeAddress(address);
      // Create new ad
      const ad = await new Ad({
        ...req.body,
        slug: slugify(
          `${propertyType}-for-${action}-address-${address}-
  price-${price}-${nanoid(6)}`
        ),
        postedBy: req.user._id,
        location: {
          type: "Point",
          coordinates: [
            geo?.location?.coordinates[0],
            geo?.location?.coordinates[1],
          ],
        },
        googleMap: geo.googleMap,
      }).save();
      // Update user role to Seller
      const user = await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { role: "Seller" },
      });
      user.password = undefined; // Remove password from user object
      res.json({ ad, user });
      // res.json({ success: true });
    } catch (err) {
      console.error("Geocoding error:", err);
      return res.json({
        error: "Please enter a valid address.",
      });
    }
  } catch (err) {
    console.error("Ad creation error:", err);
    res
      .status(500)
      .json({ error: "Failed to create ad. Please try again later." });
  }
};
// send this from postman
// "address": "200 George St Sydney NSW"
export const read = async (req, res) => {
  try {
    const { slug } = req.params;
    const ad = await Ad.findOne({ slug })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company photologo");
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    const related = await Ad.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: ad.location.coordinates,
          },
          distanceField: "dist.calculated",
          maxDistance: 50000, // 50 km
          spherical: true,
        },
      },
      {
        $match: {
          _id: { $ne: ad._id },
          action: ad.action,
          type: ad.type,
        },
      },
      { $limit: 3 },
      {
        $project: {
          googleMap: 0,
        },
      },
    ]);
    // Populate 'postedBy' field for related ads
    const relatedWithPopulatedPostedBy = await Ad.populate(related, {
      path: "postedBy",
      select: "name username email phone company photo logo",
    });
    res.json({ ad, related: relatedWithPopulatedPostedBy });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const adsForSell = async (req, res) => {
  try {
    const page = req.params.page ? req.params.page : 1;
    const pageSize = 2; // 24
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ action: "Sell" });
    const ads = await Ad.find({ action: "Sell" })
      .populate("postedBy", "name username email phone company photologo")
      .select("-googleMap")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    return res.json({
      ads,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};
// postman
// ads-for-sell/1
export const adsForRent = async (req, res) => {
  try {
    const page = req.params.page ? req.params.page : 1;
    const pageSize = 2; // 24
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ action: "Sell" });
    const ads = await Ad.find({ action: "Rent" })
      .populate("postedBy", "name username email phone company photologo")
      .select("-googleMap")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    return res.json({
      ads,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const updateAd = async (req, res) => {
  try {
    const { slug } = req.params; // Get the slug parameter from therequest URL
    const {
      photos,
      description,
      address,
      propertyType,
      price,
      landsize,
      landsizetype,
      action,
    } = req.body;
    // Helper error message function
    const isRequired = (v) => {
      res.json({ error: `${v} is required` });
      return; // Return to stop further execution
    };
    // Validate required fields
    if (!photos || photos.length === 0) return isRequired("Photo");
    if (!price) return isRequired("Price");
    if (!address) return isRequired("Address");
    if (!propertyType) return isRequired("Property type");
    if (!action) return isRequired("Action");
    if (!description) return isRequired("Description");
    if (propertyType === "Land") {
      if (!landsize) return isRequired("Land size");
      if (!landsizetype) return isRequired("Land size type");
    }
    // Find the ad to check the owner
    const ad = await Ad.findOne({ slug }).populate("postedBy", "_id");
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    // Check if the logged-in user is the owner of the ad
    if (ad.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    // Geocode address
    let geo;
    try {
      geo = await geocodeAddress(address);
      // Update existing ad by slug
      const updatedAd = await Ad.findOneAndUpdate(
        { slug },
        {
          ...req.body,
          slug: slugify(
            `${propertyType}-for-${action}-address-${address}-
price-${price}-${nanoid(6)}`
          ),
          location: {
            type: "Point",
            coordinates: [
              geo?.location?.coordinates[0],
              geo?.location?.coordinates[1],
            ],
          },
          googleMap: geo.googleMap,
        },
        { new: true }
      );
      // res.json({ ad: updatedAd, user });
      res.json({ success: true }); // Send success response
    } catch (err) {
      console.error("Geocoding error:", err);
      return res.json({
        error: "Please enter a valid address.",
      });
    }
  } catch (err) {
    console.error("Ad update error:", err);
    res
      .status(500)
      .json({ error: "Failed to update ad. Please try again later." });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const { slug } = req.params; // Get the slug parameter from the request URL
    // Find the ad by slug
    const ad = await Ad.findOne({ slug });
    // Check if ad exists
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    // Check if the current user is the one who posted the ad
    if (ad.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Delete the ad
    await Ad.deleteOne({ slug });
    res.json({ success: true });
  } catch (err) {
    console.error("Ad deletion error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete ad. Please try again later." });
  }
};

export const userAds = async (req, res) => {
  try {
    const page = req.params.page ? req.params.page : 1;
    const pageSize = 2; // Adjust the page size as needed
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ postedBy: req.user._id });
    const ads = await Ad.find({ postedBy: req.user._id })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    return res.json({
      ads,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const updateAdStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { status } = req.body;
    // Find the ad by slug
    const ad = await Ad.findOne({ slug });
    // Check if ad exists
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    } // Check if the ad was posted by the currently logged-in user
    if (ad.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Update the status
    ad.status = status;
    await ad.save();
    res.json({ success: true, ad });
  } catch (err) {
    console.error("Error updating ad status:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res
      .status(500)
      .json({ error: "Failed to update ad status. Please try again later." });
  }
};

export const contactAgent = async (req, res) => {
  try {
    const { adId, message } = req.body;
    const ad = await Ad.findById(adId).populate("postedBy");
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    // addToSet ad's _id to user's enquiredProperties
    const user = await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enquiredProperties: ad._id },
    });
    // send contact email to agent with user name phone email and ad link
    await sendContactEmailToAgent(ad, user, message);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({
      error: "Something went wrong. Please try again.",
    });
  }
};
export const enquiredAds = async (req, res) => {
  try {
    const page = req.params.page ? parseInt(req.params.page) : 1;
    const pageSize = 2; // 24
    const skip = (page - 1) * pageSize;
    const user = await User.findById(req.user._id);
    // Use $in to find ads with IDs in user.enquiredProperties
    const totalAds = await Ad.countDocuments({
      _id: { $in: user.enquiredProperties },
    });
    const ads = await Ad.find({ _id: { $in: user.enquiredProperties } })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    return res.json({
      ads,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const adId = req.params.adId;
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the ad is already in the user's wishlist
    const isInWishlist = user.wishlist.includes(adId);
    // Toggle the wishlist
    const update = isInWishlist
      ? { $pull: { wishlist: adId } }
      : { $addToSet: { wishlist: adId } };
    // Update the user's wishlist
    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    });
    res.json({
      success: true,
      message: isInWishlist
        ? "Ad removed from wishlist"
        : "Ad added to wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update wishlist. Try again." });
  }
};

export const userWishlist = async (req, res) => {
  try {
    const page = req.params.page ? req.params.page : 1;
    const pageSize = 2; // Adjust as needed
    const skip = (page - 1) * pageSize;
    const user = await User.findById(req.user._id);
    const totalAds = await Ad.countDocuments({ _id: { $in: user.wishlist } });
    const ads = await Ad.find({ _id: { $in: user.wishlist } })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    return res.json({
      ads,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const searchAds = async (req, res) => {
  try {
    const {
      address,
      price,
      page = 1,
      action,
      propertyType,
      bedrooms,
      bathrooms,
    } = req.body;
    const pageSize = 2; // Adjust as needed
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    // Geocode the address to get coordinates
    let geo = await geocodeAddress(address);
    // Function to check if a value is numeric
    const isNumeric = (value) => {
      return !isNaN(value) && !isNaN(parseFloat(value));
    };
    // Construct the query object with all search parameters
    let query = {
      // published: true,
      location: {
        $geoWithin: {
          $centerSphere: [
            [geo?.location?.coordinates[0], geo?.location?.coordinates[1]],
            10 / 6371, // 10km radius, converted to radians
          ],
        },
      },
    };
    if (action) {
      query.action = action;
    }
    if (propertyType && propertyType !== "All") {
      query.propertyType = propertyType;
    }
    if (bedrooms && bedrooms !== "All") {
      query.bedrooms = parseInt(bedrooms);
    }
    if (bathrooms && bathrooms !== "All") {
      query.bathrooms = parseInt(bathrooms);
    }
    // Add price range filter to the query only if it's a valid number
    if (isNumeric(price)) {
      const numericPrice = parseFloat(price);
      const minPrice = numericPrice * 0.8;
      const maxPrice = numericPrice * 1.2;
      query.price = {
        $regex: new RegExp(`^(${minPrice.toFixed(0)}|${maxPrice.toFixed(0)})`),
      };
    }
    // Fetch ads matching all criteria, including price range
    let ads = await Ad.find(query)
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .sort({ createdAt: -1 })
      .select("-googleMap");
    // Count total matching ads for pagination
    let totalAds = await Ad.countDocuments(query);
    // Return response with matching ads and pagination information
    return res.json({
      ads,
      total: totalAds,
      page,
      totalPages: Math.ceil(totalAds / pageSize),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to search ads. Try again." });
  }
};

export const togglePublished = async (req, res) => {
  try {
    const adId = req.params.adId;
    const ad = await Ad.findById(adId);
    // Update the published status
    const updatedAd = await Ad.findByIdAndUpdate(
      adId,
      { published: ad.published ? false : true },
      {
        new: true,
      }
    );
    res.json({
      success: true,
      message: ad.published
        ? "Ad removed from wishlist"
        : "Ad added to wishlist",
      ad: updatedAd,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to update published status. Try again." });
  }
};
